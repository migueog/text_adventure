'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Player, Hex, MapConfig, Event, HexPosition, EncampOptions, ThreatWarningLevel, BattleResult } from '@/types/campaign'
import type { ExtendedBattleRecord } from '@/types/battle'
import {
  MAP_CONFIGS,
  SURFACE_LOCATIONS,
  TOMB_LOCATIONS,
  SURFACE_CONDITIONS,
  TOMB_CONDITIONS,
  PLAYER_COLORS,
  PHASES,
  THREAT_LEVELS,
  BattleResultInfo
} from '@/lib/data/campaignData'
import { rollD36, parseValue } from '@/lib/utils/dice'
import { hexId, hexDistance, canExploreHex, findNearestBaseOrCamp } from '@/lib/utils/hexUtils'
import { determinePriority, needsRollOff } from '@/lib/utils/priority'
import { calculateActionPhaseOrder } from '@/lib/utils/actionPhaseUtils'
import { calculateResupply } from '@/lib/utils/resupply'
import { resolveSearchRule, canPerformSearch } from '@/lib/utils/search'
import { determineActiveCondition, getKillzoneRecommendation } from '@/lib/utils/battleCondition'
import { createMissingPlayerRecords } from '@/lib/utils/battleRewards'
import type { ActiveBattleCondition, KillzoneRecommendation } from '@/types/battleCondition'

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
  battleResult: null,
  searchedHexes: [],  // WHY: Track which hexes this player has searched (one-time use)
  battleHistory: [],  // WHY: Initialize empty battle history for Demolish prerequisites
})

