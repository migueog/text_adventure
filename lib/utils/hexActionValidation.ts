import type { Player, Hex, ActionOption } from '@/types/campaign'
import { hexDistance, hexId, parseHexId } from './hexUtils'
import { canPerformSearch } from './search'

/**
 * WHY: Unified validation for hex-based action menu
 * Returns all available actions for current selection context
 */

/**
 * WHY: Calculate distance between two hex IDs
 */
const getHexDistance = (sourceId: string, targetId: string): number => {
  const source = parseHexId(sourceId)
  const target = parseHexId(targetId)
  return hexDistance(source.row, source.col, target.row, target.col)
}

/**
 * WHY: Count players in target hex (excluding current player)
 */
const countPlayersInHex = (
  players: Player[],
  targetHexId: string,
  excludeId: number
): number => {
  const target = parseHexId(targetHexId)
  return players.filter(
    p => p.position &&
         p.position.row === target.row &&
         p.position.col === target.col &&
         p.id !== excludeId
  ).length
}

/**
 * WHY: Check if position matches player's base or camp
 */
const isAtBaseOrCamp = (player: Player, row: number, col: number): boolean => {
  const posMatch = (p: { row: number; col: number }) => p.row === row && p.col === col
  return player.bases.some(posMatch) || player.camps.some(posMatch)
}

/**
 * WHY: Validate move action
 */
const validateMoveAction = (
  distance: number,
  targetHex: Hex,
  player: Player,
  players: Player[]
): ActionOption => {
  const cost = distance

  // WHY: Check distance limit (max 3 hexes)
  if (cost > 3) {
    return {
      type: 'move',
      label: `Move here (${cost} SP)`,
      cost,
      valid: false,
      reason: `Too far (max 3 hexes)`,
    }
  }

  // WHY: Check if hex is blocked
  if (targetHex.type === 'blocked') {
    return {
      type: 'move',
      label: `Move here (${cost} SP)`,
      cost,
      valid: false,
      reason: 'Cannot move to blocked hex',
    }
  }

  // WHY: Check if hex already has 2 players
  const playersInTarget = countPlayersInHex(players, targetHex.id, player.id)
  if (playersInTarget >= 2) {
    return {
      type: 'move',
      label: `Move here (${cost} SP)`,
      cost,
      valid: false,
      reason: 'Hex already has 2 kill teams',
    }
  }

  // WHY: Check if player has enough SP
  if (player.supplyPoints < cost) {
    return {
      type: 'move',
      label: `Move here (${cost} SP)`,
      cost,
      valid: false,
      reason: `Not enough SP (need ${cost}, have ${player.supplyPoints})`,
    }
  }

  return {
    type: 'move',
    label: `Move here (${cost} SP)`,
    cost,
    valid: true,
  }
}

/**
 * WHY: Validate scout action
 */
const validateScoutAction = (
  distance: number,
  targetHex: Hex,
  player: Player
): ActionOption => {
  const cost = distance

  // WHY: Check if hex is blocked
  if (targetHex.type === 'blocked') {
    return {
      type: 'scout',
      label: `Scout (${cost} SP)`,
      cost,
      valid: false,
      reason: 'Cannot scout blocked hex',
    }
  }

  // WHY: Check if hex is already explored
  if (targetHex.explored) {
    return {
      type: 'scout',
      label: `Scout (${cost} SP)`,
      cost,
      valid: false,
      reason: 'Hex already explored',
    }
  }

  // WHY: Check if player has enough SP
  if (player.supplyPoints < cost) {
    return {
      type: 'scout',
      label: `Scout (${cost} SP)`,
      cost,
      valid: false,
      reason: `Not enough SP (need ${cost}, have ${player.supplyPoints})`,
    }
  }

  return {
    type: 'scout',
    label: `Scout (${cost} SP)`,
    cost,
    valid: true,
  }
}

/**
 * WHY: Validate search action (same hex)
 */
