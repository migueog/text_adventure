import { describe, it, expect } from 'vitest'
import {
  isValidBasePlacement,
  getMinimumBaseDistance,
  areBasesTooClose,
  calculateSuggestedBasePositions
} from '@/lib/utils/hexPlacement'
import type { HexPosition } from '@/types/campaign'

/**
 * WHY: Test base hex placement validation rules
 */

describe('Base Hex Placement Utilities', () => {
  describe('getMinimumBaseDistance', () => {
    it('should return 2 hexes minimum for 2-3 players', () => {
      // WHY: Small maps need more spacing
      expect(getMinimumBaseDistance(2)).toBe(2)
      expect(getMinimumBaseDistance(3)).toBe(2)
    })

    it('should return 1 hex minimum for 4-5 players', () => {
      // WHY: Medium maps have less spacing
      expect(getMinimumBaseDistance(4)).toBe(1)
      expect(getMinimumBaseDistance(5)).toBe(1)
    })

    it('should return 1 hex minimum for 6 players', () => {
      // WHY: Large maps have less spacing
      expect(getMinimumBaseDistance(6)).toBe(1)
    })
  })

  describe('areBasesTooClose', () => {
    it('should return false when bases are exactly minDistance apart', () => {
      const pos1: HexPosition = { row: 0, col: 0 }
      const pos2: HexPosition = { row: 0, col: 2 }

      // WHY: Distance is 2, which meets the minimum
      expect(areBasesTooClose(pos1, pos2, 2)).toBe(false)
    })

    it('should return true when bases are closer than minDistance', () => {
      const pos1: HexPosition = { row: 0, col: 0 }
      const pos2: HexPosition = { row: 0, col: 1 }

      // WHY: Distance is 1, less than minimum of 2
      expect(areBasesTooClose(pos1, pos2, 2)).toBe(true)
    })

    it('should return false when bases are farther than minDistance', () => {
      const pos1: HexPosition = { row: 0, col: 0 }
      const pos2: HexPosition = { row: 0, col: 3 }

      // WHY: Distance is 3, greater than minimum of 2
      expect(areBasesTooClose(pos1, pos2, 2)).toBe(false)
    })

    it('should calculate distance correctly for diagonal hexes', () => {
      const pos1: HexPosition = { row: 0, col: 0 }
      const pos2: HexPosition = { row: 1, col: 1 }

      // WHY: Diagonal distance should be calculated correctly
      expect(areBasesTooClose(pos1, pos2, 1)).toBe(false)
    })
  })

  describe('isValidBasePlacement', () => {
    it('should allow base on surface hex with no existing bases', () => {
      const position: HexPosition = { row: 0, col: 2 }
      const existingBases: HexPosition[] = []
      const playerCount = 2

      // WHY: First base placement should always be valid on surface
      expect(isValidBasePlacement(position, existingBases, playerCount, true)).toBe(true)
    })

    it('should reject base on tomb hex', () => {
      const position: HexPosition = { row: 3, col: 2 }
      const existingBases: HexPosition[] = []
      const playerCount = 2

      // WHY: Bases must be on surface hexes only
      expect(isValidBasePlacement(position, existingBases, playerCount, false)).toBe(false)
    })

    it('should reject base too close to existing base (2-3 players)', () => {
      const position: HexPosition = { row: 0, col: 1 }
      const existingBases: HexPosition[] = [{ row: 0, col: 0 }]
      const playerCount = 2

      // WHY: Bases must be at least 2 hexes apart for 2-3 players
      expect(isValidBasePlacement(position, existingBases, playerCount, true)).toBe(false)
    })

    it('should allow base at minimum distance from existing base (2-3 players)', () => {
      const position: HexPosition = { row: 0, col: 2 }
      const existingBases: HexPosition[] = [{ row: 0, col: 0 }]
      const playerCount = 2

      // WHY: Distance of 2 meets minimum requirement
      expect(isValidBasePlacement(position, existingBases, playerCount, true)).toBe(true)
    })

    it('should allow base closer together for 4+ players', () => {
      const position: HexPosition = { row: 0, col: 1 }
      const existingBases: HexPosition[] = [{ row: 0, col: 0 }]
      const playerCount = 4

      // WHY: 4+ players only need 1 hex minimum distance
      expect(isValidBasePlacement(position, existingBases, playerCount, true)).toBe(true)
    })

    it('should reject base at same position as existing base', () => {
      const position: HexPosition = { row: 0, col: 0 }
      const existingBases: HexPosition[] = [{ row: 0, col: 0 }]
      const playerCount = 4

      // WHY: Cannot place base on same hex
      expect(isValidBasePlacement(position, existingBases, playerCount, true)).toBe(false)
    })
  })

  describe('calculateSuggestedBasePositions', () => {
    it('should suggest evenly spaced positions for 2 players on 5x5 map', () => {
      const config = { rows: 5, cols: 5, surfaceRows: 2, tombRows: 3, name: 'Small' }
      const suggestions = calculateSuggestedBasePositions(config, 2)

      // WHY: Should suggest 2 positions on surface row
      expect(suggestions).toHaveLength(2)
      suggestions.forEach(pos => {
        expect(pos.row).toBeLessThan(config.surfaceRows)
      })
    })

    it('should suggest positions with adequate spacing', () => {
      const config = { rows: 5, cols: 5, surfaceRows: 2, tombRows: 3, name: 'Small' }
      const suggestions = calculateSuggestedBasePositions(config, 2)

      // WHY: Suggested positions should be well-spaced
      expect(suggestions.length).toBe(2)
      expect(suggestions[0]).toBeDefined()
      expect(suggestions[1]).toBeDefined()
      const distance = Math.abs(suggestions[0]!.col - suggestions[1]!.col)
      expect(distance).toBeGreaterThanOrEqual(2)
    })

    it('should suggest correct number of positions for each player count', () => {
      const config = { rows: 6, cols: 6, surfaceRows: 3, tombRows: 3, name: 'Standard' }

      expect(calculateSuggestedBasePositions(config, 2)).toHaveLength(2)
      expect(calculateSuggestedBasePositions(config, 3)).toHaveLength(3)
      expect(calculateSuggestedBasePositions(config, 4)).toHaveLength(4)
      expect(calculateSuggestedBasePositions(config, 5)).toHaveLength(5)
      expect(calculateSuggestedBasePositions(config, 6)).toHaveLength(6)
    })
  })
})
