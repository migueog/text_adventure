import { describe, it, expect, vi } from 'vitest'
import {
  determineActiveCondition,
  getKillzoneRecommendation,
  formatConditionExport,
  generatePrintableCondition,
  copyConditionToClipboard,
  KILLZONE_RECOMMENDATIONS
} from './battleCondition'
import type { Player, Hex, Condition } from '@/types/campaign'

// Helper to create test players with specific positions and priority
function createTestPlayer(
  id: number,
  row: number,
  col: number,
  priority: number,
  name = `Player ${id + 1}`
): Player {
  return {
    id,
    name,
    killTeamName: `Kill Team ${id + 1}`,
    color: '#ffffff',
    position: { row, col },
    supplyPoints: 5,
    campaignPoints: 5,
    exploredHexes: 0,
    operativesKilled: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    bases: [{ row: 0, col: 0 }],
    camps: [],
    history: [],
    priority,
    battleResult: null,
    searchedHexes: [],
    battleHistory: []
  }
}

// Helper to create test hexes
function createTestHex(
  row: number,
  col: number,
  type: 'surface' | 'tomb',
  conditionIndex: number
): Hex {
  return {
    id: `${row},${col}`,
    row,
    col,
    type,
    location: 11,
    condition: conditionIndex,
    explored: true,
    exploredBy: []
  }
}

// Sample conditions for testing
const SAMPLE_SURFACE_CONDITION: Condition = {
  name: 'Blizzard',
  description: 'Harsh winds reduce visibility.',
  effect: 'combat',
  modifier: -1
}

const SAMPLE_TOMB_CONDITION: Condition = {
  name: 'Darkness',
  description: 'Lights have failed.',
  effect: 'combat',
  modifier: -1
}

