'use client'

import { useState, useCallback } from 'react'
import type { Player, Hex, MapConfig, Event, HexPosition } from '@/types/campaign'
import { 
  MAP_CONFIGS, 
  SURFACE_LOCATIONS, 
  TOMB_LOCATIONS, 
  SURFACE_CONDITIONS, 
  TOMB_CONDITIONS, 
  PLAYER_COLORS, 
  PHASES,
  BattleResultInfo
} from '@/lib/data/campaignData'
import { rollD36, parseValue } from '@/lib/utils/dice'
import { hexId, hexDistance, canExploreHex, isPlayerInBlockedHex } from '@/lib/utils/hexUtils'
import { determinePriority, needsRollOff } from '@/lib/utils/priority'

// Constants for SP management
const SP_MIN = 0
const SP_MAX = 10

// Helper function to clamp SP within valid range
const clampSP = (value: number): number => Math.max(SP_MIN, Math.min(SP_MAX, value))

// Helper function to add history entry
const addHistoryEntry = (
  player: Player,
  round: number,
  phase: string,
  spChange: number,
  cpChange: number,
  reason: string
) => {
  const entry = {
    round,
    phase,
    timestamp: new Date().toISOString(),
    action: reason,
    spBefore: player.supplyPoints,
    spAfter: clampSP(player.supplyPoints + spChange),
    cpBefore: player.campaignPoints,
    cpAfter: player.campaignPoints + cpChange,
  }
  
  return [...(player.history || []), entry]
}

const createInitialHexGrid = (config: MapConfig): Record<string, Hex> => {
  const hexes: Record<string, Hex> = {}
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      const id = hexId(row, col)
      const isSurface = row < config.surfaceRows
      hexes[id] = {
        id,
        row,
        col,
        type: isSurface ? 'surface' : 'tomb',
        explored: false,
        location: 0,
        condition: 0,
        exploredBy: [],
      }
    }
  }
  return hexes
}

const createPlayer = (id: number, name: string, color: string, startHex: HexPosition): Player => ({
  id,
  name,
  color,
  killTeamName: `Kill Team ${id + 1}`,
  position: startHex,
  supplyPoints: 10,
  campaignPoints: 0,
  exploredHexes: 0,
  operativesKilled: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  bases: [startHex],
  camps: [],
  history: [],
})

interface PerformActionParams {
  targetHex?: string
  distance?: number
  cost?: number
}

