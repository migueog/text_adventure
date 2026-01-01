import { describe, it, expect } from 'vitest'
import { calculateThreatWarning } from './threatWarning'

/**
 * Tests for Threat Warning Calculation (Issue #29 - Phase 2)
 * WHY: Verify warning levels trigger at correct threat distances
 */

describe('calculateThreatWarning (Issue #29)', () => {
  describe('critical threshold', () => {
    it('should return "critical" when 1 level from target', () => {
      // WHY: Critical warning at distance = 1
      const result = calculateThreatWarning(6, 7)
      expect(result).toBe('critical')
    })

    it('should return "critical" when 0 levels from target (at target)', () => {
      // WHY: Campaign end condition is critical
      const result = calculateThreatWarning(7, 7)
      expect(result).toBe('critical')
    })

    it('should return "critical" when current exceeds target', () => {
      // WHY: Extended campaign beyond target is still critical
      const result = calculateThreatWarning(8, 7)
      expect(result).toBe('critical')
    })

    it('should return "critical" for distance <= 1', () => {
      // WHY: Any distance ≤1 is critical
      expect(calculateThreatWarning(9, 10)).toBe('critical')
      expect(calculateThreatWarning(10, 10)).toBe('critical')
    })
  })

  describe('moderate threshold', () => {
    it('should return "moderate" when exactly 2 levels from target', () => {
      // WHY: Moderate warning at distance = 2
      const result = calculateThreatWarning(5, 7)
      expect(result).toBe('moderate')
    })

    it('should return "moderate" for various targets at distance 2', () => {
      // WHY: Distance-based, not absolute threat level
      expect(calculateThreatWarning(3, 5)).toBe('moderate')
      expect(calculateThreatWarning(8, 10)).toBe('moderate')
      expect(calculateThreatWarning(1, 3)).toBe('moderate')
    })
  })

  describe('none state', () => {
    it('should return "none" when more than 2 levels from target', () => {
      // WHY: No warning when distance > 2
      const result = calculateThreatWarning(3, 7)
      expect(result).toBe('none')
    })

    it('should return "none" at start of campaign', () => {
      // WHY: Campaign start (threat=1, target=7) has distance=6
      const result = calculateThreatWarning(1, 7)
      expect(result).toBe('none')
    })

    it('should return "none" for distance 3 or greater', () => {
      // WHY: Safe zone is 3+ levels away
      expect(calculateThreatWarning(1, 4)).toBe('none')
      expect(calculateThreatWarning(2, 7)).toBe('none')
      expect(calculateThreatWarning(4, 10)).toBe('none')
    })
  })

  describe('edge cases', () => {
    it('should handle target threat of 1', () => {
      // WHY: Minimal campaign length
      expect(calculateThreatWarning(1, 1)).toBe('critical') // At target
    })

    it('should handle current threat of 10', () => {
      // WHY: Maximum threat level
      expect(calculateThreatWarning(10, 10)).toBe('critical') // At target
      expect(calculateThreatWarning(10, 12)).toBe('moderate') // 2 from target=12
    })

    it('should handle maximum distance', () => {
      // WHY: Very long campaign (threat=1, target=10)
      const result = calculateThreatWarning(1, 10)
      expect(result).toBe('none') // Distance = 9
    })

    it('should handle all threat levels 1-10 with target 7', () => {
      // WHY: Verify progression through standard campaign
      expect(calculateThreatWarning(1, 7)).toBe('none') // Distance 6
      expect(calculateThreatWarning(2, 7)).toBe('none') // Distance 5
      expect(calculateThreatWarning(3, 7)).toBe('none') // Distance 4
      expect(calculateThreatWarning(4, 7)).toBe('none') // Distance 3
      expect(calculateThreatWarning(5, 7)).toBe('moderate') // Distance 2
      expect(calculateThreatWarning(6, 7)).toBe('critical') // Distance 1
      expect(calculateThreatWarning(7, 7)).toBe('critical') // Distance 0
      expect(calculateThreatWarning(8, 7)).toBe('critical') // Extended
      expect(calculateThreatWarning(9, 7)).toBe('critical') // Extended
      expect(calculateThreatWarning(10, 7)).toBe('critical') // Extended
    })
  })

  describe('input validation', () => {
    it('should handle minimum values (1, 1)', () => {
      // WHY: Both at minimum
      const result = calculateThreatWarning(1, 1)
      expect(result).toBe('critical')
    })

    it('should handle maximum values (10, 10)', () => {
      // WHY: Both at maximum
      const result = calculateThreatWarning(10, 10)
      expect(result).toBe('critical')
    })

    it('should handle current > target (extended campaign)', () => {
      // WHY: Campaign continues past target
      const result = calculateThreatWarning(10, 7)
      expect(result).toBe('critical') // Negative distance still critical
    })
  })
})
