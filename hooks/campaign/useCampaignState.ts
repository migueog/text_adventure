'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Player, Hex, MapConfig, Event, HexPosition } from '@/types/campaign'
import {
  MAP_CONFIGS,
  PLAYER_COLORS,
  PHASES
} from '@/lib/data/campaignData'
import { hexId } from '@/lib/utils/hexUtils'
import { useCampaignStore } from '@/store/campaign'
import { calculateStartPositions, markStartingHexes } from '@/lib/utils/playerPlacement'
import { determinePriority, needsRollOff } from '@/lib/utils/priority'

/**
 * WHY: Core campaign state management hook
 * Manages game initialization, player state, and event logging
 * Foundation hook for all other campaign hooks
 */

/**
 * WHY: Hex selection state type for dual-click workflow
 * Tracks source hex, target hex, selected player, and menu position
 */
interface HexSelectionState {
  sourceHex: string | null
  targetHex: string | null
  selectedPlayerId: number | null
  menuPosition: { x: number; y: number } | null
}

/**
 * WHY: Create initial hex grid based on map configuration
 * Generates hex objects for entire map
 */
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

/**
 * WHY: Create player object with default values
 * Sets starting position and initializes tracking fields
 */
const createPlayer = (
  id: number,
  name: string,
  color: string,
  startHex: HexPosition
): Player => ({
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
  searchedHexes: [],
  battleHistory: [],
  supplyPointsSpent: 0,
  operativeKillDetails: [],
})

/**
 * WHY: Create player objects for all players
 * Uses starting positions and default values
 */
const createPlayers = (
  numPlayers: number,
  positions: HexPosition[]
): Player[] => {
  const players: Player[] = []
  for (let i = 0; i < numPlayers; i++) {
    players.push(
      createPlayer(
        i,
        `Player ${i + 1}`,
        PLAYER_COLORS[i] || '#ffffff',
        positions[i] || { row: 0, col: 0 }
      )
    )
  }
  return players
}

