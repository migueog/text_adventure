'use client'

import { useState, useCallback } from 'react'
import type { Player, Hex, HexPosition, Event } from '@/types/campaign'
import { hexId, findNearestBaseOrCamp } from '@/lib/utils/hexUtils'
import { determinePriority } from '@/lib/utils/priority'

/**
 * WHY: Movement phase hook for managing priority-based movement (Phase 2, Hook 3)
 * Handles movement order calculation and three movement types: move, regroup, hold
 */

interface UseMovementPhaseProps {
  players: Player[]
  hexes: Record<string, Hex>
  currentRound: number
  currentPhase: string
  isSolo?: boolean
  addEvent: (message: string, type?: Event['type']) => void
  updatePlayer: (index: number, updates: Partial<Player>) => void
  exploreHex: (hexId: string) => void
}

/**
 * WHY: Clamp SP within valid range (0-10)
 */
const SP_MIN = 0
const SP_MAX = 10
const clampSP = (value: number): number => {
  return Math.max(SP_MIN, Math.min(SP_MAX, value))
}

/**
 * WHY: Add history entry to player
 */
const addHistoryEntry = (
  player: Player,
  round: number,
  phase: string,
  spChange: number,
  cpChange: number,
  reason: string
) => {
  return [
    ...(player.history || []),
    {
      round,
      phase,
      timestamp: new Date().toISOString(),
      action: reason,
      spBefore: player.supplyPoints,
      spAfter: clampSP(player.supplyPoints + spChange),
      cpBefore: player.campaignPoints,
      cpAfter: player.campaignPoints + cpChange,
    }
  ]
}

/**
 * WHY: Deduct SP and track cumulative spending
 */
const deductSupplyPoints = (
  player: Player,
  cost: number
): Partial<Player> => {
  return {
    supplyPoints: clampSP(player.supplyPoints - cost),
    supplyPointsSpent: (player.supplyPointsSpent || 0) + cost,
  }
}

/**
 * WHY: Count players in target hex (excluding current player)
 */
const countPlayersInHex = (
  players: Player[],
  targetHex: string,
  excludePlayerId: number
): number => {
  return players.filter(p => {
    // WHY: Skip players who haven't been placed on map yet
    if (!p.position) return false
    const pHexId = hexId(p.position.row, p.position.col)
    return pHexId === targetHex && p.id !== excludePlayerId
  }).length
}

/**
 * WHY: Validate movement to target hex
 * Returns error message or null if valid
 */
const validateMovement = (
  cost: number,
  targetHex: string,
  hexes: Record<string, Hex>,
  players: Player[],
  player: Player
): string | null => {
  if (cost > 3) {
    return `${player.name} cannot move more than 3 hexes! (attempted: ${cost})`
  }

  const targetHexData = hexes[targetHex]
  if (targetHexData && targetHexData.type === 'blocked') {
    return `${player.name} cannot move to blocked hex!`
  }

  const playersInTargetHex = countPlayersInHex(players, targetHex, player.id)
  if (playersInTargetHex >= 2) {
    return `${player.name} cannot move to ${targetHex} - already has 2 kill teams!`
  }

  if (player.supplyPoints < cost) {
    return `${player.name} doesn't have enough SP to move!`
  }

  return null
}

