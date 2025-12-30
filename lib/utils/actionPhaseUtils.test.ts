import { describe, it, expect } from 'vitest'
import { calculateActionPhaseOrder } from './actionPhaseUtils'
import { determinePriority } from './priority'
import type { Player } from '@/types/campaign'

// WHY: Test helper - create mock player with minimal required fields
function createMockPlayer(
  id: number,
  battleResult: Player['battleResult'],
  campaignPoints: number,
  supplyPoints: number
): Player {
  return {
    id,
    name: `Player${id}`,
    killTeamName: `Team${id}`,
    color: '#000000',
    supplyPoints,
    campaignPoints,
    position: { row: 0, col: 0 },
    bases: [],
    camps: [],
    exploredHexes: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    operativesKilled: 0,
    history: [],
    battleResult
  }
}

describe('calculateActionPhaseOrder', () => {
  describe('when players have different battle results', () => {
    it('should order winners before draws before losses', () => {
      const players = [
        createMockPlayer(0, 'LOSS', 5, 5),
        createMockPlayer(1, 'WIN', 5, 5),
        createMockPlayer(2, 'DRAW', 5, 5)
      ]

      const order = calculateActionPhaseOrder(players, determinePriority)

      // Winners first, then Draws, then Losses
      expect(order).toEqual([1, 2, 0])
    })

    it('should tiebreak by priority within each group', () => {
      const players = [
        createMockPlayer(0, 'WIN', 10, 3),  // Priority: high CP/SP
        createMockPlayer(1, 'WIN', 8, 5),   // Priority: lower CP (goes first)
        createMockPlayer(2, 'WIN', 10, 2),  // Priority: high CP, lower SP (goes second)
        createMockPlayer(3, 'DRAW', 6, 4),  // Draws group
        createMockPlayer(4, 'DRAW', 5, 5)   // Lower CP (goes first in draws)
      ]

      const order = calculateActionPhaseOrder(players, determinePriority)

      // Winners: lowest CP first (8 < 10), then SP tiebreak (2 < 3)
      // Draws: lowest CP first (5 < 6)
      expect(order[0]).toBe(1)  // Winner with CP:8
      expect(order[1]).toBe(2)  // Winner with CP:10, SP:2
      expect(order[2]).toBe(0)  // Winner with CP:10, SP:3
      expect(order[3]).toBe(4)  // Draw with CP:5
      expect(order[4]).toBe(3)  // Draw with CP:6
    })
  })

  describe('when handling BYE and null results', () => {
    it('should group BYE with draws', () => {
      const players = [
        createMockPlayer(0, 'WIN', 5, 5),
        createMockPlayer(1, 'BYE', 5, 5),
        createMockPlayer(2, 'DRAW', 5, 5),
        createMockPlayer(3, 'LOSS', 5, 5)
      ]

      const order = calculateActionPhaseOrder(players, determinePriority)

      // Winners first, then BYE+DRAW, then Losses
      expect(order[0]).toBe(0)  // WIN
      expect(order.slice(1, 3)).toContain(1)  // BYE in draws group
      expect(order.slice(1, 3)).toContain(2)  // DRAW in draws group
      expect(order[3]).toBe(3)  // LOSS
    })

    it('should group null battleResult with draws', () => {
      const players = [
        createMockPlayer(0, 'LOSS', 5, 5),
        createMockPlayer(1, null, 5, 5),
        createMockPlayer(2, 'DRAW', 5, 5)
      ]

      const order = calculateActionPhaseOrder(players, determinePriority)

      // Null (no battle) grouped with Draws, Losses last
      expect(order.slice(0, 2)).toContain(1)  // null in draws group
      expect(order.slice(0, 2)).toContain(2)  // DRAW in draws group
      expect(order[2]).toBe(0)  // LOSS
    })
  })

  describe('edge cases', () => {
    it('should handle all players with same result', () => {
      const players = [
        createMockPlayer(0, 'WIN', 10, 5),
        createMockPlayer(1, 'WIN', 8, 3),
        createMockPlayer(2, 'WIN', 8, 5)
      ]

      const order = calculateActionPhaseOrder(players, determinePriority)

      // All winners, sorted by priority: CP:8,SP:3 < CP:8,SP:5 < CP:10,SP:5
      expect(order[0]).toBe(1)  // CP:8, SP:3 (lowest)
      expect(order[1]).toBe(2)  // CP:8, SP:5
      expect(order[2]).toBe(0)  // CP:10, SP:5 (highest)
    })

    it('should handle single player', () => {
      const players = [
        createMockPlayer(0, 'WIN', 5, 5)
      ]

      const order = calculateActionPhaseOrder(players, determinePriority)

      expect(order).toEqual([0])
    })

    it('should handle tied priority using player index (stable sort)', () => {
      const players = [
        createMockPlayer(0, 'WIN', 5, 5),
        createMockPlayer(1, 'WIN', 5, 5),
        createMockPlayer(2, 'WIN', 5, 5)
      ]

      const order = calculateActionPhaseOrder(players, determinePriority)

      // With identical CP and SP, should maintain stable order by index
      expect(order).toEqual([0, 1, 2])
    })

    it('should handle empty groups gracefully', () => {
      const players = [
        createMockPlayer(0, 'WIN', 5, 5),
        createMockPlayer(1, 'WIN', 3, 3)
        // No draws, no losses
      ]

      const order = calculateActionPhaseOrder(players, determinePriority)

      // Only winners group populated
      expect(order.length).toBe(2)
      expect(order[0]).toBe(1)  // Lower CP
      expect(order[1]).toBe(0)
    })

    it('should preserve priority order from determinePriority', () => {
      const players = [
        createMockPlayer(0, 'DRAW', 10, 3),
        createMockPlayer(1, 'DRAW', 5, 8),
        createMockPlayer(2, 'DRAW', 10, 1),
        createMockPlayer(3, 'DRAW', 5, 5)
      ]

      // determinePriority sorts by CP (ascending) then SP (ascending)
      const order = calculateActionPhaseOrder(players, determinePriority)

      // All draws, priority order: CP:5,SP:5 < CP:5,SP:8 < CP:10,SP:1 < CP:10,SP:3
      expect(order[0]).toBe(3)  // CP:5, SP:5
      expect(order[1]).toBe(1)  // CP:5, SP:8
      expect(order[2]).toBe(2)  // CP:10, SP:1
      expect(order[3]).toBe(0)  // CP:10, SP:3
    })
  })
})