export function useCampaignState() {
  // WHY: Access Zustand store for persistence
  const zustandUpdatePlayer = useCampaignStore((state) => state.updatePlayer)

  // Core game state
  const [gameStarted, setGameStarted] = useState(false)
  const [playerCount, setPlayerCount] = useState(4)
  const [players, setPlayers] = useState<Player[]>([])
  const [hexes, setHexes] = useState<Record<string, Hex>>({})
  const [currentRound, setCurrentRound] = useState(1)
  const [currentPhase, setCurrentPhase] = useState(0)
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [targetThreatLevel, setTargetThreatLevel] = useState(7)
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null)
  const [selectedHex, setSelectedHex] = useState<string | null>(null)
  const [gameEnded, setGameEnded] = useState(false)
  const [extendedMode, setExtendedMode] = useState(false)
  const [eventLog, setEventLog] = useState<Event[]>([])

  // WHY: Hex-based action menu state for dual-selection workflow
  const [hexSelection, setHexSelection] = useState<HexSelectionState>({
    sourceHex: null,
    targetHex: null,
    selectedPlayerId: null,
    menuPosition: null,
  })

  // WHY: Refs to avoid stale closure issues in callbacks
  const currentRoundRef = useRef(currentRound)
  const currentPhaseRef = useRef(currentPhase)
  const currentPlayerIndexRef = useRef(currentPlayerIndex)
  const playersRef = useRef(players)

  // WHY: Keep refs in sync with state
  useEffect(() => {
    playersRef.current = players
  }, [players])

  /**
   * WHY: Add event to log with metadata
   * Events are prepended (newest first)
   */
  const addEvent = useCallback((
    message: string,
    type: Event['type'] = 'system'
  ) => {
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
   * WHY: Initialize campaign with players and hex grid
   * Delegates to helper functions for setup
   */
  const startGame = useCallback((
    numPlayers: number,
    _isSolo = false
  ) => {
    const config = MAP_CONFIGS[numPlayers] || MAP_CONFIGS[4]
    if (!config) return

    setMapConfig(config)

    const initialHexes = createInitialHexGrid(config)
    const startPositions = calculateStartPositions(numPlayers, config)
    markStartingHexes(initialHexes, startPositions)
    const newPlayers = createPlayers(numPlayers, startPositions)

    setHexes(initialHexes)
    setPlayers(newPlayers)
    setCurrentRound(1)
    setCurrentPhase(0)
    setCurrentPlayerIndex(0)
    setGameStarted(true)
    setGameEnded(false)
    setEventLog([])

    addEvent(
      `Campaign started with ${numPlayers} player${numPlayers !== 1 ? 's' : ''}. Target threat level: ${targetThreatLevel}.`,
      'system'
    )
  }, [targetThreatLevel, addEvent])

  /**
   * WHY: Update specific player fields
   * Preserves other player data
   */
  const updatePlayer = useCallback((
    playerIndex: number,
    updates: Partial<Player>
  ) => {
    // WHY: Update local React state for immediate UI reactivity
    setPlayers(prev => {
      const updated = [...prev]
      const player = updated[playerIndex]
      if (!player) return prev

      updated[playerIndex] = {
        ...player,
        ...updates
      }
      return updated
    })

    // WHY: Also update Zustand store for persistence to database
    zustandUpdatePlayer(playerIndex, updates)
  }, [zustandUpdatePlayer])

  /**
   * WHY: Recalculate player priorities
   * Uses determinePriority utility
   */
  const updatePriorities = useCallback(() => {
    // Priority calculation done by determinePriority utility
    // This function exists for API compatibility
    determinePriority(players)
  }, [players])

  /**
   * WHY: Check if priority tie exists
   * Returns true if rollOff needed
   */
  const checkRollOff = useCallback((): boolean => {
    return needsRollOff(players)
  }, [players])

  /**
   * WHY: Enable extended campaign mode
   * Allows play beyond target threat level
   */
  const enableExtendedMode = useCallback(() => {
    setExtendedMode(true)
    setGameEnded(false)
    addEvent('Campaign extended beyond target threat level', 'system')
  }, [addEvent])

  /**
   * WHY: Set source hex for action selection
   * Marks player's position as action origin
   */
  const setSourceHex = useCallback((
    hexId: string,
    playerId: number,
    position: { x: number; y: number }
  ) => {
    setHexSelection({
      sourceHex: hexId,
      targetHex: null,
      selectedPlayerId: playerId,
      menuPosition: position,
    })
  }, [])

  /**
   * WHY: Set target hex for action selection
   * Shows contextual menu at target position
   */
  const setTargetHex = useCallback((
    hexId: string,
    position: { x: number; y: number }
  ) => {
    setHexSelection(prev => ({
      ...prev,
      targetHex: hexId,
      menuPosition: position,
    }))
  }, [])

  /**
   * WHY: Reset hex selection state
   * Clears source, target, and menu
   */
  const resetHexSelection = useCallback(() => {
    setHexSelection({
      sourceHex: null,
      targetHex: null,
      selectedPlayerId: null,
      menuPosition: null,
    })
  }, [])

  /**
   * WHY: Auto-reset selection on phase change
   * Prevents stale selection across phases
   */
  useEffect(() => {
    resetHexSelection()
  }, [currentPhase, resetHexSelection])

  return {
    // State
    gameStarted,
    playerCount,
    players,
    hexes,
    currentRound,
    currentPhase: PHASES[currentPhase] || 'Movement',
    currentPlayerIndex,
    targetThreatLevel,
    mapConfig,
    selectedHex,
    hexSelection,
    gameEnded,
    extendedMode,
    eventLog,

    // Setters
    setPlayerCount,
    setTargetThreatLevel,
    setSelectedHex,

    // Actions
    startGame,
    updatePlayer,
    updatePriorities,
    checkRollOff,
    enableExtendedMode,
    addEvent,

    // Hex selection actions
    setSourceHex,
    setTargetHex,
    resetHexSelection,

    // Internal state (for other hooks)
    setPlayers,
    setHexes,
    setCurrentRound,
    setCurrentPhase,
    setCurrentPlayerIndex,
    setGameEnded,
    setEventLog,

    // Refs (for avoiding stale closures)
    currentRoundRef,
    currentPhaseRef,
    currentPlayerIndexRef,
    playersRef,
  }
}
