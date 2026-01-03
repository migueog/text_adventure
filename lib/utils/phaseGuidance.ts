/**
 * WHY: Phase guidance utilities for Issue #33
 * Provides help text and manages tutorial dismissal state for campaign phases
 */

import type { Phase, PhaseGuidanceContent, PhaseGuidanceState } from '@/types/campaign'

/**
 * WHY: Central source of truth for all phase-specific guidance content
 * Contains instructions, available actions, key rules, and tutorial tips for each phase
 */
export const PHASE_GUIDANCE: Record<Phase, PhaseGuidanceContent> = {
  Movement: {
    title: 'Movement Phase',
    instruction: 'Move your kill team up to 3 hexes away (costs 1 SP per hex)',
    availableActions: [
      'Click a hex to move (costs SP = distance)',
      'Hold Position (free)',
      'Regroup to Base (free)'
    ],
    keyRules: [
      'Maximum movement: 3 hexes',
      'Cost: 1 SP per hex',
      'Max 2 players per hex',
      'Cannot move to blocked hexes'
    ],
    tutorialTip: 'Movement Phase lets you explore the map. Click a valid hex within 3 spaces to move there.'
  },
  Battle: {
    title: 'Battle Phase',
    instruction: 'Play a Kill Team game and record your battle result',
    availableActions: [
      'Record battle result (WIN/LOSS/DRAW/BYE)',
      'Record missing opponent'
    ],
    keyRules: [
      'Must record result to advance',
      'Result determines Action Phase turn order',
      'Winners act first, then Draws, then Losses'
    ],
    tutorialTip: 'Battle Phase is where you record the results of your Kill Team game. This determines who goes first in the Action Phase.'
  },
  Action: {
    title: 'Action Phase',
    instruction: 'Choose one campaign action to perform',
    availableActions: [
      'Resupply - gain SP',
      'Scout - explore distant hex',
      'Search - find location rewards',
      'Encamp - build camp',
      'Demolish - destroy camps/beasts'
    ],
    keyRules: [
      'Can only perform ONE action',
      'Turn order: Winners → Draws → Losses',
      'Most actions cost SP',
      'Search is one-time per hex'
    ],
    tutorialTip: 'Action Phase lets you spend Supply Points on strategic actions. Winners from the Battle Phase act first!'
  },
  Threat: {
    title: 'Threat Phase',
    instruction: 'The Necron threat increases',
    availableActions: [
      'Resolve location threat rules (if any)',
      'Resolve threat attacks (if any)',
      'End turn (threat increases by +1)'
    ],
    keyRules: [
      'Threat always increases by +1',
      'Campaign ends when threat reaches target',
      'Some locations have special threat effects'
    ],
    tutorialTip: 'Threat Phase is automatic - the Necron threat level increases. When it reaches the target level, the campaign ends!'
  }
}

/**
 * WHY: Load phase guidance state from localStorage
 * Returns default state if nothing stored (all guidance enabled, none dismissed)
 */
export function loadPhaseGuidanceState(): PhaseGuidanceState {
  const stored = localStorage.getItem('ctesiphus-phase-guidance-dismissed')
  if (!stored) {
    return {
      movement: false,
      battle: false,
      action: false,
      threat: false,
      enabledGlobally: true
    }
  }
  return JSON.parse(stored)
}

/**
 * WHY: Save phase guidance state to localStorage
 * Persists which tooltips have been dismissed across sessions
 */
export function savePhaseGuidanceState(state: PhaseGuidanceState): void {
  localStorage.setItem('ctesiphus-phase-guidance-dismissed', JSON.stringify(state))
}

/**
 * WHY: Dismiss guidance for a specific phase
 * Loads current state, updates the phase flag, and saves back to localStorage
 */
export function dismissPhaseGuidance(phase: Phase): void {
  const state = loadPhaseGuidanceState()
  state[phase.toLowerCase() as keyof PhaseGuidanceState] = true
  savePhaseGuidanceState(state)
}
