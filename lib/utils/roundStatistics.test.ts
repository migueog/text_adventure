import { describe, it, expect } from 'vitest'
import type { Event, Player } from '@/types/campaign'
import {
  calculateRoundStatistics,
  extractBattleStats,
  calculateSPChanges,
  calculateCPChanges,
  getMajorEvents
} from './roundStatistics'

/**
 * WHY: Test suite for round statistics calculation (Issue #31 - Phase 1)
 * Ensures accurate stat extraction from events and player history
 */

// WHY: Helper to create mock events
function createMockEvent(
  type: Event['type'],
  message: string,
  round: number,
  phase: string = 'Movement'
): Event {
  return {
    type,
    icon: '📝',
    message,
    round,
    phase,
    timestamp: new Date().toISOString()
  }
}

// WHY: Helper to create mock player
function createMockPlayer(
  id: number,
  name: string,
  battleHistory: Array<{ round: number; result: 'WIN' | 'LOSS' | 'DRAW' | 'BYE' }>,
  history: Array<{ round: number; spBefore: number; spAfter: number; cpBefore: number; cpAfter: number }>
): Player {
  return {
    id,
    name,
    killTeamName: 'Test Team',
    color: '#ff0000',
    position: { row: 0, col: 0 },
    supplyPoints: 5,
    campaignPoints: 0,
    exploredHexes: 0,
    operativesKilled: 0,
    bases: [],
    camps: [],
    movementOrder: 1,
    battleResult: null,
    searchedHexes: [],
    battleHistory: battleHistory.map(b => ({
      round: b.round,
      opponent: b.result === 'BYE' ? null : 2,
      result: b.result,
      status: 'completed' as const,
      operativesKilled: 0,
      isExternalOpponent: false,
      timestamp: new Date().toISOString(),
      cpEarned: 0,
      spEarned: 0
    })),
    history: history.map(h => ({
      round: h.round,
      phase: 'Action',
      timestamp: new Date().toISOString(),
      action: 'Test action',
      spBefore: h.spBefore,
      spAfter: h.spAfter,
      cpBefore: h.cpBefore,
      cpAfter: h.cpAfter
    })),
    eliminated: false,
    priority: 1
  }
}

