import { describe, it, expect } from 'vitest'
import { resolveSearchRule, canPerformSearch } from './search'
import type { Player, Hex, SearchRule } from '@/types/campaign'
import { SURFACE_LOCATIONS, TOMB_LOCATIONS } from '@/lib/data/campaignData'

// Helper to create test player
function createTestPlayer(
  id: number,
  sp: number,
  searchedHexes: string[] = []
): Player {
  return {
    id,
    name: `Player ${id + 1}`,
    killTeamName: `Kill Team ${id + 1}`,
    color: '#ffffff',
    position: { row: 0, col: 0 },
    supplyPoints: sp,
    campaignPoints: 0,
    exploredHexes: 0,
    operativesKilled: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    bases: [{ row: 0, col: 0 }],
    camps: [],
    history: [],
    priority: 0,
    battleResult: null,
    searchedHexes
  }
}

// Helper to create test hex
function createTestHex(type: Hex['type'], location: number): Hex {
  return {
    id: '0,0',
    row: 0,
    col: 0,
    type,
    explored: true,
    location,
    condition: 0,
    exploredBy: []
  }
}

describe('resolveSearchRule', () => {
  describe('SP search rules', () => {
    it('should resolve d3 SP search rule', () => {
      const rule: SearchRule = { type: 'sp', amount: 'd3' }
      const result = resolveSearchRule(rule)

      expect(result).not.toBeNull()
      expect(result?.success).toBe(true)
      expect(result?.spGained).toBeGreaterThanOrEqual(1)
      expect(result?.spGained).toBeLessThanOrEqual(3)
      expect(result?.cpGained).toBe(0)
      expect(result?.roll).toBeDefined()
      expect(result?.description).toContain('SP')
    })

    it('should resolve d3+1 SP search rule', () => {
      const rule: SearchRule = { type: 'sp', amount: 'd3+1' }
      const result = resolveSearchRule(rule)

      expect(result).not.toBeNull()
      expect(result?.success).toBe(true)
      expect(result?.spGained).toBeGreaterThanOrEqual(2)
      expect(result?.spGained).toBeLessThanOrEqual(4)
      expect(result?.cpGained).toBe(0)
      expect(result?.roll).toBeDefined()
      expect(result?.description).toContain('SP')
    })

    it('should resolve fixed SP search rule', () => {
      const rule: SearchRule = { type: 'sp', amount: 2 }
      const result = resolveSearchRule(rule)

      expect(result).not.toBeNull()
      expect(result?.success).toBe(true)
      expect(result?.spGained).toBe(2)
      expect(result?.cpGained).toBe(0)
      expect(result?.roll).toBeUndefined()
      expect(result?.description).toBe('Found 2 SP')
    })

    it('should return SP between 1-3 for d3 rolls', () => {
      const rule: SearchRule = { type: 'sp', amount: 'd3' }

      // Run multiple times to test randomness
      for (let i = 0; i < 20; i++) {
        const result = resolveSearchRule(rule)
        expect(result?.spGained).toBeGreaterThanOrEqual(1)
        expect(result?.spGained).toBeLessThanOrEqual(3)
      }
    })

    it('should return SP between 2-4 for d3+1 rolls', () => {
      const rule: SearchRule = { type: 'sp', amount: 'd3+1' }

      // Run multiple times to test randomness
      for (let i = 0; i < 20; i++) {
        const result = resolveSearchRule(rule)
        expect(result?.spGained).toBeGreaterThanOrEqual(2)
        expect(result?.spGained).toBeLessThanOrEqual(4)
      }
    })
  })

  describe('CP search rules', () => {
    it('should resolve fixed CP search rule', () => {
      const rule: SearchRule = { type: 'cp', amount: 1 }
      const result = resolveSearchRule(rule)

      expect(result).not.toBeNull()
      expect(result?.success).toBe(true)
      expect(result?.spGained).toBe(0)
      expect(result?.cpGained).toBe(1)
      expect(result?.roll).toBeUndefined()
      expect(result?.description).toBe('Found 1 CP')
    })

    it('should return exact CP amount', () => {
      const rule: SearchRule = { type: 'cp', amount: 3 }
      const result = resolveSearchRule(rule)

      expect(result?.cpGained).toBe(3)
      expect(result?.description).toBe('Found 3 CP')
    })
  })

  describe('combined search rules', () => {
    it('should resolve both SP and CP rewards', () => {
      const rule: SearchRule = { type: 'both', sp: 2, cp: 3 }
      const result = resolveSearchRule(rule)

      expect(result).not.toBeNull()
      expect(result?.success).toBe(true)
      expect(result?.spGained).toBe(2)
      expect(result?.cpGained).toBe(3)
      expect(result?.description).toContain('SP')
      expect(result?.description).toContain('CP')
    })

    it('should handle d3 SP with fixed CP', () => {
      const rule: SearchRule = { type: 'both', sp: 'd3', cp: 2 }
      const result = resolveSearchRule(rule)

      expect(result).not.toBeNull()
      expect(result?.spGained).toBeGreaterThanOrEqual(1)
      expect(result?.spGained).toBeLessThanOrEqual(3)
      expect(result?.cpGained).toBe(2)
      expect(result?.roll).toBeDefined()
    })
  })

  describe('null search rule', () => {
    it('should return null when searchRule is null', () => {
      const result = resolveSearchRule(null)
      expect(result).toBeNull()
    })

    it('should return null when searchRule is undefined', () => {
      const result = resolveSearchRule(undefined)
      expect(result).toBeNull()
    })
  })
})

describe('canPerformSearch', () => {
  it('should allow search when player has >= 1 SP and hex not searched', () => {
    const player = createTestPlayer(0, 3, [])
    const hex = createTestHex('surface', 14)  // Crashed Vessel has search rule

    const result = canPerformSearch(player, hex, '0,0')

    expect(result.canSearch).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('should prevent search when player has 0 SP', () => {
    const player = createTestPlayer(0, 0, [])
    const hex = createTestHex('surface', 14)

    const result = canPerformSearch(player, hex, '0,0')

    expect(result.canSearch).toBe(false)
    expect(result.reason).toBe('Insufficient SP (need 1)')
  })

  it('should prevent search when hex already searched by player', () => {
    const player = createTestPlayer(0, 5, ['0,0'])  // Already searched this hex
    const hex = createTestHex('surface', 14)

    const result = canPerformSearch(player, hex, '0,0')

    expect(result.canSearch).toBe(false)
    expect(result.reason).toBe('Already searched this hex')
  })

  it('should prevent search when hex has null search rule', () => {
    const player = createTestPlayer(0, 5, [])
    const hex = createTestHex('surface', 11)  // Landing Site has null searchRule

    const result = canPerformSearch(player, hex, '0,0')

    expect(result.canSearch).toBe(false)
    expect(result.reason).toBe('Nothing to search here')
  })
})
