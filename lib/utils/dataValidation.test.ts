import { describe, it, expect } from 'vitest'
import {
  validateLocationData,
  validateLocationCoverage,
  validateConditionCoverage
} from './dataValidation'
import type { Location, Condition } from '@/types/campaign'

/**
 * WHY: Tests for data validation utilities ensuring D36 system integrity (Issue #58)
 * Validates that locations/conditions cover all D36 numbers without gaps
 */

describe('dataValidation', () => {
  describe('validateLocationData', () => {
    it('should accept repeatable location with number range', () => {
      const location: Partial<Location> = {
        id: 'SL11-16',
        number: '11-16',
        type: 'REPEATABLE',
        repeatable: true,
        name: 'Ruin',
        description: 'Repeatable location',
        effect: 'none'
      }

      const result = validateLocationData(location)
      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should reject repeatable location with single number', () => {
      const location: Partial<Location> = {
        id: 'SL11-16',
        number: 11,  // Should be "11-16" range
        type: 'REPEATABLE',
        repeatable: true,
        name: 'Ruin',
        description: 'Invalid',
        effect: 'none'
      }

      const result = validateLocationData(location)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Repeatable location must have number range (e.g., "11-16")')
    })

    it('should accept unique location with single number', () => {
      const location: Partial<Location> = {
        id: 'SL21',
        number: 21,
        type: 'UNIQUE',
        repeatable: false,
        name: 'Abandoned Camp',
        description: 'Unique location',
        effect: 'none'
      }

      const result = validateLocationData(location)
      expect(result.valid).toBe(true)
    })

    it('should reject unique location with range', () => {
      const location: Partial<Location> = {
        id: 'SL21',
        number: '21-26',  // Should be single number
        type: 'UNIQUE',
        repeatable: false,
        name: 'Invalid',
        description: 'Invalid',
        effect: 'none'
      }

      const result = validateLocationData(location)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Unique/Special location must have single number')
    })

    it('should validate ID format for surface locations', () => {
      const validLocation: Partial<Location> = {
        id: 'SL21',
        number: 21,
        type: 'UNIQUE',
        repeatable: false
      }

      expect(validateLocationData(validLocation).valid).toBe(true)
    })

    it('should validate ID format for tomb locations', () => {
      const validLocation: Partial<Location> = {
        id: 'TL21',
        number: 21,
        type: 'UNIQUE',
        repeatable: false
      }

      expect(validateLocationData(validLocation).valid).toBe(true)
    })

    it('should reject invalid ID format', () => {
      const invalidLocation: Partial<Location> = {
        id: 'INVALID',
        number: 21,
        type: 'UNIQUE',
        repeatable: false
      }

      const result = validateLocationData(invalidLocation)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid ID format. Expected SL11-16 or SL21 or TL11-16 or TL21')
    })

    it('should accept range ID format', () => {
      const location: Partial<Location> = {
        id: 'SL11-16',
        number: '11-16',
        type: 'REPEATABLE',
        repeatable: true
      }

      expect(validateLocationData(location).valid).toBe(true)
    })

    it('should handle missing properties gracefully', () => {
      const location: Partial<Location> = {
        name: 'Test'
      }

      const result = validateLocationData(location)
      // Should still validate what's present
      expect(result.valid).toBe(true)
    })
  })

  describe('validateLocationCoverage', () => {
    it('should accept complete D36 coverage (11-36)', () => {
      const locations: Partial<Location>[] = [
        { number: '11-16', repeatable: true },  // Covers 11, 12, 13, 14, 15, 16
        { number: 21, repeatable: false },
        { number: 22, repeatable: false },
        { number: 23, repeatable: false },
        { number: 24, repeatable: false },
        { number: 25, repeatable: false },
        { number: 26, repeatable: false },
        { number: 31, repeatable: false },
        { number: 32, repeatable: false },
        { number: 33, repeatable: false },
        { number: 34, repeatable: false },
        { number: 35, repeatable: false },
        { number: 36, repeatable: false }
      ]

      const result = validateLocationCoverage(locations)
      expect(result.valid).toBe(true)
      expect(result.missingNumbers).toEqual([])
    })

    it('should detect missing numbers', () => {
      const locations: Partial<Location>[] = [
        { number: '11-16', repeatable: true },
        { number: 21, repeatable: false },
        // Missing: 22, 23, 24, 25, 26, 31, 32, 33, 34, 35, 36
      ]

      const result = validateLocationCoverage(locations)
      expect(result.valid).toBe(false)
      expect(result.missingNumbers).toEqual([22, 23, 24, 25, 26, 31, 32, 33, 34, 35, 36])
    })

    it('should detect gap in coverage', () => {
      const locations: Partial<Location>[] = [
        { number: '11-16', repeatable: true },
        { number: 21, repeatable: false },
        // Gap: 22
        { number: 23, repeatable: false },
        { number: 24, repeatable: false },
        { number: 25, repeatable: false },
        { number: 26, repeatable: false },
        { number: 31, repeatable: false },
        { number: 32, repeatable: false },
        { number: 33, repeatable: false },
        { number: 34, repeatable: false },
        { number: 35, repeatable: false },
        { number: 36, repeatable: false }
      ]

      const result = validateLocationCoverage(locations)
      expect(result.valid).toBe(false)
      expect(result.missingNumbers).toEqual([22])
    })

    it('should handle empty location array', () => {
      const result = validateLocationCoverage([])
      expect(result.valid).toBe(false)
      expect(result.missingNumbers).toHaveLength(18)  // All D36 numbers: 11-16, 21-26, 31-36
    })

    it('should handle duplicate coverage without error', () => {
      const locations: Partial<Location>[] = [
        { number: '11-16', repeatable: true },
        { number: 21, repeatable: false },
        { number: 21, repeatable: false },  // Duplicate
        { number: 22, repeatable: false },
        { number: 23, repeatable: false },
        { number: 24, repeatable: false },
        { number: 25, repeatable: false },
        { number: 26, repeatable: false },
        { number: 31, repeatable: false },
        { number: 32, repeatable: false },
        { number: 33, repeatable: false },
        { number: 34, repeatable: false },
        { number: 35, repeatable: false },
        { number: 36, repeatable: false }
      ]

      const result = validateLocationCoverage(locations)
      expect(result.valid).toBe(true)  // Duplicates are OK, just check all are covered
    })
  })

  describe('validateConditionCoverage', () => {
    it('should accept complete D36 coverage for conditions', () => {
      const conditions: Partial<Condition>[] = [
        { number: '11-16', repeatable: true },  // Covers 11-16
        { number: 21, repeatable: false },
        { number: 22, repeatable: false },
        { number: 23, repeatable: false },
        { number: 24, repeatable: false },
        { number: 25, repeatable: false },
        { number: 26, repeatable: false },
        { number: 31, repeatable: false },
        { number: 32, repeatable: false },
        { number: 33, repeatable: false },
        { number: 34, repeatable: false },
        { number: 35, repeatable: false },
        { number: 36, repeatable: false }
      ]

      const result = validateConditionCoverage(conditions)
      expect(result.valid).toBe(true)
    })

    it('should detect missing condition numbers', () => {
      const conditions: Partial<Condition>[] = [
        { number: '11-16', repeatable: true },
        { number: 21, repeatable: false }
      ]

      const result = validateConditionCoverage(conditions)
      expect(result.valid).toBe(false)
      expect(result.missingNumbers).toHaveLength(11)  // 22-26, 31-36
    })
  })
})