const validateSearchAction = (player: Player, hex: Hex, hexKey: string): ActionOption => {
  const validation = canPerformSearch(player, hex, hexKey)

  if (!validation.canSearch) {
    return {
      type: 'search',
      label: 'Search',
      cost: 0,
      valid: false,
      reason: validation.reason || 'Cannot search',
    }
  }

  return {
    type: 'search',
    label: 'Search',
    cost: 0,
    valid: true,
  }
}

/**
 * WHY: Validate encamp action (same hex)
 */
const validateEncampAction = (player: Player, hex: Hex): ActionOption => {
  const cost = 3

  // WHY: Check if hex is unexplored
  if (!hex.explored) {
    return {
      type: 'encamp',
      label: `Encamp (${cost} SP)`,
      cost,
      valid: false,
      reason: 'Hex must be explored',
    }
  }

  // WHY: Check if player has enough SP
  if (player.supplyPoints < cost) {
    return {
      type: 'encamp',
      label: `Encamp (${cost} SP)`,
      cost,
      valid: false,
      reason: `Not enough SP (need ${cost}, have ${player.supplyPoints})`,
    }
  }

  // WHY: Allow encamp (camp limit handled by UI showing removal option)
  return {
    type: 'encamp',
    label: `Encamp (${cost} SP)`,
    cost,
    valid: true,
  }
}

/**
 * WHY: Validate resupply action (same hex at base/camp)
 */
const validateResupplyAction = (player: Player, hex: Hex): ActionOption => {
  // WHY: Check if at base or camp
  const atBaseOrCamp = isAtBaseOrCamp(player, hex.row, hex.col)
  if (!atBaseOrCamp) {
    return {
      type: 'resupply',
      label: 'Resupply',
      cost: 0,
      valid: false,
      reason: 'Must be at base or camp',
    }
  }

  // WHY: Check if already at max SP
  if (player.supplyPoints >= 10) {
    return {
      type: 'resupply',
      label: 'Resupply',
      cost: 0,
      valid: false,
      reason: 'Already at max SP (10)',
    }
  }

  return {
    type: 'resupply',
    label: 'Resupply',
    cost: 0,
    valid: true,
  }
}

/**
 * WHY: Get available actions for current selection
 * Returns ActionOption[] based on phase and hex context
 */
export function getAvailableActions(
  sourceHex: string,
  targetHex: string | null,
  player: Player,
  hexes: Record<string, Hex>,
  players: Player[],
  phase: string
): ActionOption[] {
  // WHY: No actions during Battle or Threat phase
  if (phase === 'Battle' || phase === 'Threat') {
    return []
  }

  const sourceHexData = hexes[sourceHex]
  if (!sourceHexData) return []

  // WHY: Same hex selected (self-targeted actions)
  if (!targetHex || sourceHex === targetHex) {
    const actions: ActionOption[] = []

    if (phase === 'Movement') {
      // WHY: Hold position (always valid in Movement)
      actions.push({
        type: 'hold',
        label: 'Hold Position',
        cost: 0,
        valid: true,
      })
    }

    if (phase === 'Action') {
      // WHY: Search action
      actions.push(validateSearchAction(player, sourceHexData, sourceHex))

      // WHY: Encamp action
      actions.push(validateEncampAction(player, sourceHexData))

      // WHY: Resupply action
      actions.push(validateResupplyAction(player, sourceHexData))
    }

    return actions
  }

  // WHY: Different hex selected (targeted actions)
  const targetHexData = hexes[targetHex]
  if (!targetHexData) return []

  const distance = getHexDistance(sourceHex, targetHex)
  const actions: ActionOption[] = []

  if (phase === 'Movement') {
    // WHY: Move action
    actions.push(validateMoveAction(distance, targetHexData, player, players))
  }

  if (phase === 'Action') {
    // WHY: Scout action
    actions.push(validateScoutAction(distance, targetHexData, player))
  }

  return actions
}
