import type { ActionOption, Phase, Player, Hex } from '@/types/campaign'

/**
 * WHY: Filter actions based on current phase
 * Movement phase: only Move/Hold
 * Action phase: only Scout/Search/Encamp/Resupply
 * Battle/Threat: no hex actions allowed
 */
export function filterActionsByPhase(
  actions: ActionOption[],
  phase: Phase
): ActionOption[] {
  if (phase === 'Battle' || phase === 'Threat') {
    return []
  }

  if (phase === 'Movement') {
    return filterMovementActions(actions)
  }

  if (phase === 'Action') {
    return filterActionPhaseActions(actions)
  }

  return actions
}

/**
 * WHY: Extract movement action filtering to keep function under 20 lines
 */
function filterMovementActions(actions: ActionOption[]): ActionOption[] {
  const movementTypes = ['move', 'hold']
  return actions.filter(a => movementTypes.includes(a.type))
}

/**
 * WHY: Extract action phase filtering to keep function under 20 lines
 */
function filterActionPhaseActions(actions: ActionOption[]): ActionOption[] {
  const actionTypes = ['scout', 'search', 'encamp', 'resupply']
  return actions.filter(a => actionTypes.includes(a.type))
}

/**
 * WHY: Filter actions based on ownership requirements
 * Resupply requires player to be at their base or camp
 */
export function filterActionsByOwnership(
  actions: ActionOption[],
  player: Player,
  sourceHex: Hex,
  _hexes: Record<string, Hex>
): ActionOption[] {
  return actions.map(action => {
    if (action.type === 'resupply') {
      return validateResupplyLocation(action, player, sourceHex)
    }
    return action
  })
}

/**
 * WHY: Validate if player can resupply at current location
 * Must be at player's base or camp
 */
function validateResupplyLocation(
  action: ActionOption,
  player: Player,
  sourceHex: Hex
): ActionOption {
  const hasBase = player.bases.some(
    b => b.row === sourceHex.row && b.col === sourceHex.col
  )
  const hasCamp = player.camps.some(
    c => c.row === sourceHex.row && c.col === sourceHex.col
  )

  if (!hasBase && !hasCamp) {
    return {
      ...action,
      valid: false,
      reason: 'Must be at your base or camp'
    }
  }

  return action
}

/**
 * WHY: Filter actions based on game state constraints
 * Checks SP costs, camp limits, and hex occupancy
 */
export function filterActionsByState(
  actions: ActionOption[],
  player: Player,
  hex: Hex,
  _hexes: Record<string, Hex>
): ActionOption[] {
  return actions.map(action => {
    // WHY: Check SP cost first
    if (action.cost > 0 && player.supplyPoints < action.cost) {
      return markActionInvalid(action, `Insufficient SP (need ${action.cost})`)
    }

    // WHY: Check camp-specific constraints
    if (action.type === 'encamp') {
      return validateEncampAction(action, player, hex)
    }

    return action
  })
}

/**
 * WHY: Mark action as invalid with reason
 */
function markActionInvalid(
  action: ActionOption,
  reason: string
): ActionOption {
  return {
    ...action,
    valid: false,
    reason
  }
}

/**
 * WHY: Validate encamp action constraints
 * Check camp limit (max 2) and hex occupancy
 */
function validateEncampAction(
  action: ActionOption,
  player: Player,
  hex: Hex
): ActionOption {
  // WHY: Check 2-camp limit
  if (player.camps.length >= 2) {
    return markActionInvalid(action, 'Maximum 2 camps allowed')
  }

  // WHY: Check if hex already has player's camp
  const hasCampHere = player.camps.some(
    c => c.row === hex.row && c.col === hex.col
  )

  if (hasCampHere) {
    return markActionInvalid(action, 'Hex already has a camp')
  }

  return action
}
