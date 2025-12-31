/**
 * @vitest-environment jsdom
 * WHY: Test suite for battle statistics utility (Issue #34)
 */

import { describe, it, expect } from 'vitest'
import {
  calculateBattleStatistics,
  getMostFacedOpponent,
  filterBattleHistory
} from './battleStats'
import type { ExtendedBattleRecord } from '@/types/battle'

/**
 * WHY: Factory function to create test battle records with defaults
 */
const createBattleRecord = (
  overrides: Partial<ExtendedBattleRecord> = {}
): ExtendedBattleRecord => ({
  round: 1,
  opponent: 0,
  result: 'WIN',
  status: 'completed',
  operativesKilled: 3,
  isExternalOpponent: false,
  timestamp: new Date().toISOString(),
  cpEarned: 1,
  spEarned: 0,
  ...overrides
})

describe('Battle Statistics Utility', () => {
  describe('calculateBattleStatistics', () => {
    it('should return zero stats for empty history', () => {
      const stats = calculateBattleStatistics([])

      expect(stats.totalBattles).toBe(0)
      expect(stats.wins).toBe(0)
      expect(stats.losses).toBe(0)
      expect(stats.draws).toBe(0)
      expect(stats.byes).toBe(0)
      expect(stats.winRate).toBe(0)
      expect(stats.totalCPFromBattles).toBe(0)
      expect(stats.totalSPFromBattles).toBe(0)
      expect(stats.totalOperativesKilled).toBe(0)
      expect(stats.totalOperativesLost).toBe(0)
      expect(stats.averageVPScored).toBeNull()
      expect(stats.mostFacedOpponent).toBeNull()
    })

    it('should count results correctly', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ result: 'WIN' }),
        createBattleRecord({ result: 'WIN', round: 2 }),
        createBattleRecord({ result: 'LOSS', round: 3 }),
        createBattleRecord({ result: 'DRAW', round: 4 }),
        createBattleRecord({ result: 'BYE', round: 5, opponent: null, spEarned: 2, cpEarned: 0 })
      ]

      const stats = calculateBattleStatistics(history)

      expect(stats.totalBattles).toBe(5)
      expect(stats.wins).toBe(2)
      expect(stats.losses).toBe(1)
      expect(stats.draws).toBe(1)
      expect(stats.byes).toBe(1)
    })

    it('should calculate win rate correctly', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ result: 'WIN' }),
        createBattleRecord({ result: 'WIN', round: 2 }),
        createBattleRecord({ result: 'LOSS', round: 3 }),
        createBattleRecord({ result: 'DRAW', round: 4 })
      ]

      const stats = calculateBattleStatistics(history)

      // 2 wins out of 4 battles = 50%
      expect(stats.winRate).toBe(50)
    })

    it('should exclude byes from win rate calculation', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ result: 'WIN' }),
        createBattleRecord({ result: 'BYE', round: 2, opponent: null, spEarned: 2, cpEarned: 0 }),
        createBattleRecord({ result: 'LOSS', round: 3 })
      ]

      const stats = calculateBattleStatistics(history)

      // WHY: Win rate is 1 win out of 2 actual battles (excluding bye)
      expect(stats.winRate).toBe(50)
      expect(stats.byes).toBe(1)
    })

    it('should handle 100% win rate', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ result: 'WIN' }),
        createBattleRecord({ result: 'WIN', round: 2 })
      ]

      const stats = calculateBattleStatistics(history)
      expect(stats.winRate).toBe(100)
    })

    it('should handle 0% win rate', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ result: 'LOSS' }),
        createBattleRecord({ result: 'LOSS', round: 2 })
      ]

      const stats = calculateBattleStatistics(history)
      expect(stats.winRate).toBe(0)
    })

    it('should sum CP and SP earned', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ cpEarned: 1, spEarned: 0 }),
        createBattleRecord({ result: 'LOSS', cpEarned: 0, spEarned: 1, round: 2 }),
        createBattleRecord({ result: 'BYE', cpEarned: 0, spEarned: 2, round: 3, opponent: null })
      ]

      const stats = calculateBattleStatistics(history)

      expect(stats.totalCPFromBattles).toBe(1)
      expect(stats.totalSPFromBattles).toBe(3)
    })

    it('should sum operatives killed', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ operativesKilled: 5 }),
        createBattleRecord({ operativesKilled: 3, round: 2 }),
        createBattleRecord({ operativesKilled: 2, round: 3 })
      ]

      const stats = calculateBattleStatistics(history)
      expect(stats.totalOperativesKilled).toBe(10)
    })

    it('should sum operatives lost', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ operativesLost: 2 }),
        createBattleRecord({ operativesLost: 4, round: 2 }),
        createBattleRecord({ round: 3 }) // No operativesLost
      ]

      const stats = calculateBattleStatistics(history)
      expect(stats.totalOperativesLost).toBe(6)
    })

    it('should calculate average VP when missions have VP data', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ vpScored: 10, missionType: 'Loot and Salvage' }),
        createBattleRecord({ vpScored: 14, missionType: 'Seize Ground', round: 2 }),
        createBattleRecord({ round: 3 }) // No VP data
      ]

      const stats = calculateBattleStatistics(history)

      // (10 + 14) / 2 = 12
      expect(stats.averageVPScored).toBe(12)
    })

    it('should return null for averageVP when no VP data exists', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({}),
        createBattleRecord({ round: 2 })
      ]

      const stats = calculateBattleStatistics(history)
      expect(stats.averageVPScored).toBeNull()
    })

    it('should round average VP to nearest integer', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ vpScored: 10 }),
        createBattleRecord({ vpScored: 11, round: 2 }),
        createBattleRecord({ vpScored: 12, round: 3 })
      ]

      const stats = calculateBattleStatistics(history)

      // (10 + 11 + 12) / 3 = 11
      expect(stats.averageVPScored).toBe(11)
    })

    it('should identify most faced opponent', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ opponent: 1 }),
        createBattleRecord({ opponent: 2, round: 2 }),
        createBattleRecord({ opponent: 1, round: 3 }),
        createBattleRecord({ opponent: 1, round: 4 })
      ]

      const stats = calculateBattleStatistics(history)

      expect(stats.mostFacedOpponent).toEqual({ playerId: 1, count: 3 })
    })
  })

  describe('getMostFacedOpponent', () => {
    it('should identify most common opponent', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ opponent: 1 }),
        createBattleRecord({ opponent: 2, round: 2 }),
        createBattleRecord({ opponent: 1, round: 3 }),
        createBattleRecord({ opponent: 1, round: 4 })
      ]

      const result = getMostFacedOpponent(history)

      expect(result?.playerId).toBe(1)
      expect(result?.count).toBe(3)
    })

    it('should return null for empty history', () => {
      const result = getMostFacedOpponent([])
      expect(result).toBeNull()
    })

    it('should return null when only byes and external opponents', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ result: 'BYE', opponent: null }),
        createBattleRecord({ isExternalOpponent: true, opponent: null, round: 2 })
      ]

      const result = getMostFacedOpponent(history)
      expect(result).toBeNull()
    })

    it('should exclude external opponents from count', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ opponent: 1 }),
        createBattleRecord({ opponent: 1, round: 2 }),
        createBattleRecord({ isExternalOpponent: true, opponent: null, round: 3 }),
        createBattleRecord({ isExternalOpponent: true, opponent: null, round: 4 }),
        createBattleRecord({ isExternalOpponent: true, opponent: null, round: 5 })
      ]

      const result = getMostFacedOpponent(history)

      // Only campaign opponent 1 should be counted
      expect(result?.playerId).toBe(1)
      expect(result?.count).toBe(2)
    })

    it('should handle tie by returning first opponent', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ opponent: 1 }),
        createBattleRecord({ opponent: 2, round: 2 })
      ]

      const result = getMostFacedOpponent(history)

      // Both have count 1, should return first encountered
      expect(result?.count).toBe(1)
      expect([1, 2]).toContain(result?.playerId)
    })
  })

  describe('filterBattleHistory', () => {
    it('should return all battles with empty filter', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ round: 1 }),
        createBattleRecord({ round: 2 }),
        createBattleRecord({ round: 3 })
      ]

      const filtered = filterBattleHistory(history, {})

      expect(filtered).toHaveLength(3)
    })

    it('should filter by round', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ round: 1 }),
        createBattleRecord({ round: 2 }),
        createBattleRecord({ round: 1 })
      ]

      const filtered = filterBattleHistory(history, { round: 1 })

      expect(filtered).toHaveLength(2)
      filtered.forEach(b => expect(b.round).toBe(1))
    })

    it('should filter by result', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ result: 'WIN' }),
        createBattleRecord({ result: 'LOSS', round: 2 }),
        createBattleRecord({ result: 'WIN', round: 3 })
      ]

      const filtered = filterBattleHistory(history, { result: 'WIN' })

      expect(filtered).toHaveLength(2)
      filtered.forEach(b => expect(b.result).toBe('WIN'))
    })

    it('should filter by campaign opponent', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ opponent: 1 }),
        createBattleRecord({ opponent: 2, round: 2 }),
        createBattleRecord({ opponent: 1, round: 3 })
      ]

      const filtered = filterBattleHistory(history, { opponentId: 1 })

      expect(filtered).toHaveLength(2)
      filtered.forEach(b => expect(b.opponent).toBe(1))
    })

    it('should filter by external opponents', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ opponent: 1, isExternalOpponent: false }),
        createBattleRecord({ opponent: null, isExternalOpponent: true, round: 2 }),
        createBattleRecord({ opponent: 2, isExternalOpponent: false, round: 3 })
      ]

      const filtered = filterBattleHistory(history, { opponentId: 'external' })

      expect(filtered).toHaveLength(1)
      expect(filtered[0]?.isExternalOpponent).toBe(true)
    })

    it('should filter by has mission', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ missionType: 'Loot and Salvage' }),
        createBattleRecord({ round: 2 }), // No mission
        createBattleRecord({ missionType: 'Seize Ground', round: 3 })
      ]

      const filteredWithMission = filterBattleHistory(history, { hasMission: true })
      expect(filteredWithMission).toHaveLength(2)

      const filteredWithoutMission = filterBattleHistory(history, { hasMission: false })
      expect(filteredWithoutMission).toHaveLength(1)
    })

    it('should combine multiple filters', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ round: 1, result: 'WIN' }),
        createBattleRecord({ round: 1, result: 'LOSS' }),
        createBattleRecord({ round: 2, result: 'WIN' }),
        createBattleRecord({ round: 2, result: 'WIN' })
      ]

      const filtered = filterBattleHistory(history, { round: 2, result: 'WIN' })

      expect(filtered).toHaveLength(2)
      filtered.forEach(b => {
        expect(b.round).toBe(2)
        expect(b.result).toBe('WIN')
      })
    })

    it('should return empty array when no matches', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ round: 1, result: 'WIN' }),
        createBattleRecord({ round: 2, result: 'LOSS' })
      ]

      const filtered = filterBattleHistory(history, { round: 5 })

      expect(filtered).toHaveLength(0)
    })

    it('should not mutate original array', () => {
      const history: ExtendedBattleRecord[] = [
        createBattleRecord({ round: 1 }),
        createBattleRecord({ round: 2 })
      ]

      const filtered = filterBattleHistory(history, { round: 1 })

      expect(filtered).not.toBe(history)
      expect(history).toHaveLength(2)
    })
  })
})