interface PerformActionParams {
  targetHex?: string
  distance?: number
  cost?: number
  options?: EncampOptions | import('@/types/campaign').DemolishOptions  // WHY: Encamp and Demolish action options
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
  const [threatWarning, setThreatWarning] = useState<ThreatWarningLevel>('none')
  const [eventLog, setEventLog] = useState<Event[]>([])
  const [soloMode, setSoloMode] = useState(false)
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null)
  const [selectedHex, setSelectedHex] = useState<string | null>(null)
  const [gameEnded, setGameEnded] = useState(false)
  const [battleCompleted, setBattleCompleted] = useState(false)
  const [extendedMode, setExtendedMode] = useState(false)
  const [explorationResult, setExplorationResult] = useState<{
    hexId: string
    hexNumber: number
    location: { name: string; description: string; effect: string }
    condition: { name: string; description: string; effect: string }
    locationRoll: number
    conditionRoll: number
    playerName: string
  } | null>(null)

  // WHY: Track movement order and index for priority-based sequential movement
  const [movementOrder, setMovementOrder] = useState<number[]>([])
  const [movementIndex, setMovementIndex] = useState(0)

  // WHY: Track action order and index for battle result-based turn ordering
  const [actionOrder, setActionOrder] = useState<number[] | null>(null)
  const [actionIndex, setActionIndex] = useState(0)

  // WHY: Track battle condition state for Issue #40
  const [conditionEnabled, setConditionEnabled] = useState(true)
  const [selectedOpponentId, setSelectedOpponentId] = useState<number | null>(null)

  // WHY: Use refs to avoid stale closure issues in callbacks
  // Refs are updated synchronously in setState callbacks, not via useEffect
  const currentRoundRef = useRef(currentRound)
  const currentPhaseRef = useRef(currentPhase)
  const currentPlayerIndexRef = useRef(currentPlayerIndex)
  const playersRef = useRef(players)

  // WHY: Keep playersRef in sync (players array changes frequently)
  useEffect(() => {
    playersRef.current = players
  }, [players])

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

  /**
   * Calculate threat warning level based on distance to target
   * WHY: Warn players when approaching campaign end
   */
  const calculateThreatWarning = useCallback((current: number, target: number): ThreatWarningLevel => {
    const distance = target - current
    if (distance <= 1) return 'critical'
    if (distance === 2) return 'moderate'
    return 'none'
  }, [])

  /**
   * Increase threat level with warning updates and event logging
   * WHY: Centralize threat logic for consistency and event logging
   */
  const increaseThreat = useCallback((amount: number, reason: string): void => {
    setThreatLevel(prev => {
      const newThreat = Math.min(prev + amount, 10)
      const warning = calculateThreatWarning(newThreat, targetThreatLevel)

      setThreatWarning(warning)
      addEvent(`Threat increased by ${amount}: ${reason}`, 'warning')

      // WHY: Inform players when approaching campaign end
      if (warning === 'critical') {
        addEvent(`⚠️ CRITICAL: Only ${targetThreatLevel - newThreat} level(s) from campaign end!`, 'warning')
      } else if (warning === 'moderate') {
        addEvent(`⚠️ WARNING: ${targetThreatLevel - newThreat} levels from campaign end`, 'warning')
      }

      return newThreat
    })
  }, [targetThreatLevel, calculateThreatWarning, addEvent])

  /**
   * Enable extended campaign mode
   * WHY: Allows campaign to continue beyond target threat level
   */
  const enableExtendedMode = useCallback(() => {
    setExtendedMode(true)
    setGameEnded(false) // Re-open the game
    addEvent('Campaign extended beyond target threat level', 'system')
  }, [addEvent])

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

    // WHY: Calculate initial movement order based on priority
    const initialOrder = isSolo ? [0] : determinePriority(newPlayers).map(p => p.id)
    setMovementOrder(initialOrder)
    setMovementIndex(0)

    addEvent(`Campaign started with ${numPlayers} players. Target threat level: ${targetThreatLevel}.`, 'system')
    // WHY: Show movement order for first round
    if (!isSolo) {
      const orderNames = initialOrder.map(i => newPlayers[i]?.name || `Player ${i + 1}`).join(' → ')
      addEvent(`Movement order: ${orderNames}`, 'system')
    }
  }, [targetThreatLevel, addEvent])

  // WHY: Reset battleResult fields at Battle Phase start (new round)
  useEffect(() => {
    if (currentPhase === 1 && PHASES[currentPhase] === 'Battle') {  // Battle Phase index is 1
      setPlayers(prev => prev.map(p => ({ ...p, battleResult: null })))
    }
  }, [currentPhase])

  // WHY: Calculate action order when entering Action Phase
  useEffect(() => {
    if (currentPhase === 2 && PHASES[currentPhase] === 'Action' && actionOrder === null) {  // Action Phase index is 2
      const order = calculateActionPhaseOrder(players, determinePriority)
      setActionOrder(order)
      setActionIndex(0)

      // Log action order for transparency
      if (order.length > 0) {
        const orderNames = order.map(i => players[i]?.name || `Player ${i}`).join(' → ')
        addEvent(`Action order: ${orderNames}`, 'system')
      }
    }
  }, [currentPhase, actionOrder, players, addEvent])

  // WHY: Reset action order when leaving Action Phase
  useEffect(() => {
    if (currentPhase !== 2 && actionOrder !== null) {  // Not in Action Phase
      setActionOrder(null)
      setActionIndex(0)
    }
  }, [currentPhase, actionOrder])

  /**
   * Clear the exploration result modal state
   * WHY: Allows closing the exploration result modal after user reviews it
   */
  const clearExplorationResult = useCallback(() => {
    setExplorationResult(null)
  }, [])

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

      // Set exploration result for modal display
      const hexNumber = hex.row * (mapConfig?.cols || 5) + hex.col + 1
      const currentPlayer = players[currentPlayerIndex]
      setExplorationResult({
        hexId: hexKey,
        hexNumber,
        location: {
          name: location?.name || 'Unknown',
          description: location?.description || '',
          effect: location?.effect || ''
        },
        condition: {
          name: condition?.name || 'Clear',
          description: condition?.description || '',
          effect: condition?.effect || ''
        },
        locationRoll,
        conditionRoll,
        playerName: currentPlayer?.name || 'Unknown Player'
      })

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
        // WHY: Use centralized threat increase with warning logic
        increaseThreat(threatInc, condition.name || 'Tomb exploration')
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
  }, [currentPlayerIndex, currentRound, currentPhase, soloMode, addEvent, players, mapConfig])

  const movePlayer = useCallback((playerIndex: number, targetHex: string, cost: number) => {
    setPlayers(prev => {
      const updated = [...prev]
      const player = updated[playerIndex]
      if (!player) return prev

      // WHY: Validate maximum distance (3 hexes)
      if (cost > 3) {
        addEvent(`${player.name} cannot move more than 3 hexes! (attempted: ${cost})`, 'error')
        return prev
      }

      // WHY: Validate blocked hex
      const targetHexData = hexes[targetHex]
      if (targetHexData && targetHexData.type === 'blocked') {
        addEvent(`${player.name} cannot move to blocked hex!`, 'error')
        return prev
      }

      // WHY: Validate hex capacity (max 2 players per hex)
      const playersInTargetHex = updated.filter(p => {
        const pHexId = hexId(p.position.row, p.position.col)
        return pHexId === targetHex && p.id !== player.id
      })
      if (playersInTargetHex.length >= 2) {
        addEvent(`${player.name} cannot move to ${targetHex} - already has 2 kill teams!`, 'error')
        return prev
      }

      // WHY: Validate SP availability
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

  // WHY: REGROUP action - move to nearest base/camp for free
  const regroupPlayer = useCallback((playerIndex: number) => {
    setPlayers(prev => {
      const updated = [...prev]
      const player = updated[playerIndex]
      if (!player) return prev

      // Find nearest base or camp
      const nearestDest = findNearestBaseOrCamp(
        player.position,
        player.bases || [],
        player.camps || []
      )

      // If no valid destination, log error and return
      if (!nearestDest) {
        addEvent(`${player.name} has no bases or camps to regroup to!`, 'error')
        return prev
      }

      // Move player to nearest destination (no SP cost)
      updated[playerIndex] = {
        ...player,
        position: nearestDest,
        history: addHistoryEntry(
          player,
          currentRound,
          PHASES[currentPhase] || 'Unknown',
          0,
          0,
          `Regrouped to ${hexId(nearestDest.row, nearestDest.col)}`
        )
      }

      addEvent(
        `${player.name} Regroup to ${hexId(nearestDest.row, nearestDest.col)} (free movement)`,
        'movement'
      )
      return updated
    })
  }, [currentRound, currentPhase, addEvent])

  // WHY: HOLD action - stay in current position (no cost, no movement)
  const holdPosition = useCallback((playerIndex: number) => {
    setPlayers(prev => {
      const updated = [...prev]
      const player = updated[playerIndex]
      if (!player) return prev

      updated[playerIndex] = {
        ...player,
        history: addHistoryEntry(
          player,
          currentRound,
          PHASES[currentPhase] || 'Unknown',
          0,
          0,
          `Held position at ${hexId(player.position.row, player.position.col)}`
        )
      }

      addEvent(
        `${player.name} Hold position at ${hexId(player.position.row, player.position.col)}`,
        'movement'
      )
      return updated
    })
  }, [currentRound, currentPhase, addEvent])

  /**
   * WHY: Validate scout action parameters and target hex
   * Returns null if valid, error message string if invalid
   */
  function validateScout(
    targetHex: string | undefined,
    distance: number | undefined,
    hexes: Record<string, Hex>,
    playerSP: number
  ): string | null {
    if (!targetHex || !distance) {
      return 'Invalid scout parameters'
    }

    const targetHexData = hexes[targetHex]

    if (!targetHexData) {
      return `Cannot scout invalid hex ${targetHex}`
    }

    if (targetHexData.type === 'blocked') {
      return `Cannot scout blocked hex ${targetHex}`
    }

    if (targetHexData.explored) {
      return `Cannot scout ${targetHex} - already explored`
    }

    if (playerSP < distance) {
      return `Not enough SP to scout (need ${distance}, have ${playerSP})`
    }

    return null // Valid
  }

  /**
   * WHY: Validate encamp action parameters and enforce camp limit
   * Returns error message or null if valid
   */
  function validateEncamp(
    currentHex: HexPosition,
    hexes: Record<string, Hex>,
    players: Player[],
    currentPlayerIndex: number,
    campToRemove: HexPosition | undefined
  ): string | null {
    const currentHexId = hexId(currentHex.row, currentHex.col)
    const hex = hexes[currentHexId]
    const player = players[currentPlayerIndex]

    if (!hex || !player) {
      return 'Invalid hex or player'
    }

    // WHY: Cannot camp in blocked hexes
    if (hex.type === 'blocked') {
      return `Cannot build camp in blocked hex ${currentHexId}`
    }

    // WHY: Cannot camp where opponent has base
    for (let i = 0; i < players.length; i++) {
      if (i === currentPlayerIndex) continue
      const opponent = players[i]!

      if (opponent.bases.some(b => b.row === currentHex.row && b.col === currentHex.col)) {
        return `Cannot build camp - opponent has base at ${currentHexId}`
      }

      if (opponent.camps.some(c => c.row === currentHex.row && c.col === currentHex.col)) {
        return `Cannot build camp - opponent has camp at ${currentHexId}`
      }
    }

    // WHY: Enforce 2-camp maximum
    const campCount = player.camps.length
    if (campCount >= 2 && !campToRemove) {
      return 'Cannot build camp - maximum 2 camps allowed. Remove one first.'
    }

    // WHY: Validate campToRemove exists if provided
    if (campToRemove) {
      const campExists = player.camps.some(
        c => c.row === campToRemove.row && c.col === campToRemove.col
      )
      if (!campExists) {
        return `Cannot remove camp at ${hexId(campToRemove.row, campToRemove.col)} - not found`
      }
    }

    return null // Valid
  }

  const performAction = useCallback((action: string, params: PerformActionParams = {}) => {
    const player = players[currentPlayerIndex]
    if (!player) return

    const playerPosId = hexId(player.position.row, player.position.col)

    switch (action) {
      case 'RESUPPLY': {
        const hex = hexes[playerPosId]
        if (!hex) {
          addEvent(`${player.name} cannot resupply - invalid hex`, 'warning')
          break
        }

        // WHY: Use new calculateResupply utility for location-based rewards
        const resupplyResult = calculateResupply(player, hex)
        let spGain = resupplyResult.amount

        // WHY: Apply condition modifiers as additional game mechanic
        if (hex.condition && SURFACE_CONDITIONS[hex.condition]?.effect === 'bonusResupply') spGain += 1
        if (hex.condition && TOMB_CONDITIONS[hex.condition]?.effect === 'bonusResupply') spGain += 1
        if (hex.condition && SURFACE_CONDITIONS[hex.condition]?.effect === 'reducedResupply') spGain -= 1
        if (hex.condition && TOMB_CONDITIONS[hex.condition]?.effect === 'reducedResupply') spGain -= 1

        // WHY: Cap at maximum SP (10)
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
            history: addHistoryEntry(
              currentPlayer,
              currentRound,
              PHASES[currentPhase] || 'Unknown',
              actualGain,
              0,
              resupplyResult.type === 'camp' && resupplyResult.roll
                ? `Resupply at camp (rolled ${resupplyResult.roll}, +${resupplyResult.amount} base)`
                : `Resupply at ${resupplyResult.type}`
            )
          }
          return updated
        })

        // WHY: Create informative event log message
        const locationMsg = resupplyResult.type === 'camp' && resupplyResult.roll
          ? `camp (D3=${resupplyResult.roll}, base +${resupplyResult.amount})`
          : resupplyResult.type
        addEvent(`${player.name} resupplied at ${locationMsg}: +${actualGain} SP`, 'action')
        break
      }

      case 'SCOUT': {
        const { targetHex, distance } = params

        // WHY: Validate all scout preconditions
        const validationError = validateScout(targetHex, distance, hexes, player.supplyPoints)
        if (validationError) {
          const errorType = validationError.includes('already explored') ? 'warning' : 'error'
          addEvent(`${player.name}: ${validationError}`, errorType)
          return
        }

        const cost = distance!

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

        exploreHex(targetHex!)
        addEvent(`${player.name} scouted ${targetHex} (cost: ${cost} SP)`, 'action')
        break
      }

      case 'SEARCH': {
        const hexKey = hexId(player.position.row, player.position.col)
        const hex = hexes[hexKey]
        if (!hex) {
          addEvent(`${player.name} cannot search - invalid hex`, 'warning')
          break
        }

        // WHY: Validate search is allowed
        const validation = canPerformSearch(player, hex, hexKey)
        if (!validation.canSearch) {
          addEvent(`${player.name} cannot search: ${validation.reason}`, 'warning')
          break
        }

        // WHY: Get location and resolve search rule
        const location = hex.type === 'surface'
          ? SURFACE_LOCATIONS[hex.location]
          : TOMB_LOCATIONS[hex.location]

        const result = resolveSearchRule(location?.searchRule)
        if (!result) {
          addEvent(`${player.name} searched but found nothing`, 'action')
          break
        }

        // WHY: Deduct 1 SP cost
        const spCost = 1
        const finalSP = clampSP(player.supplyPoints - spCost + result.spGained)
        const finalCP = player.campaignPoints + result.cpGained

        setPlayers(prev => {
          const updated = [...prev]
          const currentPlayer = updated[currentPlayerIndex]
          if (!currentPlayer) return prev

          updated[currentPlayerIndex] = {
            ...currentPlayer,
            supplyPoints: finalSP,
            campaignPoints: finalCP,
            searchedHexes: [...currentPlayer.searchedHexes, hexKey],  // WHY: Mark hex as searched (one-time use)
            history: addHistoryEntry(
              currentPlayer,
              currentRound,
              PHASES[currentPhase] || 'Unknown',
              -spCost + result.spGained,
              result.cpGained,
              `Search: ${result.description}`
            )
          }
          return updated
        })

        addEvent(`${player.name} searched ${location.name}: ${result.description}`, 'action')
        break
      }

      case 'ENCAMP': {
        const { options } = params
        if (!options) return

        const { cost, campToRemove } = options

        // WHY: Validate all encamp preconditions
        const validationError = validateEncamp(
          player.position,
          hexes,
          players,
          currentPlayerIndex,
          campToRemove
        )

        if (validationError) {
          addEvent(`${player.name}: ${validationError}`, 'error')
          return
        }

        // WHY: Check sufficient SP AFTER validation
        if (player.supplyPoints < cost) {
          addEvent(
            `${player.name}: Not enough SP to build camp (need ${cost}, have ${player.supplyPoints})`,
            'error'
          )
          return
        }

        setPlayers(prev => {
          const updated = [...prev]
          const currentPlayer = updated[currentPlayerIndex]
          if (!currentPlayer) return prev

          let newCamps = [...currentPlayer.camps]

          // WHY: Remove old camp before adding new one (if specified)
          if (campToRemove) {
            newCamps = newCamps.filter(
              c => !(c.row === campToRemove.row && c.col === campToRemove.col)
            )
            addEvent(
              `${player.name} removed camp at ${hexId(campToRemove.row, campToRemove.col)}`,
              'action'
            )
          }

          // WHY: Add new camp at current position
          newCamps.push({ row: player.position.row, col: player.position.col })

          updated[currentPlayerIndex] = {
            ...currentPlayer,
            camps: newCamps,
            supplyPoints: clampSP(currentPlayer.supplyPoints - cost),
            history: addHistoryEntry(
              currentPlayer,
              currentRound,
              PHASES[currentPhase] || 'Unknown',
              -cost,
              0,
              `Built camp at ${playerPosId}${campToRemove ? ` (removed camp at ${hexId(campToRemove.row, campToRemove.col)})` : ''}`
            )
          }

          return updated
        })

        addEvent(
          `${player.name} built camp at ${playerPosId} (cost: ${cost} SP)`,
          'action'
        )
        break
      }

      case 'DEMOLISH': {
        // WHY: Demolish action - destroy opponent's camp (Issue #47, Phase 5)
        const { options } = params
        if (!options) {
          addEvent('No demolish options provided', 'error')
          return
        }

        // WHY: Type-check that options contains targetPlayerId (DemolishOptions)
        const demolishOptions = options as import('@/types/campaign').DemolishOptions
        const targetPlayerId = demolishOptions?.targetPlayerId

        // WHY: Require target player ID to be provided
        if (!targetPlayerId) {
          addEvent('No target selected for demolish', 'error')
          return
        }

        // WHY: Validate prerequisites before allowing demolish
        const validation = validateDemolish(currentPlayerIndex)
        if (!validation.valid) {
          addEvent(`Cannot demolish: ${validation.reason}`, 'error')
          return
        }

        // WHY: Verify target is in validated targets list (security check)
        const validTarget = validation.targets?.find(t => t.playerId === targetPlayerId)
        if (!validTarget) {
          addEvent('Cannot demolish: prerequisite not met for this target', 'error')
          return
        }

        // WHY: Find target player BEFORE state update
        const targetIdx = players.findIndex(p => p.id === targetPlayerId)
        if (targetIdx === -1) {
          addEvent('Target player not found', 'error')
          return
        }

        const target = players[targetIdx]
        if (!target) {
          addEvent('Target player not found', 'error')
          return
        }

        // WHY: Check if target has camp at current position BEFORE state update
        const campExists = target.camps.some(c =>
          c.row === player.position.row && c.col === player.position.col
        )

        if (!campExists) {
          addEvent('No camp found at this position', 'error')
          return
        }

        // WHY: Execute demolish action (all validation passed)
        const DEMOLISH_COST = 3
        setPlayers(prev => {
          const updated = [...prev]
          const currentPlayer = updated[currentPlayerIndex]
          if (!currentPlayer) return prev

          const targetPlayer = updated[targetIdx]
          if (!targetPlayer) return prev

          // WHY: Deduct SP cost
          const newSP = Math.max(0, Math.min(10, currentPlayer.supplyPoints - DEMOLISH_COST))

          // WHY: Remove camp from target player
          updated[targetIdx] = {
            ...targetPlayer,
            camps: targetPlayer.camps.filter(c =>
              !(c.row === currentPlayer.position.row && c.col === currentPlayer.position.col)
            )
          }

          // WHY: Update current player SP and history
          updated[currentPlayerIndex] = {
            ...currentPlayer,
            supplyPoints: newSP,
            history: addHistoryEntry(
              currentPlayer,
              currentRound,
              PHASES[currentPhase] || 'Unknown',
              -DEMOLISH_COST,
              0,
              `Demolished ${target.name}'s camp`
            )
          }

          return updated
        })

        addEvent(`${player.name} demolished ${validTarget.playerName}'s camp at ${hexId(player.position.row, player.position.col)}!`, 'action')
        break
      }
      
      default:
        addEvent(`Unknown action: ${action}`, 'error')
    }
  }, [players, hexes, currentPlayerIndex, currentRound, currentPhase, exploreHex, addEvent])

  /**
   * Record battle result with extended details (Issue #34)
   * WHY: Updated signature accepts full ExtendedBattleRecord minus auto-generated fields
   */
  const recordBattle = useCallback((
    record: Omit<ExtendedBattleRecord, 'round' | 'timestamp'>
  ) => {
    setPlayers(prev => {
      const updated = [...prev]
      const player = updated[currentPlayerIndex]
      if (!player) return prev

      const newSP = clampSP(player.supplyPoints + record.spEarned)
      const newCP = player.campaignPoints + record.cpEarned

      // WHY: Create complete battle record with auto-generated fields
      const battleRecord: ExtendedBattleRecord = {
        ...record,
        round: currentRoundRef.current,
        timestamp: new Date().toISOString()
      }

      // WHY: Initialize battleHistory if undefined (migration from old save data)
      const existingHistory = player.battleHistory || []

      // WHY: Calculate win/loss stats from result
      const isWin = record.result === 'WIN'
      const isLoss = record.result === 'LOSS'

      updated[currentPlayerIndex] = {
        ...player,
        supplyPoints: newSP,
        campaignPoints: newCP,
        gamesPlayed: player.gamesPlayed + 1,
        gamesWon: isWin ? player.gamesWon + 1 : player.gamesWon,
        gamesLost: isLoss ? player.gamesLost + 1 : player.gamesLost,
        operativesKilled: player.operativesKilled + record.operativesKilled,
        battleResult: record.result,  // WHY: Store for Action Phase turn ordering
        battleHistory: [...existingHistory, battleRecord],
        history: addHistoryEntry(
          player,
          currentRoundRef.current,
          PHASES[currentPhase] || 'Unknown',
          record.spEarned,
          record.cpEarned,
          `Battle result: ${record.result}`
        )
      }

      return updated
    })

    const player = players[currentPlayerIndex]
    if (player) {
      addEvent(
        `${player.name}: ${record.result} (+${record.cpEarned} CP, +${record.spEarned} SP)`,
        'battle'
      )
    }

    // Mark battle phase as completed
    setBattleCompleted(true)
  }, [players, currentPlayerIndex, currentPhase, addEvent])

  /**
   * Record missing player scenario (Issue #41)
   *
   * WHY: When an opponent doesn't show up, sporting rules apply:
   * - Present player gets WIN (+1 CP)
   * - Absent player gets LOSS (+1 SP)
   *
   * @param presentPlayerId - ID of player who showed up
   * @param absentPlayerId - ID of player who didn't show
   */
  const recordMissingPlayer = useCallback((
    presentPlayerId: number,
    absentPlayerId: number
  ) => {
    const presentPlayer = players.find(p => p.id === presentPlayerId)
    const absentPlayer = players.find(p => p.id === absentPlayerId)

    if (!presentPlayer || !absentPlayer) {
      console.error('recordMissingPlayer: Invalid player IDs')
      return
    }

    // WHY: Create records for both players
    const { winRecord, lossRecord } = createMissingPlayerRecords(
      presentPlayer,
      absentPlayer,
      currentRoundRef.current
    )

    // WHY: Update both players' state with their respective records
    setPlayers(prev => {
      const updated = [...prev]

      // Update present player with WIN
      const presentIdx = updated.findIndex(p => p.id === presentPlayerId)
      if (presentIdx !== -1) {
        const present = updated[presentIdx]
        updated[presentIdx] = {
          ...present,
          supplyPoints: present.supplyPoints, // WIN gives CP, not SP
          campaignPoints: present.campaignPoints + winRecord.cpEarned,
          gamesPlayed: present.gamesPlayed + 1,
          gamesWon: present.gamesWon + 1,
          battleResult: 'WIN',
          battleHistory: [...(present.battleHistory || []), winRecord],
          history: addHistoryEntry(
            present,
            currentRoundRef.current,
            PHASES[currentPhase] || 'Battle',
            winRecord.spEarned,
            winRecord.cpEarned,
            `Battle result: WIN (opponent absent)`
          )
        }
      }

      // Update absent player with LOSS
      const absentIdx = updated.findIndex(p => p.id === absentPlayerId)
      if (absentIdx !== -1) {
        const absent = updated[absentIdx]
        updated[absentIdx] = {
          ...absent,
          supplyPoints: clampSP(absent.supplyPoints + lossRecord.spEarned),
          campaignPoints: absent.campaignPoints, // LOSS gives SP, not CP
          gamesPlayed: absent.gamesPlayed + 1,
          gamesLost: absent.gamesLost + 1,
          battleResult: 'LOSS',
          battleHistory: [...(absent.battleHistory || []), lossRecord],
          history: addHistoryEntry(
            absent,
            currentRoundRef.current,
            PHASES[currentPhase] || 'Battle',
            lossRecord.spEarned,
            lossRecord.cpEarned,
            `Battle result: LOSS (absent)`
          )
        }
      }

      return updated
    })

    // WHY: Log events for both players
    addEvent(
      `${presentPlayer.name}: WIN (+1 CP) - ${absentPlayer.name} was absent`,
      'battle'
    )
    addEvent(
      `${absentPlayer.name}: LOSS (+1 SP) - marked as absent`,
      'battle'
    )

    // WHY: Mark battle as completed for present player
    setBattleCompleted(true)
  }, [players, currentPhase, addEvent])

  /**
   * Calculate movement order based on player priority
   * WHY: Official rules state players move in priority order (lowest CP → SP)
   * @returns Array of player indices in movement order
   */
  const calculateMovementOrder = useCallback((): number[] => {
    // WHY: Solo mode doesn't need priority calculation
    if (soloMode) return [0]

    // WHY: determinePriority sorts by CP then SP, assigns priority values
    const playersWithPriority = determinePriority(players)
    const order = playersWithPriority.map(p => p.id)

    // WHY: Update player state with priority values for UI display
    setPlayers(playersWithPriority)

    // WHY: Warn if tied players detected (future: show roll-off modal)
    if (needsRollOff(players)) {
      addEvent('Priority tied - using player order', 'warning')
    }

    return order
  }, [players, soloMode, addEvent])

  const nextPhase = useCallback(() => {
    // WHY: Use ref to get current phase (avoids stale closure)
    const phase = currentPhaseRef.current

    // Validate Battle phase completion (phase index 1)
    if (phase === 1 && !battleCompleted) {
      addEvent('Cannot advance: You must record a battle result first', 'error')
      return
    }

    if (phase < PHASES.length - 1) {
      const newPhase = phase + 1
      currentPhaseRef.current = newPhase  // WHY: Update ref BEFORE setState
      setCurrentPhase(newPhase)
      addEvent(`Phase changed to ${PHASES[newPhase] || 'Unknown'}`, 'system')
    } else {
      // Move to next player or next round
      // WHY: Use refs to get current values (avoids stale closure)
      const playerIndex = currentPlayerIndexRef.current
      const currentPlayers = playersRef.current

      if (playerIndex < currentPlayers.length - 1) {
        const newIndex = playerIndex + 1
        currentPlayerIndexRef.current = newIndex  // WHY: Update ref BEFORE setState
        setCurrentPlayerIndex(newIndex)
        currentPhaseRef.current = 0  // WHY: Update ref BEFORE setState
        setCurrentPhase(0)
        setBattleCompleted(false) // Reset for next player
        const nextPlayer = currentPlayers[newIndex]
        if (nextPlayer) {
          addEvent(`${nextPlayer.name}'s turn`, 'system')
        }
      } else {
        // End of round - increase threat
        const currentRoundValue = currentRoundRef.current
        const newRound = currentRoundValue + 1
        currentRoundRef.current = newRound  // WHY: Update ref BEFORE setState
        currentPhaseRef.current = 0  // WHY: Update ref BEFORE setState
        currentPlayerIndexRef.current = 0  // WHY: Update ref BEFORE setState

        // WHY: Use centralized threat increase with warning logic
        increaseThreat(1, 'End of round')
        const newThreat = threatLevel + 1  // WHY: Local value for campaign end check

        setCurrentRound(newRound)
        setCurrentPlayerIndex(0)
        setCurrentPhase(0)
        setBattleCompleted(false) // Reset for new round

        // WHY: Recalculate priority for new round (CP/SP may have changed)
        const newOrder = calculateMovementOrder()
        setMovementOrder(newOrder)
        setMovementIndex(0)

        // Only end game if NOT in extended mode
        if (newThreat >= targetThreatLevel && !extendedMode) {
          setGameEnded(true)
          addEvent(`🔴 CAMPAIGN ENDED! Target threat level ${targetThreatLevel} reached.`, 'system')
          addEvent(`The Necrons have fully awakened at threat level ${newThreat}: ${THREAT_LEVELS[newThreat]}`, 'system')
        } else {
          addEvent(`Round ${currentRoundRef.current} begins. Threat level: ${newThreat}`, 'system')
          // WHY: Log movement order for transparency
          const orderNames = newOrder.map(i => currentPlayers[i]?.name || `Player ${i}`).join(' → ')
          addEvent(`Movement order: ${orderNames}`, 'system')
        }
      }
    }
  }, [currentPhase, currentPlayerIndex, players, threatLevel, targetThreatLevel, currentRound, battleCompleted, extendedMode, addEvent, calculateMovementOrder, increaseThreat])

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

  // WHY: Advance to next player in Action Phase turn order
  const advanceActionTurn = useCallback(() => {
    setActionIndex(prev => {
      if (!actionOrder) return 0
      const nextIndex = prev + 1
      return nextIndex >= actionOrder.length ? 0 : nextIndex
    })
  }, [actionOrder])

  /**
   * Validate if player can perform Demolish action
   * WHY: Demolish requires winning battle against camp owner this round OR challenged-refused/no-show
   *
   * @param playerIndex - Index of player attempting demolish
   * @returns Validation result with valid targets or error reason
   */
  const validateDemolish = useCallback((playerIndex: number): {
    valid: boolean
    reason?: string
    targets?: Array<{ playerId: number; playerName: string }>
    cost: number
  } => {
    const DEMOLISH_COST = 3
    const player = players[playerIndex]

    if (!player) {
      return { valid: false, reason: 'Player not found', cost: DEMOLISH_COST }
    }

    // WHY: Check if player has enough SP
    if (player.supplyPoints < DEMOLISH_COST) {
      return { valid: false, reason: 'Insufficient SP (requires 3 SP)', cost: DEMOLISH_COST }
    }

    // WHY: Find opponent camps at player's current position
    const playerPos = player.position
    const opponentCamps: Array<{ playerId: number; playerName: string }> = []

    players.forEach((opponent, idx) => {
      if (idx === playerIndex) return // Skip self

      opponent.camps.forEach(camp => {
        if (camp.row === playerPos.row && camp.col === playerPos.col) {
          // WHY: Avoid duplicates if same opponent has multiple camps at same position
          if (!opponentCamps.find(c => c.playerId === opponent.id)) {
            opponentCamps.push({ playerId: opponent.id, playerName: opponent.name })
          }
        }
      })
    })

    if (opponentCamps.length === 0) {
      return { valid: false, reason: 'no opponent camps at your position', cost: DEMOLISH_COST }
    }

    // WHY: Check battle history for prerequisites
    const battleHistory = player.battleHistory || []

    if (battleHistory.length === 0) {
      return { valid: false, reason: 'no battle history (must win battle or challenge first)', cost: DEMOLISH_COST }
    }

    // WHY: Filter camps where prerequisites are met (won this round OR challenged-refused/no-show)
    const validTargets = opponentCamps.filter(camp => {
      // WHY: Find battles against this camp owner in current round
      const battleThisRound = battleHistory.find(battle =>
        battle.round === currentRound &&
        battle.opponent === camp.playerId
      )

      if (!battleThisRound) return false

      // WHY: Accept WIN or challenged-refused/no-show statuses
      return (
        battleThisRound.result === 'WIN' ||
        battleThisRound.status === 'challenged-refused' ||
        battleThisRound.status === 'challenged-no-show'
      )
    })

    if (validTargets.length === 0) {
      return {
        valid: false,
        reason: 'Demolish prerequisite not met (must win battle or challenge against camp owner this round)',
        cost: DEMOLISH_COST
      }
    }

    return {
      valid: true,
      targets: validTargets,
      cost: DEMOLISH_COST
    }
  }, [players, currentRound])

  /**
   * Get the active battle condition for the current battle (Issue #40)
   * WHY: Called during Battle Phase to determine which condition applies
   *
   * @param opponentId - The selected opponent's player ID (null for BYE/external)
   * @returns ActiveBattleCondition with condition info and reason, plus killzone recommendation
   */
  const getActiveBattleCondition = useCallback((
    opponentId: number | null
  ): { condition: ActiveBattleCondition; killzone: KillzoneRecommendation | null } | null => {
    // Only return condition during Battle Phase
    if (currentPhase !== 1) return null

    const currentPlayer = players[currentPlayerIndex]
    if (!currentPlayer) return null

    // If condition rules disabled, return disabled state
    if (!conditionEnabled) {
      return {
        condition: {
          condition: null,
          sourceHex: null,
          reason: 'disabled',
          conditionProviderPlayerId: null,
          conditionProviderName: null
        },
        killzone: null
      }
    }

    // Get opponent player (null for BYE or external)
    const opponent = opponentId !== null
      ? players.find(p => p.id === opponentId) ?? null
      : null

    // Get players with priority for initiative determination
    const playersWithPriority = determinePriority(players)

    // Determine active condition
    const activeCondition = determineActiveCondition(
      currentPlayer,
      opponent,
      hexes,
      playersWithPriority
    )

    // Get killzone recommendation based on hex type
    const killzone = activeCondition.sourceHex
      ? getKillzoneRecommendation(activeCondition.sourceHex.type)
      : null

    return { condition: activeCondition, killzone }
  }, [currentPhase, currentPlayerIndex, players, hexes, conditionEnabled])

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
    threatWarning,
    eventLog,
    soloMode,
    mapConfig,
    selectedHex,
    gameEnded,
    battleCompleted,
    extendedMode,
    explorationResult,
    movementOrder,
    movementIndex,
    actionOrder,
    actionIndex,
    conditionEnabled,
    selectedOpponentId,

    // Setters
    setPlayerCount,
    setTargetThreatLevel,
    setSelectedHex,
    setThreatLevel,
    setConditionEnabled,
    setSelectedOpponentId,

    // Actions
    startGame,
    movePlayer,
    regroupPlayer,
    holdPosition,
    exploreHex,
    performAction,
    recordBattle,
    recordMissingPlayer,
    nextPhase,
    updatePlayer,
    calculateEncampCost,
    validateDemolish,
    addEvent,
    updatePriorities,
    checkRollOff,
    enableExtendedMode,
    clearExplorationResult,
    calculateMovementOrder,
    advanceActionTurn,
    getActiveBattleCondition,
  }
}