export function useCampaign() {
  const [gameStarted, setGameStarted] = useState(false)
  const [playerCount, setPlayerCount] = useState(4)
  const [players, setPlayers] = useState<Player[]>([])
  const [hexes, setHexes] = useState<Record<string, Hex>>({})
  const [currentRound, setCurrentRound] = useState(1)
  const [currentPhase, setCurrentPhase] = useState(0)
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [threatLevel, setThreatLevel] = useState(1)
  const [targetThreatLevel, setTargetThreatLevel] = useState(7)
  const [eventLog, setEventLog] = useState<Event[]>([])
  const [soloMode, setSoloMode] = useState(false)
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null)
  const [selectedHex, setSelectedHex] = useState<string | null>(null)
  const [gameEnded, setGameEnded] = useState(false)
  const [battleCompleted, setBattleCompleted] = useState(false)

  const addEvent = useCallback((message: string, type: Event['type'] = 'system') => {
    const event: Event = {
      type,
      icon: type === 'system' ? 'ℹ️' : type === 'movement' ? '➡️' : type === 'exploration' ? '🔍' : 
            type === 'reward' ? '🎁' : type === 'action' ? '⚡' : type === 'battle' ? '⚔️' : 
            type === 'warning' ? '⚠️' : '❌',
      message,
      round: currentRound,
      phase: PHASES[currentPhase] || 'Unknown',
      timestamp: new Date().toLocaleTimeString(),
    }
    setEventLog(prev => [event, ...prev])
  }, [currentRound, currentPhase])

  const startGame = useCallback((numPlayers: number, isSolo = false) => {
    const config = MAP_CONFIGS[numPlayers] || MAP_CONFIGS[4]
    if (!config) return

    setMapConfig(config)
    setSoloMode(isSolo)

    const initialHexes = createInitialHexGrid(config)

    // Set up starting positions (spread across top row for surface)
    const startPositions: HexPosition[] = []
    const spacing = Math.floor(config.cols / numPlayers)
    for (let i = 0; i < numPlayers; i++) {
      const col = Math.min(Math.floor(spacing * i + spacing / 2), config.cols - 1)
      startPositions.push({ row: 0, col })
    }

    // Mark starting hexes as explored with base location
    startPositions.forEach((pos, idx) => {
      const posId = hexId(pos.row, pos.col)
      if (initialHexes[posId]) {
        initialHexes[posId].explored = true
        initialHexes[posId].exploredBy = [idx]
        initialHexes[posId].location = 11 // Base location
        initialHexes[posId].condition = 11 // Clear condition
      }
    })

    // Create players
    const newPlayers: Player[] = []
    for (let i = 0; i < numPlayers; i++) {
      newPlayers.push(createPlayer(i, `Player ${i + 1}`, PLAYER_COLORS[i] || '#ffffff', startPositions[i] || { row: 0, col: 0 }))
    }

    setHexes(initialHexes)
    setPlayers(newPlayers)
    setCurrentRound(1)
    setCurrentPhase(0)
    setCurrentPlayerIndex(0)
    setThreatLevel(1)
    setGameStarted(true)
    setGameEnded(false)
    setEventLog([])
    addEvent(`Campaign started with ${numPlayers} players. Target threat level: ${targetThreatLevel}.`, 'system')
  }, [targetThreatLevel, addEvent])

  const exploreHex = useCallback((hexKey: string) => {
    setHexes(prev => {
      const hex = prev[hexKey]
      if (!hex) return prev

      // Validate hex can be explored (not blocked, not already explored)
      if (!canExploreHex(hex)) {
        if (hex.type === 'blocked') {
          addEvent('Cannot explore blocked hex', 'error')
        } else if (hex.explored) {
          addEvent('Hex already explored', 'warning')
        }
        return prev
      }

      const locations = hex.type === 'surface' ? SURFACE_LOCATIONS : TOMB_LOCATIONS
      const conditions = hex.type === 'surface' ? SURFACE_CONDITIONS : TOMB_CONDITIONS

      const locationRoll = rollD36()
      const conditionRoll = rollD36()

      const location = locations[locationRoll] || locations[11]
      const condition = conditions[conditionRoll] || conditions[11]

      addEvent(`Explored hex ${hexKey}: ${location?.name || 'Unknown'} (${condition?.name || 'Clear'})`, 'exploration')

      // Handle immediate exploration effects
      let spGain = 0
      let cpGain = 0

      if (location && location.effect === 'gainSP' && location.value) {
        spGain = parseValue(location.value)
      }
      if (location && location.effect === 'gainCP' && location.value) {
        cpGain = typeof location.value === 'number' ? location.value : parseValue(location.value)
      }

      if (spGain > 0 || cpGain > 0) {
        setPlayers(prevPlayers => {
          const updated = [...prevPlayers]
          const player = updated[currentPlayerIndex]
          if (!player) return prevPlayers

          const newSP = clampSP(player.supplyPoints + spGain)
          const newCP = player.campaignPoints + cpGain
          
          updated[currentPlayerIndex] = {
            ...player,
            supplyPoints: newSP,
            campaignPoints: newCP,
            exploredHexes: player.exploredHexes + 1,
            history: addHistoryEntry(player, currentRound, PHASES[currentPhase] || 'Unknown', spGain, cpGain, `Explored ${location?.name || 'Unknown'}`)
          }
          if (spGain > 0) addEvent(`Gained ${spGain} SP from ${location?.name || 'Unknown'}`, 'reward')
          if (cpGain > 0) addEvent(`Gained ${cpGain} CP from ${location?.name || 'Unknown'}`, 'reward')
          return updated
        })
      } else {
        setPlayers(prevPlayers => {
          const updated = [...prevPlayers]
          const player = updated[currentPlayerIndex]
          if (!player) return prevPlayers

          updated[currentPlayerIndex] = {
            ...player,
            exploredHexes: player.exploredHexes + 1
          }
          return updated
        })
      }

      // Handle threat increase from tomb exploration in solo mode
      if (soloMode && hex.type === 'tomb' && condition && condition.effect === 'threatIncrease') {
        const threatInc = typeof condition.value === 'number' ? condition.value : 1
        setThreatLevel(prev => Math.min(prev + threatInc, 10))
        addEvent(`Threat level increased by ${threatInc}!`, 'warning')
      }

      return {
        ...prev,
        [hexKey]: {
          ...hex,
          explored: true,
          location: locationRoll,
          condition: conditionRoll,
          exploredBy: [...hex.exploredBy, currentPlayerIndex]
        }
      }
    })
  }, [currentPlayerIndex, currentRound, currentPhase, soloMode, addEvent])

  const movePlayer = useCallback((playerIndex: number, targetHex: string, cost: number) => {
    setPlayers(prev => {
      const updated = [...prev]
      const player = updated[playerIndex]
      if (!player) return prev

      if (player.supplyPoints < cost) {
        addEvent(`${player.name} doesn't have enough SP to move!`, 'error')
        return prev
      }

      const newSP = clampSP(player.supplyPoints - cost)
      
      const targetPos = targetHex.split(',').map(Number)
      updated[playerIndex] = {
        ...player,
        position: { row: targetPos[0] ?? 0, col: targetPos[1] ?? 0 },
        supplyPoints: newSP,
        history: addHistoryEntry(player, currentRound, PHASES[currentPhase] || 'Unknown', -cost, 0, `Moved to hex ${targetHex}`)
      }

      addEvent(`${player.name} moved to ${targetHex} (cost: ${cost} SP)`, 'movement')
      return updated
    })

    // Check if hex needs exploration
    if (hexes[targetHex] && !hexes[targetHex].explored) {
      exploreHex(targetHex)
    }
  }, [hexes, currentRound, currentPhase, exploreHex, addEvent])

  const performAction = useCallback((action: string, params: PerformActionParams = {}) => {
    const player = players[currentPlayerIndex]
    if (!player) return

    const playerPosId = hexId(player.position.row, player.position.col)

    switch (action) {
      case 'RESUPPLY': {
        const hex = hexes[playerPosId]
        let spGain = 1

        // Check if on own base
        const isOnOwnBase = player.bases.some(base => 
          base.row === player.position.row && base.col === player.position.col
        )
        
        // Check if on own camp
        const isOnOwnCamp = player.camps.some(camp => 
          camp.row === player.position.row && camp.col === player.position.col
        )

        if (isOnOwnBase) {
          spGain = 10
        } else if (isOnOwnCamp) {
          spGain = Math.floor(Math.random() * 3) + 4 // D3+3
        }

        // Apply condition modifiers
        if (hex?.condition && SURFACE_CONDITIONS[hex.condition]?.effect === 'bonusResupply') spGain += 1
        if (hex?.condition && TOMB_CONDITIONS[hex.condition]?.effect === 'bonusResupply') spGain += 1
        if (hex?.condition && SURFACE_CONDITIONS[hex.condition]?.effect === 'reducedResupply') spGain -= 1
        if (hex?.condition && TOMB_CONDITIONS[hex.condition]?.effect === 'reducedResupply') spGain -= 1

        // Ensure we don't exceed max SP
        const actualGain = Math.max(0, Math.min(spGain, SP_MAX - player.supplyPoints))
        
        if (actualGain === 0) {
          addEvent(`${player.name} is already at max SP (10)`, 'system')
          break
        }

        setPlayers(prev => {
          const updated = [...prev]
          const currentPlayer = updated[currentPlayerIndex]
          if (!currentPlayer) return prev

          const newSP = clampSP(currentPlayer.supplyPoints + actualGain)
          
          updated[currentPlayerIndex] = {
            ...currentPlayer,
            supplyPoints: newSP,
            history: addHistoryEntry(currentPlayer, currentRound, PHASES[currentPhase] || 'Unknown', actualGain, 0, 'Resupply action')
          }
          return updated
        })

        addEvent(`${player.name} resupplied: +${actualGain} SP`, 'action')
        break
      }

      case 'SCOUT': {
        const { targetHex, distance } = params
        if (!targetHex || !distance) return

        const cost = distance

        if (player.supplyPoints < cost) {
          addEvent(`Not enough SP to scout (need ${cost}, have ${player.supplyPoints})`, 'error')
          return
        }

        setPlayers(prev => {
          const updated = [...prev]
          const currentPlayer = updated[currentPlayerIndex]
          if (!currentPlayer) return prev

          const newSP = clampSP(currentPlayer.supplyPoints - cost)
          
          updated[currentPlayerIndex] = {
            ...currentPlayer,
            supplyPoints: newSP,
            history: addHistoryEntry(currentPlayer, currentRound, PHASES[currentPhase] || 'Unknown', -cost, 0, `Scouted hex ${targetHex}`)
          }
          return updated
        })

        exploreHex(targetHex)
        addEvent(`${player.name} scouted ${targetHex} (cost: ${cost} SP)`, 'action')
        break
      }

      case 'SEARCH': {
        const hex = hexes[playerPosId]
        let spGain = 0
        let cpGain = 0
        let reward = null

        const location = hex?.location ? (hex.type === 'surface' ? SURFACE_LOCATIONS[hex.location] : TOMB_LOCATIONS[hex.location]) : null

        if (location?.effect === 'searchSP') {
          spGain = parseValue(location.value || 'D3')
          reward = `+${spGain} SP`
        } else if (location?.effect === 'searchCP') {
          cpGain = typeof location.value === 'number' ? location.value : parseValue(location.value || '1')
          reward = `+${cpGain} CP`
        }

        if (spGain > 0 || cpGain > 0) {
          setPlayers(prev => {
            const updated = [...prev]
            const currentPlayer = updated[currentPlayerIndex]
            if (!currentPlayer) return prev

            const newSP = clampSP(currentPlayer.supplyPoints + spGain)
            const newCP = currentPlayer.campaignPoints + cpGain
            
            updated[currentPlayerIndex] = {
              ...currentPlayer,
              supplyPoints: newSP,
              campaignPoints: newCP,
              history: addHistoryEntry(currentPlayer, currentRound, PHASES[currentPhase] || 'Unknown', spGain, cpGain, 'Search action')
            }
            return updated
          })
          addEvent(`${player.name} searched and found: ${reward}`, 'action')
        } else {
          addEvent(`${player.name} searched but found nothing`, 'action')
        }
        break
      }

      case 'ENCAMP': {
        const { cost } = params
        if (cost === undefined) return

        const hex = hexes[playerPosId]

        // Check if camp or base already exists
        const hasStructure = players.some(p => 
          p.bases.some(b => b.row === player.position.row && b.col === player.position.col) ||
          p.camps.some(c => c.row === player.position.row && c.col === player.position.col)
        )

        if (hasStructure) {
          addEvent(`Cannot build camp here - already occupied`, 'error')
          return
        }

        if (player.supplyPoints < cost) {
          addEvent(`Not enough SP to encamp (need ${cost})`, 'error')
          return
        }

        // Apply location modifier
        let actualCost = cost
        const location = hex?.location ? (hex.type === 'surface' ? SURFACE_LOCATIONS[hex.location] : TOMB_LOCATIONS[hex.location]) : null
        const condition = hex?.condition ? (hex.type === 'surface' ? SURFACE_CONDITIONS[hex.condition] : TOMB_CONDITIONS[hex.condition]) : null

        if (location?.effect === 'freeEncamp') actualCost = 0
        if (condition?.effect === 'cheapEncamp') actualCost = Math.max(0, actualCost - 1)

        if (player.supplyPoints < actualCost) {
          addEvent(`Not enough SP to encamp (need ${actualCost}, have ${player.supplyPoints})`, 'error')
          return
        }

        setPlayers(prev => {
          const updated = [...prev]
          const currentPlayer = updated[currentPlayerIndex]
          if (!currentPlayer) return prev

          const newSP = clampSP(currentPlayer.supplyPoints - actualCost)
          
          updated[currentPlayerIndex] = {
            ...currentPlayer,
            supplyPoints: newSP,
            camps: [...currentPlayer.camps, player.position],
            history: addHistoryEntry(currentPlayer, currentRound, PHASES[currentPhase] || 'Unknown', -actualCost, 0, `Built camp at hex ${playerPosId}`)
          }
          return updated
        })

        addEvent(`${player.name} built a camp (cost: ${actualCost} SP)`, 'action')
        break
      }

      case 'DEMOLISH': {
        // Find if any other player has a camp at current position
        const targetPlayer = players.find((p, idx) => 
          idx !== currentPlayerIndex && 
          p.camps.some(c => c.row === player.position.row && c.col === player.position.col)
        )

        if (!targetPlayer) {
          addEvent(`No enemy camp to demolish here`, 'error')
          return
        }

        setPlayers(prev => {
          const updated = [...prev]
          const targetIdx = updated.findIndex(p => p.id === targetPlayer.id)
          if (targetIdx === -1) return prev

          const target = updated[targetIdx]
          if (!target) return prev

          updated[targetIdx] = {
            ...target,
            camps: target.camps.filter(c => 
              !(c.row === player.position.row && c.col === player.position.col)
            )
          }
          
          return updated
        })

        addEvent(`${player.name} demolished ${targetPlayer.name}'s camp!`, 'action')
        break
      }
      
      default:
        addEvent(`Unknown action: ${action}`, 'error')
    }
  }, [players, hexes, currentPlayerIndex, currentRound, currentPhase, exploreHex, addEvent])

  const recordBattle = useCallback((result: BattleResultInfo, _opponentIndex: number | null = null, operativesKilled = 0) => {
    setPlayers(prev => {
      const updated = [...prev]
      const player = updated[currentPlayerIndex]
      if (!player) return prev

      const newSP = clampSP(player.supplyPoints + result.spGain)
      const newCP = player.campaignPoints + result.cpGain

      updated[currentPlayerIndex] = {
        ...player,
        supplyPoints: newSP,
        campaignPoints: newCP,
        gamesPlayed: player.gamesPlayed + 1,
        gamesWon: result.name === 'Victory' ? player.gamesWon + 1 : player.gamesWon,
        gamesLost: result.name === 'Defeat' ? player.gamesLost + 1 : player.gamesLost,
        operativesKilled: player.operativesKilled + operativesKilled,
        history: addHistoryEntry(player, currentRound, PHASES[currentPhase] || 'Unknown', result.spGain, result.cpGain, `Battle result: ${result.name}`)
      }

      return updated
    })

    const player = players[currentPlayerIndex]
    if (player) {
      addEvent(`${player.name}: ${result.name} (+${result.cpGain} CP, +${result.spGain} SP)`, 'battle')
    }

    // Mark battle phase as completed
    setBattleCompleted(true)
  }, [players, currentPlayerIndex, currentRound, currentPhase, addEvent])

  const nextPhase = useCallback(() => {
    // Validate Battle phase completion (phase index 1)
    if (currentPhase === 1 && !battleCompleted) {
      addEvent('Cannot advance: You must record a battle result first', 'error')
      return
    }

    if (currentPhase < PHASES.length - 1) {
      setCurrentPhase(prev => prev + 1)
      addEvent(`Phase changed to ${PHASES[currentPhase + 1] || 'Unknown'}`, 'system')
    } else {
      // Move to next player or next round
      if (currentPlayerIndex < players.length - 1) {
        setCurrentPlayerIndex(prev => prev + 1)
        setCurrentPhase(0)
        setBattleCompleted(false) // Reset for next player
        const nextPlayer = players[currentPlayerIndex + 1]
        if (nextPlayer) {
          addEvent(`${nextPlayer.name}'s turn`, 'system')
        }
      } else {
        // End of round - increase threat
        const newThreat = threatLevel + 1
        setThreatLevel(newThreat)
        setCurrentRound(prev => prev + 1)
        setCurrentPlayerIndex(0)
        setCurrentPhase(0)
        setBattleCompleted(false) // Reset for new round

        if (newThreat >= targetThreatLevel) {
          setGameEnded(true)
          addEvent(`Campaign ended! Final threat level: ${newThreat}`, 'system')
        } else {
          addEvent(`Round ${currentRound + 1} begins. Threat level: ${newThreat}`, 'system')
        }
      }
    }
  }, [currentPhase, currentPlayerIndex, players, threatLevel, targetThreatLevel, currentRound, battleCompleted, addEvent])

  const updatePlayer = useCallback((playerIndex: number, updates: Partial<Player>) => {
    setPlayers(prev => {
      const updated = [...prev]
      const player = updated[playerIndex]
      if (!player) return prev

      updated[playerIndex] = { ...player, ...updates }
      return updated
    })
  }, [])

  const calculateEncampCost = useCallback((playerIndex: number): number => {
    const player = players[playerIndex]
    if (!player) return 999

    // Find nearest base or camp
    let minDist = 999
    const playerPos = player.position

    player.bases.forEach(base => {
      const dist = hexDistance(playerPos.row, playerPos.col, base.row, base.col)
      if (dist < minDist) minDist = dist
    })

    player.camps.forEach(camp => {
      const dist = hexDistance(playerPos.row, playerPos.col, camp.row, camp.col)
      if (dist < minDist) minDist = dist
    })

    return minDist
  }, [players])

  const updatePriorities = useCallback(() => {
    const playersWithPriority = determinePriority(players)
    setPlayers(playersWithPriority)
    addEvent('Player priorities updated', 'system')
  }, [players, addEvent])

  const checkRollOff = useCallback((): boolean => {
    return needsRollOff(players)
  }, [players])

  return {
    // State
    gameStarted,
    playerCount,
    players,
    hexes,
    currentRound,
    currentPhase: PHASES[currentPhase] || 'Movement',
    currentPlayerIndex,
    threatLevel,
    targetThreatLevel,
    eventLog,
    soloMode,
    mapConfig,
    selectedHex,
    gameEnded,
    battleCompleted,

    // Setters
    setPlayerCount,
    setTargetThreatLevel,
    setSelectedHex,

    // Actions
    startGame,
    movePlayer,
    exploreHex,
    performAction,
    recordBattle,
    nextPhase,
    updatePlayer,
    calculateEncampCost,
    addEvent,
    updatePriorities,
    checkRollOff,
  }
}