export function useMovementPhase(props: UseMovementPhaseProps) {
  const {
    players,
    hexes,
    currentRound,
    currentPhase,
    isSolo = false,
    addEvent,
    updatePlayer,
    exploreHex,
  } = props

  const [movementOrder, setMovementOrder] = useState<number[]>([])
  const [movementIndex, setMovementIndex] = useState(0)
  const [regroupPath, setRegroupPath] = useState<HexPosition[] | null>(null)

  /**
   * WHY: Calculate movement order based on player priority
   * Official rules: players move in priority order (lowest CP → SP)
   */
  const calculateMovementOrder = useCallback((): number[] => {
    if (isSolo) {
      const order = [0]
      setMovementOrder(order)
      setMovementIndex(0)
      return order
    }

    const playersWithPriority = determinePriority(players)
    const order = playersWithPriority.map(p => p.id)

    setMovementOrder(order)
    setMovementIndex(0)

    return order
  }, [players, isSolo])

  /**
   * WHY: Move player to target hex with SP cost
   * Validates distance, blocked hexes, capacity, and SP
   */
  const movePlayer = useCallback((
    playerIndex: number,
    targetHex: string,
    cost: number
  ) => {
    const player = players[playerIndex]
    if (!player) return

    // WHY: Validate movement
    const validationError = validateMovement(cost, targetHex, hexes, players, player)
    if (validationError) {
      addEvent(validationError, 'error')
      return
    }

    // WHY: Deduct SP and track spending
    const spUpdate = deductSupplyPoints(player, cost)
    const targetPos = targetHex.split(',').map(Number)
    const newPosition = { row: targetPos[0] ?? 0, col: targetPos[1] ?? 0 }

    updatePlayer(playerIndex, {
      ...spUpdate,
      position: newPosition,
      history: addHistoryEntry(
        player,
        currentRound,
        currentPhase,
        -cost,
        0,
        `Moved to hex ${targetHex}`
      )
    })

    addEvent(`${player.name} moved to ${targetHex} (cost: ${cost} SP)`, 'movement')

    // WHY: Trigger exploration if hex is unexplored
    const targetHexData = hexes[targetHex]
    if (targetHexData && !targetHexData.explored) {
      exploreHex(targetHex)
    }
  }, [players, hexes, currentRound, currentPhase, addEvent, updatePlayer, exploreHex])

  /**
   * WHY: REGROUP action - move to nearest base/camp for free
   */
  const regroupPlayer = useCallback((playerIndex: number) => {
    const player = players[playerIndex]
    if (!player) return

    // WHY: Find nearest base or camp
    const regroupResult = findNearestBaseOrCamp(
      player.position,
      player.bases || [],
      player.camps || []
    )

    if (!regroupResult) {
      addEvent(
        `${player.name} has no bases or camps to regroup to!`,
        'error'
      )
      return
    }

    // WHY: Use first destination (UI handles choice if multiple)
    const nearestDest = regroupResult.destinations[0]
    if (!nearestDest) return

    // WHY: Set path for visualization
    setRegroupPath([player.position, nearestDest])

    updatePlayer(playerIndex, {
      position: nearestDest,
      history: addHistoryEntry(
        player,
        currentRound,
        currentPhase,
        0,
        0,
        `Regrouped to ${hexId(nearestDest.row, nearestDest.col)}`
      )
    })

    addEvent(
      `${player.name} Regroup to ${hexId(nearestDest.row, nearestDest.col)} (free movement)`,
      'movement'
    )
  }, [players, currentRound, currentPhase, addEvent, updatePlayer])

  /**
   * WHY: HOLD action - stay in current position (no cost, no movement)
   */
  const holdPosition = useCallback((playerIndex: number) => {
    const player = players[playerIndex]
    // WHY: Validate player exists and has been placed on map
    if (!player || !player.position) return

    updatePlayer(playerIndex, {
      history: addHistoryEntry(
        player,
        currentRound,
        currentPhase,
        0,
        0,
        `Held position at ${hexId(player.position.row, player.position.col)}`
      )
    })

    addEvent(
      `${player.name} Hold position at ${hexId(player.position.row, player.position.col)}`,
      'movement'
    )
  }, [players, currentRound, currentPhase, addEvent, updatePlayer])

  /**
   * WHY: Clear regroup path visualization
   */
  const clearRegroupPath = useCallback(() => {
    setRegroupPath(null)
  }, [])

  return {
    // State
    movementOrder,
    movementIndex,
    regroupPath,

    // Actions
    calculateMovementOrder,
    movePlayer,
    regroupPlayer,
    holdPosition,
    clearRegroupPath,
  }
}
