import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadPhaseGuidanceState,
  savePhaseGuidanceState,
  dismissPhaseGuidance,
  PHASE_GUIDANCE
} from './phaseGuidance'
import type { PhaseGuidanceState } from '@/types/campaign'

/**
 * WHY: Tests for phase guidance utility functions
 * Ensures localStorage management and guidance content structure work correctly
 */

describe('phaseGuidance', () => {
  // Mock localStorage
  let store: Record<string, string> = {}

  const localStorageMock = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    clear: () => {
      store = {}
    }
  }

  beforeEach(() => {
    // Clear store and set localStorage on globalThis
    store = {}
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    store = {}
  })

  describe('loadPhaseGuidanceState', () => {
    it('should return default state when localStorage is empty', () => {
      const state = loadPhaseGuidanceState()

      expect(state).toEqual({
        movement: false,
        battle: false,
        action: false,
        threat: false,
        enabledGlobally: true
      })
    })

    it('should return stored state from localStorage', () => {
      const storedState: PhaseGuidanceState = {
        movement: true,
        battle: false,
        action: true,
        threat: false,
        enabledGlobally: true
      }

      localStorage.setItem('ctesiphus-phase-guidance-dismissed', JSON.stringify(storedState))

      const state = loadPhaseGuidanceState()
      expect(state).toEqual(storedState)
    })

    it('should handle all phases dismissed', () => {
      const storedState: PhaseGuidanceState = {
        movement: true,
        battle: true,
        action: true,
        threat: true,
        enabledGlobally: false
      }

      localStorage.setItem('ctesiphus-phase-guidance-dismissed', JSON.stringify(storedState))

      const state = loadPhaseGuidanceState()
      expect(state).toEqual(storedState)
    })
  })

  describe('savePhaseGuidanceState', () => {
    it('should save state to localStorage', () => {
      const state: PhaseGuidanceState = {
        movement: true,
        battle: false,
        action: true,
        threat: false,
        enabledGlobally: true
      }

      savePhaseGuidanceState(state)

      const stored = localStorage.getItem('ctesiphus-phase-guidance-dismissed')
      expect(stored).toBeDefined()
      expect(JSON.parse(stored!)).toEqual(state)
    })

    it('should overwrite existing state', () => {
      const initialState: PhaseGuidanceState = {
        movement: false,
        battle: false,
        action: false,
        threat: false,
        enabledGlobally: true
      }

      savePhaseGuidanceState(initialState)

      const updatedState: PhaseGuidanceState = {
        movement: true,
        battle: true,
        action: false,
        threat: false,
        enabledGlobally: true
      }

      savePhaseGuidanceState(updatedState)

      const stored = localStorage.getItem('ctesiphus-phase-guidance-dismissed')
      expect(JSON.parse(stored!)).toEqual(updatedState)
    })
  })

  describe('dismissPhaseGuidance', () => {
    it('should dismiss movement phase guidance', () => {
      dismissPhaseGuidance('Movement')

      const state = loadPhaseGuidanceState()
      expect(state.movement).toBe(true)
      expect(state.battle).toBe(false)
      expect(state.action).toBe(false)
      expect(state.threat).toBe(false)
    })

    it('should dismiss battle phase guidance', () => {
      dismissPhaseGuidance('Battle')

      const state = loadPhaseGuidanceState()
      expect(state.movement).toBe(false)
      expect(state.battle).toBe(true)
      expect(state.action).toBe(false)
      expect(state.threat).toBe(false)
    })

    it('should dismiss action phase guidance', () => {
      dismissPhaseGuidance('Action')

      const state = loadPhaseGuidanceState()
      expect(state.movement).toBe(false)
      expect(state.battle).toBe(false)
      expect(state.action).toBe(true)
      expect(state.threat).toBe(false)
    })

    it('should dismiss threat phase guidance', () => {
      dismissPhaseGuidance('Threat')

      const state = loadPhaseGuidanceState()
      expect(state.movement).toBe(false)
      expect(state.battle).toBe(false)
      expect(state.action).toBe(false)
      expect(state.threat).toBe(true)
    })

    it('should preserve previous dismissals', () => {
      dismissPhaseGuidance('Movement')
      dismissPhaseGuidance('Action')

      const state = loadPhaseGuidanceState()
      expect(state.movement).toBe(true)
      expect(state.battle).toBe(false)
      expect(state.action).toBe(true)
      expect(state.threat).toBe(false)
    })
  })

  describe('PHASE_GUIDANCE content structure', () => {
    it('should have guidance for all four phases', () => {
      expect(PHASE_GUIDANCE.Movement).toBeDefined()
      expect(PHASE_GUIDANCE.Battle).toBeDefined()
      expect(PHASE_GUIDANCE.Action).toBeDefined()
      expect(PHASE_GUIDANCE.Threat).toBeDefined()
    })

    it('should have correct structure for Movement phase', () => {
      const guidance = PHASE_GUIDANCE.Movement

      expect(guidance.title).toBe('Movement Phase')
      expect(guidance.instruction).toBeTruthy()
      expect(Array.isArray(guidance.availableActions)).toBe(true)
      expect(guidance.availableActions.length).toBeGreaterThan(0)
      expect(Array.isArray(guidance.keyRules)).toBe(true)
      expect(guidance.keyRules.length).toBeGreaterThan(0)
      expect(guidance.tutorialTip).toBeTruthy()
    })

    it('should have correct structure for Battle phase', () => {
      const guidance = PHASE_GUIDANCE.Battle

      expect(guidance.title).toBe('Battle Phase')
      expect(guidance.instruction).toBeTruthy()
      expect(Array.isArray(guidance.availableActions)).toBe(true)
      expect(guidance.availableActions.length).toBeGreaterThan(0)
      expect(Array.isArray(guidance.keyRules)).toBe(true)
      expect(guidance.keyRules.length).toBeGreaterThan(0)
      expect(guidance.tutorialTip).toBeTruthy()
    })

    it('should have correct structure for Action phase', () => {
      const guidance = PHASE_GUIDANCE.Action

      expect(guidance.title).toBe('Action Phase')
      expect(guidance.instruction).toBeTruthy()
      expect(Array.isArray(guidance.availableActions)).toBe(true)
      expect(guidance.availableActions.length).toBeGreaterThan(0)
      expect(Array.isArray(guidance.keyRules)).toBe(true)
      expect(guidance.keyRules.length).toBeGreaterThan(0)
      expect(guidance.tutorialTip).toBeTruthy()
    })

    it('should have correct structure for Threat phase', () => {
      const guidance = PHASE_GUIDANCE.Threat

      expect(guidance.title).toBe('Threat Phase')
      expect(guidance.instruction).toBeTruthy()
      expect(Array.isArray(guidance.availableActions)).toBe(true)
      expect(guidance.availableActions.length).toBeGreaterThan(0)
      expect(Array.isArray(guidance.keyRules)).toBe(true)
      expect(guidance.keyRules.length).toBeGreaterThan(0)
      expect(guidance.tutorialTip).toBeTruthy()
    })

    it('should have non-empty content for all fields', () => {
      const phases = ['Movement', 'Battle', 'Action', 'Threat'] as const

      phases.forEach(phase => {
        const guidance = PHASE_GUIDANCE[phase]

        expect(guidance.title.length).toBeGreaterThan(0)
        expect(guidance.instruction.length).toBeGreaterThan(0)
        expect(guidance.tutorialTip.length).toBeGreaterThan(0)

        guidance.availableActions.forEach(action => {
          expect(action.length).toBeGreaterThan(0)
        })

        guidance.keyRules.forEach(rule => {
          expect(rule.length).toBeGreaterThan(0)
        })
      })
    })
  })
})
