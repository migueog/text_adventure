/**
 * WHY: Issue #57 - Tests for legacy map restoration
 * TDD: Write tests first before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { restoreLegacyHexGrid, convertBaseToAbandonedCamp } from './restoreLegacyMap'
import type { CampaignSnapshot } from '@/types/legacyCampaign'
import type { HexPosition } from '@/types/campaign'
import * as dice from './dice'

describe('restoreLegacyMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('restoreLegacyHexGrid', () => {
    const mockSnapshot: CampaignSnapshot = {
      campaignId: 'campaign-123',
      campaignName: 'Test Campaign',
      playerName: 'Player 1',
      killTeamName: 'Squad Alpha',
      mapSize: { rows: 5, cols: 5 },
      exploredHexes: [
        {
          hexId: '0,2',
          row: 0,
          col: 2,
          type: 'surface',
          locationNumber: 25,
          conditionNumber: 21,
          locationId: 'SL25',
          conditionId: 'SC21',
          searched: true,
          camped: true
        },
        {
          hexId: '1,1',
          row: 1,
          col: 1,
          type: 'surface',
          locationNumber: 16,
          conditionNumber: 16,
          locationId: 'SL11-16',
          conditionId: 'SC11-16',
          searched: true,
          camped: false
        },
        {
          hexId: '2,2',
          row: 2,
          col: 2,
          type: 'tomb',
          locationNumber: 21,
          conditionNumber: 25,
          locationId: 'TL21',
          conditionId: 'TC25',
          searched: false,
          camped: false,
          state: {
            portalDestinations: {
              tomb: '3,2',
              surface: '0,1'
            }
          }
        }
      ],
      finalCP: 11,
      finalThreat: 10,
      rounds: 12,
      success: true,
      completedDate: '2025-01-04T10:00:00Z',
      targetThreatLevel: 10
    }

    const newBaseHex: HexPosition = { row: 0, col: 0 }
    const abandonedCampCondition = 22

    it('should create hex grid with correct dimensions', () => {
      const hexes = restoreLegacyHexGrid(mockSnapshot, newBaseHex, abandonedCampCondition)

      const hexCount = Object.keys(hexes).length
      expect(hexCount).toBe(25) // 5x5 grid
    })

    it('should restore explored hexes with locations and conditions', () => {
      const hexes = restoreLegacyHexGrid(mockSnapshot, newBaseHex, abandonedCampCondition)

      const hex0_2 = hexes['0,2']
      expect(hex0_2.explored).toBe(true)
      expect(hex0_2.location).toBe(25)
      expect(hex0_2.condition).toBe(21)
      expect(hex0_2.exploredLocation).toBe('SL25')
      expect(hex0_2.exploredCondition).toBe('SC21')
    })

    it('should mark explored hexes with new player ID (1)', () => {
      const hexes = restoreLegacyHexGrid(mockSnapshot, newBaseHex, abandonedCampCondition)

      const hex0_2 = hexes['0,2']
      expect(hex0_2.exploredBy).toEqual([1])
    })

    it('should create unexplored hexes for non-explored positions', () => {
      const hexes = restoreLegacyHexGrid(mockSnapshot, newBaseHex, abandonedCampCondition)

      const hex0_0 = hexes['0,0']
      expect(hex0_0.explored).toBe(false)
      expect(hex0_0.location).toBe(0)
      expect(hex0_0.condition).toBe(0)
      expect(hex0_0.exploredBy).toEqual([])
    })

    it('should preserve hex state for special locations', () => {
      const hexes = restoreLegacyHexGrid(mockSnapshot, newBaseHex, abandonedCampCondition)

      const hex2_2 = hexes['2,2']
      expect(hex2_2.state).toBeDefined()
      expect(hex2_2.state?.portalDestinations).toEqual({
        tomb: '3,2',
        surface: '0,1'
      })
    })

    it('should determine hex type from row position', () => {
      const hexes = restoreLegacyHexGrid(mockSnapshot, newBaseHex, abandonedCampCondition)

      // Surface hexes (rows 0-2 for 5x5 map with surfaceRows: 3)
      const hex0_0 = hexes['0,0']
      expect(hex0_0.type).toBe('surface')

      // Tomb hexes (rows 3-4)
      const hex3_2 = hexes['3,2']
      expect(hex3_2.type).toBe('tomb')
    })

    it('should handle empty exploredHexes array', () => {
      const emptySnapshot: CampaignSnapshot = {
        ...mockSnapshot,
        exploredHexes: []
      }

      const hexes = restoreLegacyHexGrid(emptySnapshot, newBaseHex, abandonedCampCondition)

      expect(Object.keys(hexes).length).toBe(25)

      // All hexes should be unexplored
      Object.values(hexes).forEach(hex => {
        expect(hex.explored).toBe(false)
      })
    })
  })

  describe('convertBaseToAbandonedCamp', () => {
    it('should convert old base hex to Abandoned Camp (SL25)', () => {
      const hexes = {
        '0,2': {
          id: '0,2',
          row: 0,
          col: 2,
          type: 'surface' as const,
          explored: true,
          location: 11,  // Old location
          condition: 16,  // Old condition
          exploredBy: [1],
          exploredLocation: 'SL11-16',
          exploredCondition: 'SC11-16'
        }
      }

      const oldBaseHex: HexPosition = { row: 0, col: 2 }
      const conditionRoll = 22

      convertBaseToAbandonedCamp(hexes, oldBaseHex, conditionRoll)

      expect(hexes['0,2'].location).toBe(25)  // SL25
      expect(hexes['0,2'].condition).toBe(22)
      expect(hexes['0,2'].exploredLocation).toBe('SL25')
      expect(hexes['0,2'].explored).toBe(true)
    })

    it('should roll D6 for Abandoned Camp supplies', () => {
      const hexes = {
        '0,2': {
          id: '0,2',
          row: 0,
          col: 2,
          type: 'surface' as const,
          explored: true,
          location: 11,
          condition: 16,
          exploredBy: [1]
        }
      }

      const oldBaseHex: HexPosition = { row: 0, col: 2 }
      const conditionRoll = 22

      // WHY: Spy on rollD6 to verify it's called
      const rollD6Spy = vi.spyOn(dice, 'rollD6').mockReturnValue(4)

      convertBaseToAbandonedCamp(hexes, oldBaseHex, conditionRoll)

      expect(rollD6Spy).toHaveBeenCalled()
      expect(hexes['0,2'].state?.supplyCount).toBe(4)  // Mocked roll

      rollD6Spy.mockRestore()
    })

    it('should handle non-existent hex gracefully', () => {
      const hexes = {
        '0,0': {
          id: '0,0',
          row: 0,
          col: 0,
          type: 'surface' as const,
          explored: false,
          location: 0,
          condition: 0,
          exploredBy: []
        }
      }

      const oldBaseHex: HexPosition = { row: 5, col: 5 }  // Doesn't exist
      const conditionRoll = 22

      expect(() => {
        convertBaseToAbandonedCamp(hexes, oldBaseHex, conditionRoll)
      }).not.toThrow()

      // Hex 0,0 should remain unchanged
      expect(hexes['0,0'].location).toBe(0)
    })

    it('should mark hex as explored', () => {
      const hexes = {
        '0,2': {
          id: '0,2',
          row: 0,
          col: 2,
          type: 'surface' as const,
          explored: false,  // Not explored yet
          location: 0,
          condition: 0,
          exploredBy: []
        }
      }

      const oldBaseHex: HexPosition = { row: 0, col: 2 }
      const conditionRoll = 22

      convertBaseToAbandonedCamp(hexes, oldBaseHex, conditionRoll)

      expect(hexes['0,2'].explored).toBe(true)
    })
  })
})
