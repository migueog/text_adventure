import { describe, it, expect } from 'vitest'
import { determinePriority, needsRollOff } from './priority'
import type { Player } from '@/types/campaign'

// Helper to create test players
function createTestPlayer(
  id: number,
  cp: number,
  sp: number,
  name = `Player ${id + 1}`
): Player {
  return {
    id,
    name,
    killTeamName: `Kill Team ${id + 1}`,
    color: '#ffffff',
    position: { row: 0, col: 0 },
    supplyPoints: sp,
    campaignPoints: cp,
    exploredHexes: 0,
    operativesKilled: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    bases: [{ row: 0, col: 0 }],
    camps: [],
    history: [],
    priority: 0
  }
}

describe('determinePriority', () => {
  describe('when players have different CP', () => {
    it('should sort by lowest CP first', () => {
      const players = [
        createTestPlayer(0, 5, 5),
        createTestPlayer(1, 2, 5),
        createTestPlayer(2, 8, 5)
      ]

      const result = determinePriority(players)

      expect(result[0]?.id).toBe(1) // Player 2 has CP=2 (lowest)
      expect(result[1]?.id).toBe(0) // Player 1 has CP=5
      expect(result[2]?.id).toBe(2) // Player 3 has CP=8 (highest)
    })

    it('should assign priority values 1, 2, 3', () => {
      const players = [
        createTestPlayer(0, 10, 5),
        createTestPlayer(1, 5, 5),
        createTestPlayer(2, 1, 5)
      ]

      const result = determinePriority(players)

      expect(result[0]?.priority).toBe(1) // Lowest CP = priority 1
      expect(result[1]?.priority).toBe(2)
      expect(result[2]?.priority).toBe(3) // Highest CP = priority 3
    })
  })

  describe('when players have same CP', () => {
    it('should sort by lowest SP as tiebreaker', () => {
      const players = [
        createTestPlayer(0, 5, 8),
        createTestPlayer(1, 5, 3),
        createTestPlayer(2, 5, 10)
      ]

      const result = determinePriority(players)

      expect(result[0]?.id).toBe(1) // SP=3 (lowest)
      expect(result[1]?.id).toBe(0) // SP=8
      expect(result[2]?.id).toBe(2) // SP=10 (highest)
    })

    it('should use CP first, then SP', () => {
      const players = [
        createTestPlayer(0, 10, 2), // High CP, low SP
        createTestPlayer(1, 5, 10), // Medium CP, high SP
        createTestPlayer(2, 5, 3)   // Medium CP, low SP
      ]

      const result = determinePriority(players)

      expect(result[0]?.id).toBe(2) // CP=5, SP=3
      expect(result[1]?.id).toBe(1) // CP=5, SP=10
      expect(result[2]?.id).toBe(0) // CP=10, SP=2
    })
  })

  describe('when players have same CP and SP', () => {
    it('should maintain original order when tied', () => {
      const players = [
        createTestPlayer(0, 5, 5),
        createTestPlayer(1, 5, 5),
        createTestPlayer(2, 5, 5)
      ]

      const result = determinePriority(players)

      // All players have same CP and SP, so they keep original order
      expect(result[0]?.id).toBe(0)
      expect(result[1]?.id).toBe(1)
      expect(result[2]?.id).toBe(2)
    })

    it('should assign same priority to tied players', () => {
      const players = [
        createTestPlayer(0, 5, 5),
        createTestPlayer(1, 5, 5)
      ]

      const result = determinePriority(players)

      // Both tied at priority 1
      expect(result[0]?.priority).toBe(1)
      expect(result[1]?.priority).toBe(1)
    })
  })

  describe('with mixed scenarios', () => {
    it('should handle complex priority scenarios', () => {
      const players = [
        createTestPlayer(0, 10, 5), // Highest CP
        createTestPlayer(1, 5, 3),  // Medium CP, low SP
        createTestPlayer(2, 5, 3),  // Medium CP, low SP (tied with P2)
        createTestPlayer(3, 5, 8),  // Medium CP, high SP
        createTestPlayer(4, 2, 10)  // Lowest CP
      ]

      const result = determinePriority(players)

      expect(result[0]?.id).toBe(4) // CP=2 (lowest)
      expect(result[1]?.id).toBe(1) // CP=5, SP=3
      expect(result[2]?.id).toBe(2) // CP=5, SP=3 (tied)
      expect(result[3]?.id).toBe(3) // CP=5, SP=8
      expect(result[4]?.id).toBe(0) // CP=10 (highest)

      expect(result[0]?.priority).toBe(1)
      expect(result[1]?.priority).toBe(2)
      expect(result[2]?.priority).toBe(2) // Tied priority
      expect(result[3]?.priority).toBe(4)
      expect(result[4]?.priority).toBe(5)
    })
  })

  describe('with single player', () => {
    it('should return single player with priority 1', () => {
      const players = [createTestPlayer(0, 5, 5)]

      const result = determinePriority(players)

      expect(result).toHaveLength(1)
      expect(result[0]?.priority).toBe(1)
    })
  })

  describe('with empty array', () => {
    it('should return empty array', () => {
      const players: Player[] = []

      const result = determinePriority(players)

      expect(result).toEqual([])
    })
  })
})

describe('needsRollOff', () => {
  it('should return true when multiple players have same CP and SP', () => {
    const players = [
      createTestPlayer(0, 5, 3),
      createTestPlayer(1, 5, 3)
    ]

    const result = needsRollOff(players)

    expect(result).toBe(true)
  })

  it('should return false when players have different CP', () => {
    const players = [
      createTestPlayer(0, 5, 3),
      createTestPlayer(1, 6, 3)
    ]

    const result = needsRollOff(players)

    expect(result).toBe(false)
  })

  it('should return false when players have same CP but different SP', () => {
    const players = [
      createTestPlayer(0, 5, 3),
      createTestPlayer(1, 5, 4)
    ]

    const result = needsRollOff(players)

    expect(result).toBe(false)
  })

  it('should return true when all 3+ players are tied', () => {
    const players = [
      createTestPlayer(0, 5, 3),
      createTestPlayer(1, 5, 3),
      createTestPlayer(2, 5, 3)
    ]

    const result = needsRollOff(players)

    expect(result).toBe(true)
  })

  it('should return false with single player', () => {
    const players = [createTestPlayer(0, 5, 3)]

    const result = needsRollOff(players)

    expect(result).toBe(false)
  })

  it('should return false with empty array', () => {
    const players: Player[] = []

    const result = needsRollOff(players)

    expect(result).toBe(false)
  })

  it('should check only top priority players for roll-off', () => {
    const players = [
      createTestPlayer(0, 2, 3), // Lowest CP
      createTestPlayer(1, 2, 3), // Lowest CP (tied)
      createTestPlayer(2, 5, 3)  // Higher CP (not in tie)
    ]

    const result = needsRollOff(players)

    // Only players 0 and 1 are tied at lowest CP/SP
    expect(result).toBe(true)
  })
})
