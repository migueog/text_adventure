import { describe, it, expect } from 'vitest'
import {
  canCompletePhase,
  canAdvancePhase,
  getPhaseCompletionStatus,
  type PhaseCompletion
} from './phaseValidation'

describe('Phase Validation', () => {
  describe('canCompletePhase', () => {
    describe('Movement phase', () => {
      it('should allow completion without action (optional)', () => {
        const result = canCompletePhase('movement', { movement: false })
        expect(result.canComplete).toBe(true)
      })

      it('should allow completion with action', () => {
        const result = canCompletePhase('movement', { movement: true })
        expect(result.canComplete).toBe(true)
      })
    })

    describe('Battle phase', () => {
      it('should require battle result to complete', () => {
        const result = canCompletePhase('battle', { battle: false })
        expect(result.canComplete).toBe(false)
        expect(result.reason).toContain('must record a battle result')
      })

      it('should allow completion when battle result recorded', () => {
        const result = canCompletePhase('battle', { battle: true })
        expect(result.canComplete).toBe(true)
      })
    })

    describe('Action phase', () => {
      it('should allow completion without action (optional)', () => {
        const result = canCompletePhase('action', { action: false })
        expect(result.canComplete).toBe(true)
      })

      it('should allow completion with action', () => {
        const result = canCompletePhase('action', { action: true })
        expect(result.canComplete).toBe(true)
      })
    })

    describe('Threat phase', () => {
      it('should require threat increase to complete', () => {
        const result = canCompletePhase('threat', { threat: false })
        expect(result.canComplete).toBe(false)
        expect(result.reason).toContain('auto-completes when threat is increased')
      })

      it('should allow completion when threat increased', () => {
        const result = canCompletePhase('threat', { threat: true })
        expect(result.canComplete).toBe(true)
      })
    })
  })

  describe('canAdvancePhase', () => {
    it('should allow advancing from optional phases without completion', () => {
      const result = canAdvancePhase('movement', { movement: false })
      expect(result.canAdvance).toBe(true)
    })

    it('should block advancing from required phases without completion', () => {
      const result = canAdvancePhase('battle', { battle: false })
      expect(result.canAdvance).toBe(false)
      expect(result.reason).toBeTruthy()
    })

    it('should allow advancing when phase requirements met', () => {
      const result = canAdvancePhase('battle', { battle: true })
      expect(result.canAdvance).toBe(true)
    })

    it('should handle invalid phase names', () => {
      const result = canAdvancePhase('invalid', {})
      expect(result.canAdvance).toBe(false)
      expect(result.reason).toBe('Invalid phase')
    })
  })

  describe('getPhaseCompletionStatus', () => {
    it('should mark completed phases as completed', () => {
      const status = getPhaseCompletionStatus({
        movement: true,
        battle: true,
        action: false,
        threat: false
      })

      expect(status.movement).toBe('completed')
      expect(status.battle).toBe('completed')
    })

    it('should mark incomplete phases as in-progress', () => {
      const status = getPhaseCompletionStatus({
        movement: false,
        battle: false,
        action: false,
        threat: false
      })

      expect(status.movement).toBe('in-progress')
      expect(status.battle).toBe('in-progress')
      expect(status.action).toBe('in-progress')
      expect(status.threat).toBe('in-progress')
    })

    it('should handle partial completion', () => {
      const status = getPhaseCompletionStatus({
        movement: true,
        battle: false
      })

      expect(status.movement).toBe('completed')
      expect(status.battle).toBe('in-progress')
    })
  })

  describe('complete round flow', () => {
    it('should allow progressing through all phases when requirements met', () => {
      // Movement (optional, skipped)
      const moveResult = canAdvancePhase('movement', { movement: false })
      expect(moveResult.canAdvance).toBe(true)

      // Battle (required, completed)
      const battleResult = canAdvancePhase('battle', { battle: true })
      expect(battleResult.canAdvance).toBe(true)

      // Action (optional, completed)
      const actionResult = canAdvancePhase('action', { action: true })
      expect(actionResult.canAdvance).toBe(true)

      // Threat (required, completed)
      const threatResult = canAdvancePhase('threat', { threat: true })
      expect(threatResult.canAdvance).toBe(true)
    })

    it('should block progression if required phase not completed', () => {
      // Can skip movement
      const moveResult = canAdvancePhase('movement', { movement: false })
      expect(moveResult.canAdvance).toBe(true)

      // Cannot skip battle
      const battleResult = canAdvancePhase('battle', { battle: false })
      expect(battleResult.canAdvance).toBe(false)
    })
  })
})
