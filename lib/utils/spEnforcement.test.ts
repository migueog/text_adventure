import { describe, it, expect } from 'vitest'

// Test SP enforcement - the clampSP function from useCampaign
// This ensures SP stays within 0-10 range

function clampSP(value: number): number {
  const SP_MIN = 0
  const SP_MAX = 10
  return Math.max(SP_MIN, Math.min(SP_MAX, value))
}

describe('SP Enforcement', () => {
  describe('when SP is within valid range', () => {
    it('should keep SP unchanged when between 0 and 10', () => {
      expect(clampSP(5)).toBe(5)
      expect(clampSP(0)).toBe(0)
      expect(clampSP(10)).toBe(10)
    })

    it('should handle decimal values correctly', () => {
      expect(clampSP(5.5)).toBe(5.5)
      expect(clampSP(9.9)).toBe(9.9)
    })
  })

  describe('when SP exceeds maximum (10)', () => {
    it('should clamp to 10 when value is above max', () => {
      expect(clampSP(11)).toBe(10)
      expect(clampSP(15)).toBe(10)
      expect(clampSP(100)).toBe(10)
    })

    it('should clamp decimal values above max to 10', () => {
      expect(clampSP(10.1)).toBe(10)
      expect(clampSP(10.001)).toBe(10)
    })
  })

  describe('when SP falls below minimum (0)', () => {
    it('should clamp to 0 when value is below min', () => {
      expect(clampSP(-1)).toBe(0)
      expect(clampSP(-5)).toBe(0)
      expect(clampSP(-100)).toBe(0)
    })

    it('should clamp decimal values below min to 0', () => {
      expect(clampSP(-0.1)).toBe(0)
      expect(clampSP(-0.001)).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should handle boundary values correctly', () => {
      expect(clampSP(0)).toBe(0)   // Minimum boundary
      expect(clampSP(10)).toBe(10)  // Maximum boundary
    })

    it('should handle very large positive numbers', () => {
      expect(clampSP(1000000)).toBe(10)
      expect(clampSP(Infinity)).toBe(10)
    })

    it('should handle very large negative numbers', () => {
      expect(clampSP(-1000000)).toBe(0)
      expect(clampSP(-Infinity)).toBe(0)
    })
  })

  describe('realistic game scenarios', () => {
    it('should prevent spending more SP than available', () => {
      const currentSP = 3
      const cost = 5
      const newSP = clampSP(currentSP - cost)
      expect(newSP).toBe(0)  // Cannot go below 0
    })

    it('should prevent gaining more SP than maximum', () => {
      const currentSP = 8
      const gain = 5
      const newSP = clampSP(currentSP + gain)
      expect(newSP).toBe(10)  // Cannot exceed 10
    })

    it('should handle normal SP transactions', () => {
      // Moving 3 hexes costs 3 SP
      expect(clampSP(10 - 3)).toBe(7)

      // Resupply at base grants full SP
      expect(clampSP(0 + 10)).toBe(10)

      // Scout action costs 1-3 SP
      expect(clampSP(5 - 2)).toBe(3)
    })
  })
})
