import { describe, it, expect } from 'vitest'
import {
  detectMilestones,
  isIntervalMilestone,
  isHalfwayMilestone,
  isFinalWarning
} from './milestones'

/**
 * WHY: Test suite for milestone detection (Issue #31 - Phase 1)
 * Ensures milestones trigger at correct intervals and conditions
 */

describe('milestones', () => {
  describe('detectMilestones', () => {
    describe('when detecting interval milestones', () => {
      it('should detect milestone at round 5', () => {
        const result = detectMilestones(5, 3, 10, 4)

        expect(result).toHaveLength(1)
        expect(result[0]!.type).toBe('interval')
        expect(result[0]!.round).toBe(5)
        expect(result[0]!.message).toContain('Round 5')
      })

      it('should detect milestone at round 10', () => {
        const result = detectMilestones(10, 5, 10, 9)

        expect(result).toHaveLength(1)
        expect(result[0]!.type).toBe('interval')
        expect(result[0]!.round).toBe(10)
      })

      it('should detect milestone at round 15', () => {
        const result = detectMilestones(15, 8, 20, 14)

        expect(result).toHaveLength(1)
        expect(result[0]!.type).toBe('interval')
      })

      it('should not detect milestone at non-interval rounds', () => {
        const result = detectMilestones(7, 4, 10, 6)

        expect(result).toHaveLength(0)
      })
    })

    describe('when detecting halfway milestone', () => {
      it('should detect halfway point in campaign', () => {
        // WHY: Target threat 10, halfway is threat 5.5, triggers at threat 6
        const result = detectMilestones(5, 6, 10, 4)

        const halfway = result.find(m => m.type === 'halfway')
        expect(halfway).toBeDefined()
        expect(halfway?.message).toContain('halfway')
      })

      it('should not trigger halfway milestone twice', () => {
        // WHY: Previously crossed halfway point (threat increased by 1 per round)
        const result = detectMilestones(7, 7, 10, 6)

        const halfway = result.find(m => m.type === 'halfway')
        expect(halfway).toBeUndefined()
      })

      it('should handle odd target threat levels', () => {
        // WHY: Target 7, halfway is 4, triggers at threat 5 (previous round threat was 4)
        const result = detectMilestones(5, 5, 7, 4)

        const halfway = result.find(m => m.type === 'halfway')
        expect(halfway).toBeDefined()
      })
    })

    describe('when detecting final warning', () => {
      it('should warn when one threat away from target', () => {
        const result = detectMilestones(6, 6, 7, 5)

        const warning = result.find(m => m.type === 'final-warning')
        expect(warning).toBeDefined()
        expect(warning?.message).toContain('final')
      })

      it('should not warn when more than one away', () => {
        const result = detectMilestones(5, 5, 7, 4)

        const warning = result.find(m => m.type === 'final-warning')
        expect(warning).toBeUndefined()
      })

      it('should not warn at target threat level', () => {
        const result = detectMilestones(7, 7, 7, 6)

        const warning = result.find(m => m.type === 'final-warning')
        expect(warning).toBeUndefined()
      })
    })

    describe('when handling multiple milestones', () => {
      it('should return multiple milestones when they coincide', () => {
        // WHY: Round 5 (interval) + threat 6/10 (halfway)
        const result = detectMilestones(5, 6, 10, 4)

        expect(result.length).toBeGreaterThanOrEqual(1)
        const types = result.map(m => m.type)
        expect(types).toContain('interval')
      })

      it('should return empty array when no milestones', () => {
        const result = detectMilestones(3, 3, 10, 2)

        expect(result).toEqual([])
      })
    })

    describe('when validating milestone structure', () => {
      it('should include all required milestone fields', () => {
        const result = detectMilestones(5, 3, 10, 4)

        const milestone = result[0]!
        expect(milestone).toHaveProperty('type')
        expect(milestone).toHaveProperty('round')
        expect(milestone).toHaveProperty('message')
        expect(milestone).toHaveProperty('icon')
      })

      it('should include appropriate icons', () => {
        const result = detectMilestones(5, 3, 10, 4)

        expect(result[0]!.icon).toBeTruthy()
        expect(result[0]!.icon.length).toBeGreaterThan(0)
      })
    })
  })

  describe('isIntervalMilestone', () => {
    describe('when checking 5-round intervals', () => {
      it('should return true for round 5', () => {
        expect(isIntervalMilestone(5)).toBe(true)
      })

      it('should return true for round 10', () => {
        expect(isIntervalMilestone(10)).toBe(true)
      })

      it('should return true for round 15', () => {
        expect(isIntervalMilestone(15)).toBe(true)
      })

      it('should return false for round 1', () => {
        expect(isIntervalMilestone(1)).toBe(false)
      })

      it('should return false for round 7', () => {
        expect(isIntervalMilestone(7)).toBe(false)
      })
    })
  })

  describe('isHalfwayMilestone', () => {
    describe('when checking halfway point', () => {
      it('should trigger when crossing halfway threshold', () => {
        // WHY: Target 10, halfway is 5.5, current 6, previous threat 5
        const result = isHalfwayMilestone(6, 6, 10, 5)
        expect(result).toBe(true)
      })

      it('should not trigger before halfway', () => {
        const result = isHalfwayMilestone(4, 4, 10, 3)
        expect(result).toBe(false)
      })

      it('should not trigger after already crossing halfway', () => {
        // WHY: Already past halfway
        const result = isHalfwayMilestone(7, 7, 10, 6)
        expect(result).toBe(false)
      })

      it('should handle even target threat', () => {
        // WHY: Target 8, halfway is 4.5, triggers at threat 5
        const result = isHalfwayMilestone(5, 5, 8, 4)
        expect(result).toBe(true)
      })

      it('should handle odd target threat', () => {
        // WHY: Target 7, halfway is 4, current 5, previous threat 4
        const result = isHalfwayMilestone(5, 5, 7, 4)
        expect(result).toBe(true)
      })
    })
  })

  describe('isFinalWarning', () => {
    describe('when checking final round warning', () => {
      it('should return true when one away from target', () => {
        expect(isFinalWarning(6, 7)).toBe(true)
      })

      it('should return false when two away', () => {
        expect(isFinalWarning(5, 7)).toBe(false)
      })

      it('should return false at target', () => {
        expect(isFinalWarning(7, 7)).toBe(false)
      })

      it('should return false above target', () => {
        expect(isFinalWarning(8, 7)).toBe(false)
      })
    })
  })
})
