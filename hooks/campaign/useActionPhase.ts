'use client'

import { useState, useCallback } from 'react'
import type { Player, Hex, HexPosition, Event } from '@/types/campaign'
import { hexId, hexDistance } from '@/lib/utils/hexUtils'
import { calculateActionPhaseOrder } from '@/lib/utils/actionPhaseUtils'
import { determinePriority } from '@/lib/utils/priority'
import { calculateResupply } from '@/lib/utils/resupply'
import { canPerformSearch, resolveSearchRule } from '@/lib/utils/search'
import { SURFACE_LOCATIONS, TOMB_LOCATIONS } from '@/lib/data/campaignData'

/**
 * WHY: Action phase hook for managing action order and execution (Phase 2, Hook 5)
 * Handles battle result-based turn ordering and 10+ action types
 */

interface UseActionPhaseProps {
  players: Player[]
  hexes: Record<string, Hex>
  currentPlayerIndex: number
  currentRound: number
  currentPhase: string
  isSolo?: boolean
  addEvent: (message: string, type?: Event['type']) => void
  updatePlayer: (index: number, updates: Partial<Player>) => void
  exploreHex: (hexId: string) => void
}

interface PerformActionParams {
  targetHex?: string
  distance?: number
  options?: {
    cost?: number
    campToRemove?: HexPosition | null
    targetType?: string
    targetPlayerId?: number
  }
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
 * WHY: Validate scout action parameters
 * Returns null if valid, error message if invalid
 */
const validateScout = (
  targetHex: string | undefined,
  distance: number | undefined,
  hexes: Record<string, Hex>,
  playerSP: number
): string | null => {
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
    return `Insufficient SP to scout (need ${distance}, have ${playerSP})`
  }

  return null // Valid
}

/**
 * WHY: Validate encamp action parameters
 * Returns error message or null if valid
 */
