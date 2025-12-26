// Phase validation utilities for campaign gameplay

export type PhaseCompletion = {
  movement: boolean
  battle: boolean
  action: boolean
  threat: boolean
}

export type PhaseRequirement = {
  required: boolean
  message: string
}

export type PhaseStatus = 'completed' | 'in-progress' | 'locked'

// Phase requirements definition
const PHASE_REQUIREMENTS: Record<keyof PhaseCompletion, PhaseRequirement> = {
  movement: {
    required: false,
    message: 'Movement is optional. You can Hold Position or Regroup.'
  },
  battle: {
    required: true,
    message: 'You must record a battle result (Win/Loss/Draw/Bye)'
  },
  action: {
    required: false,
    message: 'Action is optional. You can skip if desired.'
  },
  threat: {
    required: true,
    message: 'Threat phase auto-completes when threat is increased'
  }
}

/**
 * Check if a specific phase can be completed
 * Returns whether the phase can be completed and an optional reason if not
 */
export function canCompletePhase(
  phaseName: keyof PhaseCompletion,
  completion: Partial<PhaseCompletion>
): { canComplete: boolean; reason?: string } {
  const req = PHASE_REQUIREMENTS[phaseName]

  if (req.required && !completion[phaseName]) {
    return { canComplete: false, reason: req.message }
  }

  return { canComplete: true }
}

/**
 * Check if can advance from current phase to next phase
 * Validates that current phase requirements are met
 */
export function canAdvancePhase(
  currentPhase: string,
  completion: Partial<PhaseCompletion>
): { canAdvance: boolean; reason?: string } {
  const phases: (keyof PhaseCompletion)[] = ['movement', 'battle', 'action', 'threat']
  const currentIndex = phases.indexOf(currentPhase as any)

  if (currentIndex === -1) {
    return { canAdvance: false, reason: 'Invalid phase' }
  }

  const currentPhaseName = phases[currentIndex]!
  const result = canCompletePhase(currentPhaseName, completion)

  return {
    canAdvance: result.canComplete,
    reason: result.reason
  }
}

/**
 * Get completion status for all phases
 * Returns status for each phase: completed, in-progress, or locked
 */
export function getPhaseCompletionStatus(
  completion: Partial<PhaseCompletion>
): Record<keyof PhaseCompletion, PhaseStatus> {
  return {
    movement: completion.movement ? 'completed' : 'in-progress',
    battle: completion.battle ? 'completed' : 'in-progress',
    action: completion.action ? 'completed' : 'in-progress',
    threat: completion.threat ? 'completed' : 'in-progress'
  }
}

/**
 * Get skip confirmation message for optional phases
 * Returns undefined if phase is required
 */
export function getSkipConfirmationMessage(
  phaseName: keyof PhaseCompletion
): string | undefined {
  const req = PHASE_REQUIREMENTS[phaseName]

  if (req.required) {
    return undefined
  }

  const messages: Record<string, string> = {
    movement: 'Skip Movement Phase? You will not move your kill team this round.',
    action: 'Skip Action Phase? You will not perform any campaign action this round.'
  }

  return messages[phaseName]
}
