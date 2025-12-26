import { CampaignStateSchema } from './schema'
import type { CampaignState } from './schema'

/**
 * Validation result interface
 * WHY: Provides structured validation results with errors
 */
export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

/**
 * Validate complete game state
 * WHY: Ensures game state is valid before saving to database
 *
 * @param state - Game state to validate
 * @returns Validation result with errors if any
 */
export function validateGameState(state: any): ValidationResult {
  const result = CampaignStateSchema.safeParse(state)

  if (!result.success) {
    const errors = result.error.issues.map(
      issue => `${issue.path.join('.')}: ${issue.message}`
    )
    return { valid: false, errors }
  }

  return { valid: true }
}

/**
 * Validate state update (partial state)
 * WHY: Allows partial updates while ensuring they're valid
 *
 * @param current - Current game state
 * @param update - Partial state update
 * @returns Validation result
 */
export function validateStateUpdate(
  current: CampaignState,
  update: Partial<CampaignState>
): ValidationResult {
  // WHY: Merge update with current state to validate complete result
  const merged = { ...current, ...update }
  return validateGameState(merged)
}

/**
 * Validate phase transition
 * WHY: Ensures phase changes follow correct order
 *
 * @param from - Current phase
 * @param to - Target phase
 * @returns true if transition is valid
 */
export function validatePhaseTransition(
  from: string,
  to: string
): boolean {
  // WHY: Phase order: setup → movement → battle → action → threat → movement
  const validTransitions: Record<string, string[]> = {
    setup: ['movement'],
    movement: ['battle'],
    battle: ['action'],
    action: ['threat'],
    threat: ['movement']
  }

  return validTransitions[from]?.includes(to) || false
}

/**
 * Validate player action
 * WHY: Checks if player can perform action in current state
 *
 * @param state - Current game state
 * @param playerId - Player attempting action
 * @param action - Action type
 * @returns true if action is valid
 */
export function validatePlayerAction(
  state: CampaignState,
  playerId: number,
  action: string
): boolean {
  // WHY: Find player in state
  const player = state.players.find(p => p.userId === playerId)
  if (!player) return false

  // WHY: Check phase-specific actions
  if (action === 'move' && state.currentPhase !== 'movement') {
    return false
  }

  if (action === 'battle' && state.currentPhase !== 'battle') {
    return false
  }

  if (['scout', 'resupply', 'search', 'encamp', 'demolish'].includes(action)) {
    if (state.currentPhase !== 'action') {
      return false
    }
  }

  return true
}