describe('Battle Condition Utilities', () => {
  describe('determineActiveCondition', () => {
    describe('when both players in same hex', () => {
      it('should use that hex\'s condition', () => {
        const player1 = createTestPlayer(0, 2, 3, 1)
        const player2 = createTestPlayer(1, 2, 3, 2) // Same hex as player1
        const hexes: Record<string, Hex> = {
          '2,3': createTestHex(2, 3, 'surface', 13) // Blizzard condition
        }

        const result = determineActiveCondition(player1, player2, hexes)

        expect(result.sourceHex?.id).toBe('2,3')
        expect(result.reason).toBe('same-hex')
      })

      it('should return reason "same-hex"', () => {
        const player1 = createTestPlayer(0, 1, 1, 1)
        const player2 = createTestPlayer(1, 1, 1, 2)
        const hexes: Record<string, Hex> = {
          '1,1': createTestHex(1, 1, 'tomb', 16)
        }

        const result = determineActiveCondition(player1, player2, hexes)

        expect(result.reason).toBe('same-hex')
      })

      it('should set conditionProviderPlayerId to null', () => {
        const player1 = createTestPlayer(0, 2, 2, 1)
        const player2 = createTestPlayer(1, 2, 2, 2)
        const hexes: Record<string, Hex> = {
          '2,2': createTestHex(2, 2, 'surface', 11)
        }

        const result = determineActiveCondition(player1, player2, hexes)

        expect(result.conditionProviderPlayerId).toBeNull()
        expect(result.conditionProviderName).toBeNull()
      })
    })

    describe('when players in different hexes', () => {
      it('should use condition from player without initiative (higher priority number)', () => {
        // Player1 has priority 1 (has initiative)
        // Player2 has priority 2 (without initiative) -> use their hex
        const player1 = createTestPlayer(0, 1, 1, 1, 'Player 1')
        const player2 = createTestPlayer(1, 2, 2, 2, 'Player 2')
        const hexes: Record<string, Hex> = {
          '1,1': createTestHex(1, 1, 'surface', 11), // Clear
          '2,2': createTestHex(2, 2, 'tomb', 16) // Darkness
        }

        const result = determineActiveCondition(player1, player2, hexes)

        // Should use player2's hex (priority 2 = without initiative)
        expect(result.sourceHex?.id).toBe('2,2')
        expect(result.conditionProviderPlayerId).toBe(1)
        expect(result.conditionProviderName).toBe('Player 2')
      })

      it('should identify player with higher priority number as without initiative', () => {
        // Player1 has priority 3 (without initiative)
        // Player2 has priority 1 (has initiative)
        const player1 = createTestPlayer(0, 0, 0, 3, 'Alice')
        const player2 = createTestPlayer(1, 3, 3, 1, 'Bob')
        const hexes: Record<string, Hex> = {
          '0,0': createTestHex(0, 0, 'surface', 13), // Blizzard
          '3,3': createTestHex(3, 3, 'tomb', 11) // Quiet
        }

        const result = determineActiveCondition(player1, player2, hexes)

        // Player1 has higher priority number (3) = without initiative
        expect(result.sourceHex?.id).toBe('0,0')
        expect(result.conditionProviderPlayerId).toBe(0)
        expect(result.conditionProviderName).toBe('Alice')
      })

      it('should return reason "no-initiative"', () => {
        const player1 = createTestPlayer(0, 1, 0, 1)
        const player2 = createTestPlayer(1, 2, 0, 2)
        const hexes: Record<string, Hex> = {
          '1,0': createTestHex(1, 0, 'surface', 11),
          '2,0': createTestHex(2, 0, 'surface', 12)
        }

        const result = determineActiveCondition(player1, player2, hexes)

        expect(result.reason).toBe('no-initiative')
      })

      it('should correctly identify hex type in result', () => {
        const player1 = createTestPlayer(0, 1, 1, 1)
        const player2 = createTestPlayer(1, 3, 3, 2)
        const hexes: Record<string, Hex> = {
          '1,1': createTestHex(1, 1, 'surface', 13),
          '3,3': createTestHex(3, 3, 'tomb', 16)
        }

        const result = determineActiveCondition(player1, player2, hexes)

        // Player2 has higher priority (2), so use their tomb hex
        expect(result.sourceHex?.type).toBe('tomb')
      })
    })

    describe('when opponent is null (BYE or external)', () => {
      it('should return null condition with reason "no-opponent"', () => {
        const player1 = createTestPlayer(0, 2, 2, 1)
        const hexes: Record<string, Hex> = {
          '2,2': createTestHex(2, 2, 'surface', 13)
        }

        const result = determineActiveCondition(player1, null, hexes)

        expect(result.condition).toBeNull()
        expect(result.sourceHex).toBeNull()
        expect(result.reason).toBe('no-opponent')
        expect(result.conditionProviderPlayerId).toBeNull()
      })
    })

    describe('edge cases', () => {
      it('should handle tied priorities by using first player in order', () => {
        // Both players have same priority (tie scenario)
        const player1 = createTestPlayer(0, 1, 1, 1, 'First')
        const player2 = createTestPlayer(1, 2, 2, 1, 'Second') // Same priority
        const hexes: Record<string, Hex> = {
          '1,1': createTestHex(1, 1, 'surface', 11),
          '2,2': createTestHex(2, 2, 'surface', 13)
        }

        const result = determineActiveCondition(player1, player2, hexes)

        // When tied, use player2's hex (appears second in argument order)
        // This is consistent behavior - the non-primary player's hex is used
        expect(result.sourceHex?.id).toBe('2,2')
        expect(result.conditionProviderPlayerId).toBe(1)
      })

      it('should handle missing hex data gracefully', () => {
        const player1 = createTestPlayer(0, 1, 1, 1)
        const player2 = createTestPlayer(1, 2, 2, 2)
        const hexes: Record<string, Hex> = {
          '1,1': createTestHex(1, 1, 'surface', 11)
          // Missing '2,2' hex
        }

        const result = determineActiveCondition(player1, player2, hexes)

        // Should handle gracefully - return null condition when hex not found
        expect(result.condition).toBeNull()
        expect(result.reason).toBe('no-initiative')
      })

      it('should handle unexplored hexes (condition = 0)', () => {
        const player1 = createTestPlayer(0, 1, 1, 1)
        const player2 = createTestPlayer(1, 2, 2, 2)
        const hexes: Record<string, Hex> = {
          '1,1': createTestHex(1, 1, 'surface', 11),
          '2,2': { ...createTestHex(2, 2, 'surface', 0), explored: false }
        }

        const result = determineActiveCondition(player1, player2, hexes)

        // Should return null condition for unexplored hex
        expect(result.condition).toBeNull()
        expect(result.sourceHex?.id).toBe('2,2')
      })

      it('should handle undefined priority by treating as Infinity', () => {
        const player1 = createTestPlayer(0, 1, 1, 1)
        const player2: Player = {
          ...createTestPlayer(1, 2, 2, 999),
          priority: undefined
        }
        const hexes: Record<string, Hex> = {
          '1,1': createTestHex(1, 1, 'surface', 11),
          '2,2': createTestHex(2, 2, 'surface', 13)
        }

        const result = determineActiveCondition(player1, player2, hexes)

        // Undefined priority treated as Infinity (highest = without initiative)
        expect(result.sourceHex?.id).toBe('2,2')
        expect(result.conditionProviderPlayerId).toBe(1)
      })
    })
  })

  describe('getKillzoneRecommendation', () => {
    it('should recommend close quarters for tomb hexes', () => {
      const result = getKillzoneRecommendation('tomb')

      expect(result.category).toBe('close-quarters')
      expect(result.name).toBe('Close Quarters Killzone')
      expect(result.examples).toContain('Killzone: Tomb World')
      expect(result.examples).toContain('Gallowdark')
    })

    it('should recommend any killzone for surface hexes', () => {
      const result = getKillzoneRecommendation('surface')

      expect(result.category).toBe('any')
      expect(result.name).toBe('Any Killzone')
      expect(result.examples).toContain('Killzone: Volkus')
    })

    it('should include reason for recommendation', () => {
      const tombResult = getKillzoneRecommendation('tomb')
      const surfaceResult = getKillzoneRecommendation('surface')

      expect(tombResult.reason).toContain('close combat')
      expect(surfaceResult.reason).toContain('open')
    })
  })

  describe('formatConditionExport', () => {
    it('should include all required fields', () => {
      const activeCondition = {
        condition: SAMPLE_SURFACE_CONDITION,
        sourceHex: { id: '2,3', row: 2, col: 3, type: 'surface' as const },
        reason: 'same-hex' as const,
        conditionProviderPlayerId: null,
        conditionProviderName: null
      }
      const killzone = KILLZONE_RECOMMENDATIONS.surface

      const result = formatConditionExport(activeCondition, killzone, 3)

      expect(result.conditionName).toBe('Blizzard')
      expect(result.conditionDescription).toBe('Harsh winds reduce visibility.')
      expect(result.hexType).toBe('surface')
      expect(result.hexId).toBe('2,3')
      expect(result.round).toBe(3)
    })

    it('should include timestamp', () => {
      const activeCondition = {
        condition: SAMPLE_TOMB_CONDITION,
        sourceHex: { id: '3,3', row: 3, col: 3, type: 'tomb' as const },
        reason: 'no-initiative' as const,
        conditionProviderPlayerId: 1,
        conditionProviderName: 'Player 2'
      }
      const killzone = KILLZONE_RECOMMENDATIONS.tomb

      const result = formatConditionExport(activeCondition, killzone, 5)

      expect(result.generatedAt).toBeDefined()
      expect(typeof result.generatedAt).toBe('string')
    })

    it('should include source reason', () => {
      const activeCondition = {
        condition: SAMPLE_SURFACE_CONDITION,
        sourceHex: { id: '1,1', row: 1, col: 1, type: 'surface' as const },
        reason: 'no-initiative' as const,
        conditionProviderPlayerId: 2,
        conditionProviderName: 'Bob'
      }
      const killzone = KILLZONE_RECOMMENDATIONS.surface

      const result = formatConditionExport(activeCondition, killzone, 1)

      expect(result.sourceReason).toContain('Bob')
    })

    it('should handle null condition gracefully', () => {
      const activeCondition = {
        condition: null,
        sourceHex: null,
        reason: 'no-opponent' as const,
        conditionProviderPlayerId: null,
        conditionProviderName: null
      }

      const result = formatConditionExport(activeCondition, null, 1)

      expect(result.conditionName).toBe('No Condition')
      expect(result.conditionDescription).toBe('No condition applies to this battle.')
    })
  })

  describe('generatePrintableCondition', () => {
    it('should produce formatted text output', () => {
      const exportData = {
        battleInfo: 'Round 3',
        conditionName: 'Blizzard',
        conditionDescription: 'Harsh winds reduce visibility.',
        conditionEffect: 'combat',
        hexType: 'surface' as const,
        hexId: '2,3',
        sourceReason: 'Both players in same hex',
        killzoneRecommendation: 'Any Killzone',
        killzoneExamples: ['Volkus', 'Chalnath'],
        generatedAt: '2024-01-15 14:30',
        round: 3
      }

      const result = generatePrintableCondition(exportData)

      expect(result).toContain('KILL TEAM BATTLE CONDITIONS')
      expect(result).toContain('Blizzard')
      expect(result).toContain('Surface')
      expect(result).toContain('Volkus')
    })

    it('should include header with hex info', () => {
      const exportData = {
        battleInfo: 'Round 2',
        conditionName: 'Darkness',
        conditionDescription: 'Lights have failed.',
        conditionEffect: 'combat',
        hexType: 'tomb' as const,
        hexId: '4,2',
        sourceReason: 'Player 2\'s hex (without initiative)',
        killzoneRecommendation: 'Close Quarters Killzone',
        killzoneExamples: ['Tomb World', 'Gallowdark'],
        generatedAt: '2024-01-15 15:00',
        round: 2
      }

      const result = generatePrintableCondition(exportData)

      expect(result).toContain('Tomb')
      expect(result).toContain('4,2')
      expect(result).toContain('Darkness')
    })
  })

  describe('copyConditionToClipboard', () => {
    it('should call navigator.clipboard.writeText', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      })

      await copyConditionToClipboard('Test condition text')

      expect(mockWriteText).toHaveBeenCalledWith('Test condition text')
    })

    it('should throw error if clipboard not available', async () => {
      Object.assign(navigator, { clipboard: undefined })

      await expect(copyConditionToClipboard('Test')).rejects.toThrow()
    })
  })

  describe('KILLZONE_RECOMMENDATIONS constant', () => {
    it('should have recommendations for both hex types', () => {
      expect(KILLZONE_RECOMMENDATIONS.tomb).toBeDefined()
      expect(KILLZONE_RECOMMENDATIONS.surface).toBeDefined()
    })

    it('should have at least 2 examples for each type', () => {
      expect(KILLZONE_RECOMMENDATIONS.tomb.examples.length).toBeGreaterThanOrEqual(2)
      expect(KILLZONE_RECOMMENDATIONS.surface.examples.length).toBeGreaterThanOrEqual(2)
    })
  })
})