describe('roundStatistics', () => {
  describe('calculateRoundStatistics', () => {
    describe('when calculating stats for a round with activity', () => {
      it('should return correct statistics for round with hexes explored and battles', () => {
        const events: Event[] = [
          createMockEvent('exploration', 'Player 1 explored hex 0,0', 1),
          createMockEvent('exploration', 'Player 2 explored hex 0,1', 1),
          createMockEvent('battle', 'Player 1 won battle', 1, 'Battle'),
          createMockEvent('system', 'Threat increased to 2', 1, 'Threat')
        ]

        const players: Player[] = [
          createMockPlayer(
            1,
            'Player 1',
            [{ round: 1, result: 'WIN' }],
            [
              { round: 1, spBefore: 5, spAfter: 6, cpBefore: 0, cpAfter: 2 }
            ]
          ),
          createMockPlayer(
            2,
            'Player 2',
            [{ round: 1, result: 'LOSS' }],
            [
              { round: 1, spBefore: 5, spAfter: 4, cpBefore: 0, cpAfter: 0 }
            ]
          )
        ]

        const result = calculateRoundStatistics(events, players, 1)

        expect(result.hexesExplored).toBe(2)
        expect(result.battles.wins).toBe(1)
        expect(result.battles.losses).toBe(1)
        expect(result.spChanges[1]).toBe(1)  // +1 SP
        expect(result.spChanges[2]).toBe(-1) // -1 SP
        expect(result.cpChanges[1]).toBe(2)  // +2 CP
        expect(result.threatChange.from).toBe(1)
        expect(result.threatChange.to).toBe(2)
      })

      it('should return zero stats for round with no activity', () => {
        const events: Event[] = []
        const players: Player[] = [
          createMockPlayer(1, 'Player 1', [], [])
        ]

        const result = calculateRoundStatistics(events, players, 1)

        expect(result.hexesExplored).toBe(0)
        expect(result.battles.wins).toBe(0)
        expect(result.battles.losses).toBe(0)
        expect(result.battles.draws).toBe(0)
        expect(result.battles.byes).toBe(0)
        expect(result.spChanges).toEqual({ 1: 0 })
        expect(result.cpChanges).toEqual({ 1: 0 })
        expect(result.majorEvents).toEqual([])
      })
    })

    describe('when filtering events by round', () => {
      it('should only count events from specified round', () => {
        const events: Event[] = [
          createMockEvent('exploration', 'Round 1 exploration', 1),
          createMockEvent('exploration', 'Round 2 exploration', 2),
          createMockEvent('exploration', 'Round 1 exploration', 1)
        ]

        const players: Player[] = []
        const result = calculateRoundStatistics(events, players, 1)

        expect(result.hexesExplored).toBe(2)
      })
    })
  })

  describe('extractBattleStats', () => {
    describe('when counting battle results', () => {
      it('should count wins, losses, draws, and byes correctly', () => {
        const players: Player[] = [
          createMockPlayer(1, 'P1', [{ round: 1, result: 'WIN' }], []),
          createMockPlayer(2, 'P2', [{ round: 1, result: 'LOSS' }], []),
          createMockPlayer(3, 'P3', [{ round: 1, result: 'DRAW' }], []),
          createMockPlayer(4, 'P4', [{ round: 1, result: 'BYE' }], [])
        ]

        const result = extractBattleStats(players, 1)

        expect(result.wins).toBe(1)
        expect(result.losses).toBe(1)
        expect(result.draws).toBe(1)
        expect(result.byes).toBe(1)
      })

      it('should only count battles from specified round', () => {
        const players: Player[] = [
          createMockPlayer(1, 'P1', [
            { round: 1, result: 'WIN' },
            { round: 2, result: 'WIN' }
          ], [])
        ]

        const result = extractBattleStats(players, 1)

        expect(result.wins).toBe(1)
      })

      it('should return zeros when no battles occurred', () => {
        const players: Player[] = [
          createMockPlayer(1, 'P1', [], [])
        ]

        const result = extractBattleStats(players, 1)

        expect(result.wins).toBe(0)
        expect(result.losses).toBe(0)
        expect(result.draws).toBe(0)
        expect(result.byes).toBe(0)
      })
    })
  })

  describe('calculateSPChanges', () => {
    describe('when tracking SP changes', () => {
      it('should calculate positive SP change', () => {
        const players: Player[] = [
          createMockPlayer(1, 'P1', [], [
            { round: 1, spBefore: 3, spAfter: 5, cpBefore: 0, cpAfter: 0 }
          ])
        ]

        const result = calculateSPChanges(players, 1)

        expect(result[1]).toBe(2)
      })

      it('should calculate negative SP change', () => {
        const players: Player[] = [
          createMockPlayer(1, 'P1', [], [
            { round: 1, spBefore: 7, spAfter: 4, cpBefore: 0, cpAfter: 0 }
          ])
        ]

        const result = calculateSPChanges(players, 1)

        expect(result[1]).toBe(-3)
      })

      it('should calculate zero SP change when no history', () => {
        const players: Player[] = [
          createMockPlayer(1, 'P1', [], [])
        ]

        const result = calculateSPChanges(players, 1)

        expect(result[1]).toBe(0)
      })

      it('should only use history from specified round', () => {
        const players: Player[] = [
          createMockPlayer(1, 'P1', [], [
            { round: 1, spBefore: 5, spAfter: 6, cpBefore: 0, cpAfter: 0 },
            { round: 2, spBefore: 6, spAfter: 10, cpBefore: 0, cpAfter: 0 }
          ])
        ]

        const result = calculateSPChanges(players, 1)

        expect(result[1]).toBe(1)
      })
    })
  })

  describe('calculateCPChanges', () => {
    describe('when tracking CP changes', () => {
      it('should calculate positive CP change', () => {
        const players: Player[] = [
          createMockPlayer(1, 'P1', [], [
            { round: 1, spBefore: 5, spAfter: 5, cpBefore: 0, cpAfter: 3 }
          ])
        ]

        const result = calculateCPChanges(players, 1)

        expect(result[1]).toBe(3)
      })

      it('should calculate zero CP change when no history', () => {
        const players: Player[] = [
          createMockPlayer(1, 'P1', [], [])
        ]

        const result = calculateCPChanges(players, 1)

        expect(result[1]).toBe(0)
      })

      it('should only use history from specified round', () => {
        const players: Player[] = [
          createMockPlayer(1, 'P1', [], [
            { round: 1, spBefore: 5, spAfter: 5, cpBefore: 0, cpAfter: 2 },
            { round: 2, spBefore: 5, spAfter: 5, cpBefore: 2, cpAfter: 5 }
          ])
        ]

        const result = calculateCPChanges(players, 1)

        expect(result[1]).toBe(2)
      })
    })
  })

  describe('getMajorEvents', () => {
    describe('when filtering major events', () => {
      it('should include exploration, battle, and reward events', () => {
        const events: Event[] = [
          createMockEvent('exploration', 'Found tomb', 1),
          createMockEvent('battle', 'Won battle', 1),
          createMockEvent('reward', 'Gained CP', 1),
          createMockEvent('system', 'Phase changed', 1)
        ]

        const result = getMajorEvents(events, 1)

        expect(result).toHaveLength(3)
        expect(result[0]!.type).toBe('exploration')
        expect(result[1]!.type).toBe('battle')
        expect(result[2]!.type).toBe('reward')
      })

      it('should only include events from specified round', () => {
        const events: Event[] = [
          createMockEvent('exploration', 'Round 1', 1),
          createMockEvent('exploration', 'Round 2', 2)
        ]

        const result = getMajorEvents(events, 1)

        expect(result).toHaveLength(1)
        expect(result[0]!.message).toBe('Round 1')
      })

      it('should return empty array when no major events', () => {
        const events: Event[] = [
          createMockEvent('system', 'System message', 1)
        ]

        const result = getMajorEvents(events, 1)

        expect(result).toEqual([])
      })
    })
  })
})
