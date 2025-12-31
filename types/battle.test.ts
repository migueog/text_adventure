/**
 * @vitest-environment jsdom
 * WHY: Test suite for battle types (Issue #34)
 * Tests type validation for ExtendedBattleRecord, BattleStatistics, Mission
 */

import { describe, it, expect } from 'vitest'
import type {
  ExtendedBattleRecord,
  BattleStatistics,
  Mission,
  BattleHistoryFilter
} from './battle'

describe('Battle Types', () => {
  describe('ExtendedBattleRecord', () => {
    it('should include all required fields from base BattleRecord', () => {
      // WHY: Verify ExtendedBattleRecord extends BattleRecord correctly
      const record: ExtendedBattleRecord = {
        round: 1,
        opponent: 0,
        result: 'WIN',
        status: 'completed',
        operativesKilled: 3,
        // New extended fields
        isExternalOpponent: false,
        timestamp: '2024-01-15T10:30:00Z',
        cpEarned: 1,
        spEarned: 0
      }

      expect(record.round).toBe(1)
      expect(record.opponent).toBe(0)
      expect(record.result).toBe('WIN')
      expect(record.status).toBe('completed')
      expect(record.operativesKilled).toBe(3)
      expect(record.isExternalOpponent).toBe(false)
      expect(record.timestamp).toBe('2024-01-15T10:30:00Z')
      expect(record.cpEarned).toBe(1)
      expect(record.spEarned).toBe(0)
    })

    it('should allow optional detailed fields', () => {
      // WHY: Detailed fields are optional for quick entry mode
      const fullRecord: ExtendedBattleRecord = {
        round: 2,
        opponent: 1,
        result: 'WIN',
        status: 'completed',
        operativesKilled: 4,
        isExternalOpponent: false,
        timestamp: '2024-01-15T11:00:00Z',
        cpEarned: 1,
        spEarned: 0,
        // Optional detailed fields
        missionType: 'Loot and Salvage',
        vpScored: 12,
        vpOpponent: 8,
        operativesLost: 2,
        notes: 'Hard-fought victory at the thermal vent'
      }

      expect(fullRecord.missionType).toBe('Loot and Salvage')
      expect(fullRecord.vpScored).toBe(12)
      expect(fullRecord.vpOpponent).toBe(8)
      expect(fullRecord.operativesLost).toBe(2)
      expect(fullRecord.notes).toBe('Hard-fought victory at the thermal vent')
    })

    it('should allow optional fields to be undefined', () => {
      // WHY: Minimal record for BYE or quick entry
      const minimalRecord: ExtendedBattleRecord = {
        round: 1,
        opponent: null,
        result: 'BYE',
        status: 'completed',
        operativesKilled: 0,
        isExternalOpponent: false,
        timestamp: '2024-01-15T10:30:00Z',
        cpEarned: 0,
        spEarned: 2
      }

      expect(minimalRecord.missionType).toBeUndefined()
      expect(minimalRecord.vpScored).toBeUndefined()
      expect(minimalRecord.vpOpponent).toBeUndefined()
      expect(minimalRecord.operativesLost).toBeUndefined()
      expect(minimalRecord.notes).toBeUndefined()
    })

    it('should handle external opponent toggle', () => {
      // WHY: External opponents are not in the campaign
      const externalBattle: ExtendedBattleRecord = {
        round: 2,
        opponent: null, // null for external
        result: 'WIN',
        status: 'completed',
        operativesKilled: 4,
        isExternalOpponent: true,
        timestamp: '2024-01-15T11:00:00Z',
        cpEarned: 1,
        spEarned: 0
      }

      expect(externalBattle.isExternalOpponent).toBe(true)
      expect(externalBattle.opponent).toBeNull()
    })

    it('should support all battle result types', () => {
      // WHY: Verify all BattleResult values work
      const results: Array<ExtendedBattleRecord['result']> = ['WIN', 'LOSS', 'DRAW', 'BYE']

      results.forEach(result => {
        const record: ExtendedBattleRecord = {
          round: 1,
          opponent: result === 'BYE' ? null : 0,
          result,
          status: 'completed',
          operativesKilled: 0,
          isExternalOpponent: false,
          timestamp: new Date().toISOString(),
          cpEarned: result === 'WIN' ? 1 : 0,
          spEarned: result === 'WIN' ? 0 : result === 'BYE' ? 2 : 1
        }
        expect(record.result).toBe(result)
      })
    })

    it('should support all challenge status types', () => {
      // WHY: Verify all status values for challenge tracking
      const statuses: Array<ExtendedBattleRecord['status']> = [
        'completed',
        'challenged-refused',
        'challenged-no-show'
      ]

      statuses.forEach(status => {
        const record: ExtendedBattleRecord = {
          round: 1,
          opponent: 0,
          result: 'WIN',
          status,
          operativesKilled: 0,
          isExternalOpponent: false,
          timestamp: new Date().toISOString(),
          cpEarned: 1,
          spEarned: 0
        }
        expect(record.status).toBe(status)
      })
    })
  })

  describe('BattleStatistics', () => {
    it('should have all required statistics fields', () => {
      // WHY: Verify all stats needed for display
      const stats: BattleStatistics = {
        totalBattles: 10,
        wins: 6,
        losses: 3,
        draws: 1,
        byes: 0,
        winRate: 60,
        totalCPFromBattles: 7,
        totalSPFromBattles: 4,
        totalOperativesKilled: 25,
        totalOperativesLost: 15,
        averageVPScored: 10.5,
        mostFacedOpponent: { playerId: 2, count: 4 }
      }

      expect(stats.totalBattles).toBe(10)
      expect(stats.wins).toBe(6)
      expect(stats.losses).toBe(3)
      expect(stats.draws).toBe(1)
      expect(stats.byes).toBe(0)
      expect(stats.winRate).toBe(60)
      expect(stats.totalCPFromBattles).toBe(7)
      expect(stats.totalSPFromBattles).toBe(4)
      expect(stats.totalOperativesKilled).toBe(25)
      expect(stats.totalOperativesLost).toBe(15)
      expect(stats.averageVPScored).toBe(10.5)
      expect(stats.mostFacedOpponent).toEqual({ playerId: 2, count: 4 })
    })

    it('should allow null for optional computed fields', () => {
      // WHY: averageVPScored and mostFacedOpponent can be null
      const emptyStats: BattleStatistics = {
        totalBattles: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        byes: 0,
        winRate: 0,
        totalCPFromBattles: 0,
        totalSPFromBattles: 0,
        totalOperativesKilled: 0,
        totalOperativesLost: 0,
        averageVPScored: null,
        mostFacedOpponent: null
      }

      expect(emptyStats.averageVPScored).toBeNull()
      expect(emptyStats.mostFacedOpponent).toBeNull()
    })
  })

  describe('Mission', () => {
    it('should have required mission properties', () => {
      // WHY: Mission structure for randomizer
      const mission: Mission = {
        id: 'loot-salvage',
        name: 'Loot and Salvage',
        category: 'Incursion'
      }

      expect(mission.id).toBe('loot-salvage')
      expect(mission.name).toBe('Loot and Salvage')
      expect(mission.category).toBe('Incursion')
    })

    it('should support all mission categories', () => {
      // WHY: Verify all Kill Team mission categories
      const categories: Array<Mission['category']> = [
        'Incursion',
        'Infiltrate',
        'Recon',
        'Seek and Destroy'
      ]

      categories.forEach(category => {
        const mission: Mission = {
          id: `test-${category.toLowerCase()}`,
          name: `Test ${category}`,
          category
        }
        expect(mission.category).toBe(category)
      })
    })
  })

  describe('BattleHistoryFilter', () => {
    it('should allow filtering by round', () => {
      const filter: BattleHistoryFilter = {
        round: 3
      }
      expect(filter.round).toBe(3)
    })

    it('should allow filtering by result', () => {
      const filter: BattleHistoryFilter = {
        result: 'WIN'
      }
      expect(filter.result).toBe('WIN')
    })

    it('should allow filtering by opponent including external', () => {
      // WHY: opponentId can be player ID or 'external'
      const campaignFilter: BattleHistoryFilter = {
        opponentId: 2
      }
      expect(campaignFilter.opponentId).toBe(2)

      const externalFilter: BattleHistoryFilter = {
        opponentId: 'external'
      }
      expect(externalFilter.opponentId).toBe('external')
    })

    it('should allow filtering by has mission', () => {
      const filter: BattleHistoryFilter = {
        hasMission: true
      }
      expect(filter.hasMission).toBe(true)
    })

    it('should allow combining multiple filters', () => {
      const filter: BattleHistoryFilter = {
        round: 2,
        result: 'WIN',
        opponentId: 1,
        hasMission: true
      }

      expect(filter.round).toBe(2)
      expect(filter.result).toBe('WIN')
      expect(filter.opponentId).toBe(1)
      expect(filter.hasMission).toBe(true)
    })

    it('should allow empty filter', () => {
      // WHY: Empty filter shows all battles
      const filter: BattleHistoryFilter = {}
      expect(Object.keys(filter)).toHaveLength(0)
    })
  })
})