const validateEncamp = (
  currentHex: HexPosition,
  hexes: Record<string, Hex>,
  players: Player[],
  currentPlayerIndex: number,
  campToRemove: HexPosition | null
): string | null => {
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

/**
 * WHY: Validate demolish prerequisites (Issue #47, #59)
 * Returns valid targets or error reason
 */
const validateDemolish = (
  playerIndex: number,
  players: Player[],
  hexes: Record<string, Hex>,
  currentRound: number
): {
  valid: boolean
  reason?: string
  targets?: Array<{
    type: 'CAMP' | 'BEAST_LAIR' | 'RELEASED_PRISONER'
    playerId?: number
    playerName?: string
    name: string
  }>
  cost: number
} => {
  const DEMOLISH_COST = 3
  const player = players[playerIndex]

  if (!player) {
    return { valid: false, reason: 'Player not found', cost: DEMOLISH_COST }
  }

  if (player.supplyPoints < DEMOLISH_COST) {
    return { valid: false, reason: 'Insufficient SP (requires 3 SP)', cost: DEMOLISH_COST }
  }

  const playerPos = player.position
  const playerHexId = `${playerPos.row},${playerPos.col}`
  const hex = hexes[playerHexId]
  const allTargets: Array<{
    type: 'CAMP' | 'BEAST_LAIR' | 'RELEASED_PRISONER'
    playerId?: number
    playerName?: string
    name: string
  }> = []

  // WHY: Check for Beast Lair (TL23) at current position
  if (hex?.location === 23 && hex.state?.beastLairActive !== false) {
    allTargets.push({ type: 'BEAST_LAIR', name: 'Beast Lair' })
  }

  // WHY: Check for opponent camps at current position
  players.forEach((p, idx) => {
    if (idx !== playerIndex) {
      const hasCampHere = p.camps.some(c => c.row === playerPos.row && c.col === playerPos.col)
      if (hasCampHere) {
        allTargets.push({
          type: 'CAMP',
          playerId: p.id,
          playerName: p.name,
          name: `${p.name}'s camp`
        })
      }
    }
  })

  if (allTargets.length === 0) {
    return { valid: false, reason: 'No demolishable targets at your position', cost: DEMOLISH_COST }
  }

  // WHY: Filter targets based on prerequisites (Issue #59 - Phase 5)
  const battleHistory = player.battleHistory || []

  const validTargets = allTargets.filter(target => {
    if (target.type === 'BEAST_LAIR' || target.type === 'RELEASED_PRISONER') {
      return true // No prerequisites
    }

    // WHY: CAMP requires battle prerequisite
    const battleVsOwner = battleHistory.find(
      b => b.round === currentRound && b.opponent === target.playerId
    )

    return battleVsOwner && (
      battleVsOwner.result === 'WIN' ||
      battleVsOwner.status === 'challenged-refused' ||
      battleVsOwner.status === 'challenged-no-show'
    )
  })

  if (validTargets.length === 0) {
    return {
      valid: false,
      reason: 'Demolish prerequisite not met (camps require battle win or challenge against owner this round)',
      cost: DEMOLISH_COST
    }
  }

  return {
    valid: true,
    targets: validTargets,
    cost: DEMOLISH_COST
  }
}

export function useActionPhase(props: UseActionPhaseProps) {
  const {
    players,
    hexes,
    currentPlayerIndex,
    currentRound,
    currentPhase,
    isSolo = false,
    addEvent,
    updatePlayer,
    exploreHex,
  } = props

  const [actionOrder, setActionOrder] = useState<number[] | null>(null)
  const [actionIndex, setActionIndex] = useState(0)

  /**
   * WHY: Calculate action order based on battle results
   * Official rules: Winners → Draws → Losses, with priority within each group
   */
  const calculateActionOrder = useCallback((): number[] => {
    if (isSolo) {
      const order = [0]
      setActionOrder(order)
      setActionIndex(0)
      return order
    }

    const order = calculateActionPhaseOrder(players, determinePriority)
    setActionOrder(order)
    setActionIndex(0)

    // WHY: Log action order for transparency
    if (order.length > 0) {
      const orderNames = order.map(i => players[i]?.name || `Player ${i}`).join(' → ')
      addEvent(`Action order: ${orderNames}`, 'system')
    }

    return order
  }, [players, isSolo, addEvent])

  /**
   * WHY: Advance to next player in action order
   */
  const advanceActionTurn = useCallback(() => {
    setActionIndex(prev => {
      if (!actionOrder) return 0
      const nextIndex = prev + 1
      return nextIndex >= actionOrder.length ? 0 : nextIndex
    })
  }, [actionOrder])

  /**
   * WHY: Execute RESUPPLY action
   * Gain SP based on location (base +3, camp +D3)
   * Returns true if successful, false otherwise
   */
  const handleResupply = useCallback((player: Player): boolean => {
    // WHY: Validate player has been placed on map
    if (!player.position) {
      addEvent(`${player.name} cannot resupply - not placed on map`, 'warning')
      return false
    }

    const playerPosId = hexId(player.position.row, player.position.col)
    const hex = hexes[playerPosId]

    if (!hex) {
      addEvent(`${player.name} cannot resupply - invalid hex`, 'warning')
      return false
    }

    const resupplyResult = calculateResupply(player, hex)
    const actualGain = Math.max(0, Math.min(resupplyResult.amount, SP_MAX - player.supplyPoints))

    if (actualGain === 0) {
      addEvent(`${player.name} is already at max SP (10)`, 'system')
      return false
    }

    const newSP = clampSP(player.supplyPoints + actualGain)

    updatePlayer(currentPlayerIndex, {
      supplyPoints: newSP,
      history: addHistoryEntry(
        player,
        currentRound,
        currentPhase,
        actualGain,
        0,
        resupplyResult.type === 'camp' && resupplyResult.roll
          ? `Resupply at camp (rolled ${resupplyResult.roll}, +${resupplyResult.amount} base)`
          : `Resupply at ${resupplyResult.type}`
      )
    })

    const locationMsg = resupplyResult.type === 'camp' && resupplyResult.roll
      ? `camp (D3=${resupplyResult.roll}, base +${resupplyResult.amount})`
      : resupplyResult.type
    addEvent(`${player.name} resupplied at ${locationMsg}: +${actualGain} SP`, 'action')
    return true
  }, [players, hexes, currentPlayerIndex, currentRound, currentPhase, addEvent, updatePlayer])

  /**
   * WHY: Execute SCOUT action
   * Explore distant hex for SP cost equal to distance
   * Returns true if successful, false otherwise
   */
  const handleScout = useCallback((
    player: Player,
    targetHex?: string,
    distance?: number
  ): boolean => {
    const validationError = validateScout(targetHex, distance, hexes, player.supplyPoints)
    if (validationError) {
      const errorType = validationError.includes('already explored') ? 'warning' : 'error'
      addEvent(`${player.name}: ${validationError}`, errorType)
      return false
    }

    const cost = distance!
    const spUpdate = deductSupplyPoints(player, cost)

    updatePlayer(currentPlayerIndex, {
      ...spUpdate,
      history: addHistoryEntry(player, currentRound, currentPhase, -cost, 0, `Scouted hex ${targetHex}`)
    })

    exploreHex(targetHex!)
    addEvent(`${player.name} scouted ${targetHex} (cost: ${cost} SP)`, 'action')
    return true
  }, [hexes, currentPlayerIndex, currentRound, currentPhase, addEvent, updatePlayer, exploreHex])

  /**
   * WHY: Execute SEARCH action
   * Search current hex for SP/CP rewards (1 SP cost, one-time per hex)
   * Returns true if successful, false otherwise
   */
  const handleSearch = useCallback((player: Player): boolean => {
    // WHY: Validate player has been placed on map
    if (!player.position) return false

    const hexKey = hexId(player.position.row, player.position.col)
    const hex = hexes[hexKey]

    if (!hex) {
      addEvent(`${player.name} cannot search - invalid hex`, 'warning')
      return false
    }

    const validation = canPerformSearch(player, hex, hexKey)
    if (!validation.canSearch) {
      addEvent(`${player.name} cannot search: ${validation.reason}`, 'warning')
      return false
    }

    const location = hex.type === 'surface'
      ? SURFACE_LOCATIONS[hex.location]
      : TOMB_LOCATIONS[hex.location]

    const result = resolveSearchRule(location?.searchRule)
    if (!result) {
      addEvent(`${player.name} searched but found nothing`, 'action')
      return false
    }

    const spCost = 1
    const updatedPlayer = deductSupplyPoints(player, spCost)
    const finalSP = clampSP((updatedPlayer.supplyPoints ?? player.supplyPoints) + result.spGained)
    const finalCP = player.campaignPoints + result.cpGained

    updatePlayer(currentPlayerIndex, {
      ...updatedPlayer,
      supplyPoints: finalSP,
      campaignPoints: finalCP,
      searchedHexes: [...player.searchedHexes, hexKey],
      history: addHistoryEntry(
        player,
        currentRound,
        currentPhase,
        -spCost + result.spGained,
        result.cpGained,
        `Search: ${result.description}`
      )
    })

    addEvent(`${player.name} searched ${location?.name}: ${result.description}`, 'action')
    return true
  }, [hexes, currentPlayerIndex, currentRound, currentPhase, addEvent, updatePlayer])

  /**
   * WHY: Execute ENCAMP action
   * Build camp at current position (variable cost, relocate option)
   * Returns true if successful, false otherwise
   */
  const handleEncamp = useCallback((
    player: Player,
    cost: number,
    campToRemove: HexPosition | null
  ): boolean => {
    // WHY: Validate player has been placed on map
    if (!player.position) {
      addEvent(`${player.name} cannot encamp - not placed on map`, 'error')
      return false
    }

    const playerPosId = hexId(player.position.row, player.position.col)

    const validationError = validateEncamp(
      player.position,
      hexes,
      players,
      currentPlayerIndex,
      campToRemove
    )

    if (validationError) {
      addEvent(`${player.name}: ${validationError}`, 'error')
      return false
    }

    if (player.supplyPoints < cost) {
      addEvent(
        `${player.name}: Not enough SP to build camp (need ${cost}, have ${player.supplyPoints})`,
        'error'
      )
      return false
    }

    let newCamps = [...player.camps]

    if (campToRemove) {
      newCamps = newCamps.filter(
        c => !(c.row === campToRemove.row && c.col === campToRemove.col)
      )
      addEvent(
        `${player.name} removed camp at ${hexId(campToRemove.row, campToRemove.col)}`,
        'action'
      )
    }

    newCamps.push({ row: player.position.row, col: player.position.col })

    const updatedPlayer = deductSupplyPoints(player, cost)

    updatePlayer(currentPlayerIndex, {
      ...updatedPlayer,
      camps: newCamps,
      history: addHistoryEntry(
        player,
        currentRound,
        currentPhase,
        -cost,
        0,
        `Built camp at ${playerPosId}${campToRemove ? ` (removed camp at ${hexId(campToRemove.row, campToRemove.col)})` : ''}`
      )
    })

    addEvent(
      `${player.name} built camp at ${playerPosId} (cost: ${cost} SP)`,
      'action'
    )
    return true
  }, [hexes, players, currentPlayerIndex, currentRound, currentPhase, addEvent, updatePlayer])

  /**
   * WHY: Execute DEMOLISH action
   * Destroy camps, Beast Lair, or Released Prisoner (3 SP cost, prerequisites required)
   * Returns true if successful, false otherwise
   */
  const handleDemolish = useCallback((
    player: Player,
    targetType?: string,
    targetPlayerId?: number
  ): boolean => {
    if (!targetType) {
      addEvent('No target type selected for demolish', 'error')
      return false
    }

    // WHY: Validate player has been placed on map
    if (!player.position) {
      addEvent(`${player.name} cannot demolish - not placed on map`, 'error')
      return false
    }

    const validation = validateDemolish(currentPlayerIndex, players, hexes, currentRound)
    if (!validation.valid) {
      addEvent(`Cannot demolish: ${validation.reason}`, 'error')
      return false
    }

    const validTarget = validation.targets?.find(t => {
      if (t.type === 'CAMP') {
        return t.type === targetType && t.playerId === targetPlayerId
      }
      return t.type === targetType
    })

    if (!validTarget) {
      addEvent('Cannot demolish: target not available or prerequisite not met', 'error')
      return false
    }

    const DEMOLISH_COST = 3
    const playerHexId = hexId(player.position.row, player.position.col)

    if (targetType === 'BEAST_LAIR') {
      // WHY: Destroy Beast Lair - update hex state
      // Note: Would need setHexes callback passed in for full implementation
      const updatedPlayer = deductSupplyPoints(player, DEMOLISH_COST)
      updatePlayer(currentPlayerIndex, {
        ...updatedPlayer,
        history: addHistoryEntry(player, currentRound, currentPhase, -DEMOLISH_COST, 0, 'Demolished Beast Lair')
      })
      addEvent(`${player.name} destroyed the Beast Lair at ${playerHexId}!`, 'action')
      return true
    } else if (targetType === 'CAMP') {
      if (!targetPlayerId) {
        addEvent('No target player selected for camp demolish', 'error')
        return false
      }

      const targetIdx = players.findIndex(p => p.id === targetPlayerId)
      if (targetIdx === -1) {
        addEvent('Target player not found', 'error')
        return false
      }

      const target = players[targetIdx]
      if (!target) {
        addEvent('Target player not found', 'error')
        return false
      }

      // WHY: Remove camp from target player
      updatePlayer(targetIdx, {
        camps: target.camps.filter(c =>
          !(c.row === player.position.row && c.col === player.position.col)
        )
      })

      // WHY: Update current player SP and history
      const updatedPlayer = deductSupplyPoints(player, DEMOLISH_COST)
      updatePlayer(currentPlayerIndex, {
        ...updatedPlayer,
        history: addHistoryEntry(player, currentRound, currentPhase, -DEMOLISH_COST, 0, `Demolished ${target.name}'s camp`)
      })

      addEvent(`${player.name} demolished ${target.name}'s camp at ${playerHexId}!`, 'action')
      return true
    }

    return false
  }, [players, hexes, currentPlayerIndex, currentRound, currentPhase, addEvent, updatePlayer])

  /**
   * WHY: Execute action with type-specific logic
   * Main action router for 10+ action types
   */
  const performAction = useCallback((action: string, params: PerformActionParams = {}) => {
    const player = players[currentPlayerIndex]
    if (!player) return

    let actionSuccessful = false

    switch (action) {
      case 'RESUPPLY':
        actionSuccessful = handleResupply(player)
        break

      case 'SCOUT':
        actionSuccessful = handleScout(player, params.targetHex, params.distance)
        break

      case 'SEARCH':
        actionSuccessful = handleSearch(player)
        break

      case 'ENCAMP':
        if (!params.options) return
        actionSuccessful = handleEncamp(player, params.options.cost ?? 3, params.options.campToRemove ?? null)
        break

      case 'DEMOLISH':
        if (!params.options) {
          addEvent('No demolish options provided', 'error')
          return
        }
        actionSuccessful = handleDemolish(player, params.options.targetType, params.options.targetPlayerId)
        break

      case 'SKIP_ACTION':
        addEvent(`${player.name} skipped action`, 'action')
        actionSuccessful = true
        break

      default:
        addEvent(`Unknown action: ${action}`, 'error')
    }

    // WHY: Advance to next player's turn after successful action
    if (actionSuccessful && !isSolo) {
      advanceActionTurn()
    }
  }, [players, currentPlayerIndex, handleResupply, handleScout, handleSearch, handleEncamp, handleDemolish, addEvent, advanceActionTurn, isSolo])

  /**
   * WHY: Calculate encamp cost for UI preview (Issue #59)
   * Exposed so ActionPhase can show cost before execution
   */
  const calculateEncampCost = useCallback((playerIndex: number): number => {
    const player = players[playerIndex]
    if (!player || !player.position) return 999

    let minDist = 999
    const playerPos = player.position

    // WHY: Check distance to all bases
    player.bases.forEach(base => {
      const dist = hexDistance(playerPos.row, playerPos.col, base.row, base.col)
      if (dist < minDist) minDist = dist
    })

    // WHY: Check distance to all camps (closer than bases?)
    player.camps.forEach(camp => {
      const dist = hexDistance(playerPos.row, playerPos.col, camp.row, camp.col)
      if (dist < minDist) minDist = dist
    })

    return minDist
  }, [players])

  /**
   * WHY: Validate demolish for UI feedback (Issue #47, #59)
   * Exposed so ActionPhase can show prerequisites before execution
   */
  const validateDemolishForPlayer = useCallback((playerIndex: number) => {
    return validateDemolish(playerIndex, players, hexes, currentRound)
  }, [players, hexes, currentRound])

  return {
    // State
    actionOrder,
    actionIndex,

    // Actions
    calculateActionOrder,
    performAction,
    advanceActionTurn,

    // Action Phase - Calculations (for UI feedback)
    calculateEncampCost,
    validateDemolish: validateDemolishForPlayer,
  }
}
