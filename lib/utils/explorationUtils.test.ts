import { describe, it, expect, vi } from 'vitest'
import {
  getExploredLocationIds,
  getExploredConditionIds,
  shouldRerollLocation,
  shouldRerollCondition,
  rollWithRerolls,
  rollConditionWithRerolls
} from './explorationUtils'
import type { Hex, Location, Condition } from '@/types/campaign'

/**
 * WHY: Tests for re-roll system ensuring duplicate locations/conditions are re-rolled (Issue #58)
 * Repeatable entries (11-16) allow duplicates, unique entries require re-rolling
 */

describe('explorationUtils', () => {
  describe('getExploredLocationIds', () => {
    it('should return empty array for unexplored hexes', () => {
      const hexes: Record<string, Hex> = {
        'hex_0_0': {
          id: 'hex_0_0',
          row: 0,
          col: 0,
          type: 'surface',
          location: 11,
          condition: 11,
          explored: false,
          exploredBy: []
        }
      }

      const result = getExploredLocationIds(hexes)
      expect(result).toEqual([])
    })

    it('should extract location IDs from explored hexes', () => {
      const hexes: Record<string, Hex> = {
        'hex_0_0': {
          id: 'hex_0_0',
          row: 0,
          col: 0,
          type: 'surface',
          location: 21,
          condition: 11,
          explored: true,
          exploredBy: [0],
          exploredLocation: 'SL21'
        },
        'hex_0_1': {
          id: 'hex_0_1',
          row: 0,
          col: 1,
          type: 'surface',
          location: 22,
          condition: 11,
          explored: true,
          exploredBy: [0],
          exploredLocation: 'SL22'
        },
        'hex_0_2': {
          id: 'hex_0_2',
          row: 0,
          col: 2,
          type: 'surface',
          location: 11,
          condition: 11,
          explored: false,
          exploredBy: []
        }
      }

      const result = getExploredLocationIds(hexes)
      expect(result).toEqual(['SL21', 'SL22'])
    })

    it('should handle repeatable locations appearing multiple times', () => {
      const hexes: Record<string, Hex> = {
        'hex_0_0': {
          id: 'hex_0_0',
          row: 0,
          col: 0,
          type: 'surface',
          location: 11,
          condition: 11,
          explored: true,
          exploredBy: [0],
          exploredLocation: 'SL11-16'
        },
        'hex_0_1': {
          id: 'hex_0_1',
          row: 0,
          col: 1,
          type: 'surface',
          location: 12,
          condition: 11,
          explored: true,
          exploredBy: [1],
          exploredLocation: 'SL11-16'
        }
      }

      const result = getExploredLocationIds(hexes)
      expect(result).toEqual(['SL11-16', 'SL11-16'])
    })

    it('should handle hexes without exploredLocation property', () => {
      const hexes: Record<string, Hex> = {
        'hex_0_0': {
          id: 'hex_0_0',
          row: 0,
          col: 0,
          type: 'surface',
          location: 21,
          condition: 11,
          explored: true,
          exploredBy: [0]
          // Missing exploredLocation
        }
      }

      const result = getExploredLocationIds(hexes)
      expect(result).toEqual([])
    })
  })

  describe('shouldRerollLocation', () => {
    it('should allow repeatable locations even if already explored', () => {
      const location: Location = {
        id: 'SL11-16',
        number: '11-16',
        type: 'REPEATABLE',
        repeatable: true,
        name: 'Ruin',
        description: 'Repeatable',
        effect: 'none',
        searchRule: null
      }

      const exploredIds = ['SL11-16', 'SL21', 'SL22']
      const result = shouldRerollLocation(location, exploredIds)
      expect(result).toBe(false)  // No re-roll needed
    })

    it('should reject duplicate unique locations', () => {
      const location: Location = {
        id: 'SL21',
        number: 21,
        type: 'UNIQUE',
        repeatable: false,
        name: 'Abandoned Camp',
        description: 'Unique',
        effect: 'none',
        searchRule: null
      }

      const exploredIds = ['SL21', 'SL22']
      const result = shouldRerollLocation(location, exploredIds)
      expect(result).toBe(true)  // Re-roll needed
    })

    it('should allow unique location if not yet explored', () => {
      const location: Location = {
        id: 'SL21',
        number: 21,
        type: 'UNIQUE',
        repeatable: false,
        name: 'Abandoned Camp',
        description: 'Unique',
        effect: 'none',
        searchRule: null
      }

      const exploredIds = ['SL22', 'SL23']
      const result = shouldRerollLocation(location, exploredIds)
      expect(result).toBe(false)  // No re-roll needed
    })
  })

  describe('rollWithRerolls', () => {
    it('should return first roll if location is unique and not explored', () => {
      const mockRoll = vi.fn().mockReturnValue(21)

      const exploredIds: string[] = ['SL22', 'SL23']
      const locations: Record<number, Location> = {
        21: {
          id: 'SL21',
          number: 21,
          type: 'UNIQUE',
          repeatable: false,
          name: 'Test',
          description: 'Test',
          effect: 'none',
          searchRule: null
        }
      }

      const result = rollWithRerolls(mockRoll, exploredIds, locations)
      expect(result).toBe(21)
      expect(mockRoll).toHaveBeenCalledTimes(1)
    })

    it('should re-roll on duplicate until unique found', () => {
      const mockRoll = vi.fn()
        .mockReturnValueOnce(21)  // Duplicate
        .mockReturnValueOnce(22)  // Duplicate
        .mockReturnValueOnce(23)  // Unique!

      const exploredIds = ['SL21', 'SL22']
      const locations: Record<number, Location> = {
        21: { id: 'SL21', number: 21, type: 'UNIQUE', repeatable: false, name: '', description: '', effect: '', searchRule: null },
        22: { id: 'SL22', number: 22, type: 'UNIQUE', repeatable: false, name: '', description: '', effect: '', searchRule: null },
        23: { id: 'SL23', number: 23, type: 'UNIQUE', repeatable: false, name: '', description: '', effect: '', searchRule: null }
      }

      const result = rollWithRerolls(mockRoll, exploredIds, locations)
      expect(result).toBe(23)
      expect(mockRoll).toHaveBeenCalledTimes(3)
    })

    it('should stop after max re-rolls and return last roll', () => {
      const mockRoll = vi.fn().mockReturnValue(21)  // Always returns duplicate

      const exploredIds = ['SL21']
      const locations: Record<number, Location> = {
        21: { id: 'SL21', number: 21, type: 'UNIQUE', repeatable: false, name: '', description: '', effect: '', searchRule: null }
      }

      const result = rollWithRerolls(mockRoll, exploredIds, locations, 5)  // Max 5 re-rolls
      expect(result).toBe(21)
      expect(mockRoll).toHaveBeenCalledTimes(6)  // Initial + 5 re-rolls
    })

    it('should accept repeatable location without re-rolling', () => {
      const mockRoll = vi.fn().mockReturnValue(11)

      const exploredIds = ['SL11-16']  // Already explored
      const locations: Record<number, Location> = {
        11: { id: 'SL11-16', number: '11-16', type: 'REPEATABLE', repeatable: true, name: '', description: '', effect: '', searchRule: null }
      }

      const result = rollWithRerolls(mockRoll, exploredIds, locations)
      expect(result).toBe(11)
      expect(mockRoll).toHaveBeenCalledTimes(1)  // No re-rolls
    })

    it('should handle missing location data gracefully', () => {
      const mockRoll = vi.fn().mockReturnValue(99)  // Invalid roll

      const exploredIds: string[] = []
      const locations: Record<number, Location> = {}

      const result = rollWithRerolls(mockRoll, exploredIds, locations)
      expect(result).toBe(99)  // Returns roll even if no location found
      expect(mockRoll).toHaveBeenCalledTimes(1)
    })
  })

  describe('getExploredConditionIds', () => {
    it('should extract condition IDs from explored hexes', () => {
      const hexes: Record<string, Hex> = {
        'hex_0_0': {
          id: 'hex_0_0',
          row: 0,
          col: 0,
          type: 'surface',
          location: 21,
          condition: 21,
          explored: true,
          exploredBy: [0],
          exploredCondition: 'SC21'
        },
        'hex_0_1': {
          id: 'hex_0_1',
          row: 0,
          col: 1,
          type: 'surface',
          location: 22,
          condition: 22,
          explored: true,
          exploredBy: [0],
          exploredCondition: 'SC22'
        }
      }

      const result = getExploredConditionIds(hexes)
      expect(result).toEqual(['SC21', 'SC22'])
    })
  })

  describe('shouldRerollCondition', () => {
    it('should allow repeatable conditions', () => {
      const condition: Condition = {
        id: 'SC11-16',
        number: '11-16',
        type: 'REPEATABLE',
        repeatable: true,
        name: 'Clear',
        description: 'Repeatable',
        effect: 'none'
      }

      const result = shouldRerollCondition(condition, ['SC11-16'])
      expect(result).toBe(false)
    })

    it('should reject duplicate standard conditions', () => {
      const condition: Condition = {
        id: 'SC21',
        number: 21,
        type: 'STANDARD',
        repeatable: false,
        name: 'Dust Storm',
        description: 'Unique',
        effect: 'combat'
      }

      const result = shouldRerollCondition(condition, ['SC21'])
      expect(result).toBe(true)
    })
  })

  describe('rollConditionWithRerolls', () => {
    it('should re-roll duplicate conditions', () => {
      const mockRoll = vi.fn()
        .mockReturnValueOnce(21)  // Duplicate
        .mockReturnValueOnce(22)  // Unique

      const exploredIds = ['SC21']
      const conditions: Record<number, Condition> = {
        21: { id: 'SC21', number: 21, type: 'STANDARD', repeatable: false, name: '', description: '', effect: '' },
        22: { id: 'SC22', number: 22, type: 'STANDARD', repeatable: false, name: '', description: '', effect: '' }
      }

      const result = rollConditionWithRerolls(mockRoll, exploredIds, conditions)
      expect(result).toBe(22)
      expect(mockRoll).toHaveBeenCalledTimes(2)
    })
  })
})
