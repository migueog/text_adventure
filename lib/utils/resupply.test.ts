import { describe, it, expect } from 'vitest'
import { calculateResupply } from './resupply'
import type { Player, Hex, HexPosition } from '@/types/campaign'

// Helper to create test player
function createTestPlayer(
  id: number,
  position: HexPosition,
  bases: HexPosition[] = [],
  camps: HexPosition[] = []
): Player {
  return {
    id,
    name: `Player ${id + 1}`,
    killTeamName: `Kill Team ${id + 1}`,
    color: '#ffffff',
    position,
    supplyPoints: 5,
    campaignPoints: 0,
    exploredHexes: 0,
    operativesKilled: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    bases,
    camps,
    history: [],
    priority: 0,
    battleResult: null
  }
}

// Helper to create test hex
function createTestHex(id: string, type: Hex['type'], explored: boolean = false): Hex {
  return {
    id,
    row: 0,
    col: 0,
    type,
    explored,
    location: 0,
    condition: 0,
    exploredBy: []
  }
}

describe('calculateResupply', () => {
  describe('when at own base', () => {
    it('should return 10 SP gain for base resupply', () => {
      const basePosition = { row: 0, col: 0 }
      const player = createTestPlayer(0, basePosition, [basePosition], [])
      const hex = createTestHex('0,0', 'surface', true)

      const result = calculateResupply(player, hex)

      expect(result.amount).toBe(10)
      expect(result.type).toBe('base')
      expect(result.guaranteed).toBe(true)
      expect(result.roll).toBeUndefined()
    })

    it('should return base type even if player has camps elsewhere', () => {
      const basePosition = { row: 0, col: 0 }
      const campPosition = { row: 1, col: 1 }
      const player = createTestPlayer(0, basePosition, [basePosition], [campPosition])
      const hex = createTestHex('0,0', 'surface', true)

      const result = calculateResupply(player, hex)

      expect(result.type).toBe('base')
      expect(result.amount).toBe(10)
    })
  })

  describe('when at own camp', () => {
    it('should roll D3+3 for camp resupply', () => {
      const campPosition = { row: 1, col: 1 }
      const player = createTestPlayer(0, campPosition, [{ row: 0, col: 0 }], [campPosition])
      const hex = createTestHex('1,1', 'surface', true)

      const result = calculateResupply(player, hex)

      expect(result.type).toBe('camp')
      expect(result.guaranteed).toBe(false)
      expect(result.roll).toBeDefined()
      expect(result.amount).toBeGreaterThanOrEqual(4) // D3+3 minimum
      expect(result.amount).toBeLessThanOrEqual(6)    // D3+3 maximum
    })

    it('should include roll information in result', () => {
      const campPosition = { row: 1, col: 1 }
      const player = createTestPlayer(0, campPosition, [{ row: 0, col: 0 }], [campPosition])
      const hex = createTestHex('1,1', 'surface', true)

      const result = calculateResupply(player, hex)

      expect(result.roll).toBeDefined()
      if (result.roll) {
        expect(result.roll).toBeGreaterThanOrEqual(1)
        expect(result.roll).toBeLessThanOrEqual(3)
        expect(result.amount).toBe(result.roll + 3)
      }
    })
  })

  describe('when at blocked hex', () => {
    it('should return 0 SP for blocked hex', () => {
      const position = { row: 2, col: 2 }
      const player = createTestPlayer(0, position, [{ row: 0, col: 0 }], [])
      const hex = createTestHex('2,2', 'blocked', true)

      const result = calculateResupply(player, hex)

      expect(result.amount).toBe(0)
      expect(result.type).toBe('blocked')
      expect(result.guaranteed).toBe(true)
      expect(result.roll).toBeUndefined()
    })

    it('should return blocked type even if hex is unexplored', () => {
      const position = { row: 2, col: 2 }
      const player = createTestPlayer(0, position, [{ row: 0, col: 0 }], [])
      const hex = createTestHex('2,2', 'blocked', false)

      const result = calculateResupply(player, hex)

      expect(result.type).toBe('blocked')
      expect(result.amount).toBe(0)
    })
  })

  describe('when at any other hex', () => {
    it('should return 1 SP for surface hex', () => {
      const position = { row: 3, col: 3 }
      const player = createTestPlayer(0, position, [{ row: 0, col: 0 }], [])
      const hex = createTestHex('3,3', 'surface', true)

      const result = calculateResupply(player, hex)

      expect(result.amount).toBe(1)
      expect(result.type).toBe('other')
      expect(result.guaranteed).toBe(true)
      expect(result.roll).toBeUndefined()
    })

    it('should return 1 SP for tomb hex', () => {
      const position = { row: 4, col: 4 }
      const player = createTestPlayer(0, position, [{ row: 0, col: 0 }], [])
      const hex = createTestHex('4,4', 'tomb', true)

      const result = calculateResupply(player, hex)

      expect(result.amount).toBe(1)
      expect(result.type).toBe('other')
      expect(result.guaranteed).toBe(true)
    })
  })

  describe('priority of location types', () => {
    it('should prioritize base over camp when both are at same location', () => {
      const position = { row: 0, col: 0 }
      // Player has both base and camp at same location (edge case)
      const player = createTestPlayer(0, position, [position], [position])
      const hex = createTestHex('0,0', 'surface', true)

      const result = calculateResupply(player, hex)

      // Base should take priority
      expect(result.type).toBe('base')
      expect(result.amount).toBe(10)
    })

    it('should prioritize blocked over camp or base', () => {
      const position = { row: 0, col: 0 }
      // Player has base at blocked hex (edge case)
      const player = createTestPlayer(0, position, [position], [])
      const hex = createTestHex('0,0', 'blocked', true)

      const result = calculateResupply(player, hex)

      // Blocked should take priority
      expect(result.type).toBe('blocked')
      expect(result.amount).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should handle player with no bases', () => {
      const position = { row: 0, col: 0 }
      const player = createTestPlayer(0, position, [], [])
      const hex = createTestHex('0,0', 'surface', true)

      const result = calculateResupply(player, hex)

      expect(result.type).toBe('other')
      expect(result.amount).toBe(1)
    })

    it('should handle player with multiple bases not at current position', () => {
      const position = { row: 3, col: 3 }
      const player = createTestPlayer(
        0,
        position,
        [{ row: 0, col: 0 }, { row: 1, col: 1 }],
        []
      )
      const hex = createTestHex('3,3', 'surface', true)

      const result = calculateResupply(player, hex)

      expect(result.type).toBe('other')
      expect(result.amount).toBe(1)
    })

    it('should handle player with multiple camps at different positions', () => {
      const position = { row: 2, col: 2 }
      const player = createTestPlayer(
        0,
        position,
        [{ row: 0, col: 0 }],
        [position, { row: 3, col: 3 }]
      )
      const hex = createTestHex('2,2', 'surface', true)

      const result = calculateResupply(player, hex)

      expect(result.type).toBe('camp')
    })
  })
})
