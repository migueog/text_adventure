import { describe, it, expect } from 'vitest'
import { estimateTotalRounds, calculateProgress } from './roundProgress'

/**
 * WHY: Test suite for round progress calculation (Issue #31 - Phase 1)
 * Ensures accurate estimation of total rounds and progress percentage
 */

describe('roundProgress', () => {
  describe('estimateTotalRounds', () => {
    describe('when estimating based on threat progression', () => {
      it('should estimate remaining rounds when threat < target', () => {
        // WHY: Current round 3, threat 4/7 → need 3 more rounds
        const result = estimateTotalRounds(3, 4, 7)
        expect(result).toBe(6)  // 3 current + 3 remaining
      })

      it('should return current round when threat equals target', () => {
        // WHY: Campaign is complete
        const result = estimateTotalRounds(5, 7, 7)
        expect(result).toBe(5)
      })

      it('should return current round when threat exceeds target', () => {
        // WHY: Shouldn't happen in normal gameplay, but handle gracefully
        const result = estimateTotalRounds(10, 8, 7)
        expect(result).toBe(10)
      })

      it('should handle round 1 with initial threat', () => {
        // WHY: Start of campaign
        const result = estimateTotalRounds(1, 1, 7)
        expect(result).toBe(7)  // 1 current + 6 remaining
      })

      it('should handle final round approach', () => {
        // WHY: One round away from completion
        const result = estimateTotalRounds(6, 6, 7)
        expect(result).toBe(7)  // 6 current + 1 remaining
      })
    })

    describe('when validating edge cases', () => {
      it('should handle minimum campaign (threat 1→2)', () => {
        const result = estimateTotalRounds(1, 1, 2)
        expect(result).toBe(2)
      })

      it('should handle maximum campaign (threat 1→10)', () => {
        const result = estimateTotalRounds(1, 1, 10)
        expect(result).toBe(10)
      })

      it('should handle mid-campaign state', () => {
        // WHY: Halfway through a 10-threat campaign
        const result = estimateTotalRounds(5, 5, 10)
        expect(result).toBe(10)
      })
    })
  })

  describe('calculateProgress', () => {
    describe('when calculating progress percentage', () => {
      it('should return 0% at campaign start', () => {
        const result = calculateProgress(1, 7)
        expect(result).toBe(0)
      })

      it('should return 100% at campaign end', () => {
        const result = calculateProgress(7, 7)
        expect(result).toBe(100)
      })

      it('should calculate 50% at midpoint', () => {
        const result = calculateProgress(4, 7)
        expect(result).toBe(50)
      })

      it('should calculate 75% at three-quarters', () => {
        const result = calculateProgress(7, 9)
        expect(result).toBe(75)
      })

      it('should round to nearest integer', () => {
        // WHY: (2-1)/(7-1) = 1/6 = 16.67%, should round to 17
        const result = calculateProgress(2, 7)
        expect(result).toBe(17)
      })
    })

    describe('when handling edge cases', () => {
      it('should cap progress at 100% when threat exceeds target', () => {
        // WHY: Shouldn't happen, but handle gracefully
        const result = calculateProgress(10, 7)
        expect(result).toBe(100)
      })

      it('should handle minimum campaign (1→2)', () => {
        const result = calculateProgress(1, 2)
        expect(result).toBe(0)
      })

      it('should handle maximum campaign (1→10)', () => {
        const result = calculateProgress(1, 10)
        expect(result).toBe(0)
      })
    })

    describe('when validating calculation formula', () => {
      it('should use formula: (current - 1) / (target - 1) * 100', () => {
        // WHY: Threat starts at 1, so progress is (current - 1) / (target - 1)
        // Example: threat 3/7 → (3-1)/(7-1) = 2/6 = 33%
        const result = calculateProgress(3, 7)
        expect(result).toBe(33)
      })

      it('should calculate exact percentages correctly', () => {
        // WHY: 5/10 → (5-1)/(10-1) = 4/9 = 44.44% → 44%
        const result = calculateProgress(5, 10)
        expect(result).toBe(44)
      })
    })
  })
})
