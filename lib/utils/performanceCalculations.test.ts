/**
 * WHY: Issue #56 - Tests for solo performance calculation utilities
 * TDD: Write tests first, then implement functions
 */

import { describe, it, expect } from 'vitest'
import {
  calculatePerformanceStats,
  buildPerformanceRecord,
  createEmptyPersonalBests,
  updatePersonalBests
} from './performanceCalculations'
import type { Player } from '@/types/campaign'
import type { SoloPerformanceRecord } from '@/types/soloPerformance'

describe('calculatePerformanceStats', () => {
  it('should calculate win rate correctly', () => {
    const stats = calculatePerformanceStats(10, 6, 10, 50, 15, 120)

    expect(stats.winRate).toBe(0.6) // 6/10
  })

  it('should handle zero games played', () => {
    const stats = calculatePerformanceStats(5, 0, 0, 30, 10, 80)

    expect(stats.winRate).toBe(0) // 0/0 = 0
  })

  it('should calculate averages per round correctly', () => {
    const stats = calculatePerformanceStats(10, 5, 10, 40, 15, 120)

    expect(stats.avgCPPerRound).toBe(12) // 120/10
    expect(stats.spSpentPerRound).toBe(4) // 40/10
    expect(stats.hexesPerRound).toBe(1.5) // 15/10
  })

  it('should handle single round campaigns', () => {
    const stats = calculatePerformanceStats(1, 0, 1, 5, 3, 10)

    expect(stats.avgCPPerRound).toBe(10) // 10/1
    expect(stats.spSpentPerRound).toBe(5) // 5/1
    expect(stats.hexesPerRound).toBe(3) // 3/1
  })

  it('should handle zero rounds edge case', () => {
    const stats = calculatePerformanceStats(0, 0, 0, 0, 0, 0)

    expect(stats.winRate).toBe(0)
    expect(stats.avgCPPerRound).toBe(0)
    expect(stats.spSpentPerRound).toBe(0)
    expect(stats.hexesPerRound).toBe(0)
  })

  it('should calculate with decimal precision', () => {
    const stats = calculatePerformanceStats(15, 10, 15, 67, 14, 150)

    expect(stats.winRate).toBeCloseTo(0.667, 3) // 10/15
    expect(stats.avgCPPerRound).toBe(10) // 150/15
    expect(stats.spSpentPerRound).toBeCloseTo(4.47, 2) // 67/15
    expect(stats.hexesPerRound).toBeCloseTo(0.93, 2) // 14/15
  })
})

describe('buildPerformanceRecord', () => {
  it('should build complete record from player data', () => {
    const player: Partial<Player> = {
      campaignPoints: 150,
      supplyPointsSpent: 25,
      exploredHexes: 18,
      gamesPlayed: 8,
      gamesWon: 5,
      operativeKillDetails: [
        { round: 1, operativeName: 'Fire Warrior', wounds: 7, woundValue: 1, opponentId: null },
        { round: 2, operativeName: 'Crisis Suit', wounds: 12, woundValue: 2, opponentId: null }
      ]
    }

    const record = buildPerformanceRecord(
      'campaign-1',
      true,
      10,
      7,
      player as Player
    )

    expect(record.campaignId).toBe('campaign-1')
    expect(record.success).toBe(true)
    expect(record.finalCP).toBe(150)
    expect(record.finalThreat).toBe(10)
    expect(record.rounds).toBe(7)

    expect(record.categories.pioneer.value).toBe(25)
    expect(record.categories.explorer.value).toBe(18)
    expect(record.categories.trooper.value).toBe(8)
    expect(record.categories.warrior.value).toBe(5)
    expect(record.categories.headhunter.value).toBe(19) // 7 + 12

    expect(record.stats.winRate).toBe(0.625) // 5/8
  })

  it('should calculate operative wounds from details correctly', () => {
    const player: Partial<Player> = {
      campaignPoints: 100,
      supplyPointsSpent: 20,
      exploredHexes: 10,
      gamesPlayed: 5,
      gamesWon: 3,
      operativeKillDetails: [
        { round: 1, operativeName: 'Op1', wounds: 12, woundValue: 2, opponentId: null },
        { round: 2, operativeName: 'Op2', wounds: 14, woundValue: 2, opponentId: null },
        { round: 3, operativeName: 'Op3', wounds: 18, woundValue: 2, opponentId: null }
      ]
    }

    const record = buildPerformanceRecord('c1', true, 10, 5, player as Player)

    expect(record.categories.headhunter.value).toBe(44) // 12 + 14 + 18
  })

  it('should handle player with no operative kills', () => {
    const player: Partial<Player> = {
      campaignPoints: 80,
      supplyPointsSpent: 15,
      exploredHexes: 8,
      gamesPlayed: 4,
      gamesWon: 2,
      operativeKillDetails: []
    }

    const record = buildPerformanceRecord('c2', false, 9, 6, player as Player)

    expect(record.categories.headhunter.value).toBe(0)
  })

  it('should generate ISO timestamp for date', () => {
    const player: Partial<Player> = {
      campaignPoints: 100,
      supplyPointsSpent: 0,
      exploredHexes: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      operativeKillDetails: []
    }

    const record = buildPerformanceRecord('c3', true, 10, 5, player as Player)

    // Should be valid ISO 8601 timestamp
    expect(() => new Date(record.date)).not.toThrow()
    expect(new Date(record.date).toISOString()).toBe(record.date)
  })

  it('should include category names and descriptions', () => {
    const player: Partial<Player> = {
      campaignPoints: 100,
      supplyPointsSpent: 20,
      exploredHexes: 10,
      gamesPlayed: 5,
      gamesWon: 3,
      operativeKillDetails: []
    }

    const record = buildPerformanceRecord('c4', true, 10, 5, player as Player)

    expect(record.categories.pioneer.name).toBe('Pioneer')
    expect(record.categories.pioneer.description).toContain('Supply Points')

    expect(record.categories.explorer.name).toBe('Explorer')
    expect(record.categories.explorer.description).toContain('Hexes')

    expect(record.categories.trooper.name).toBe('Trooper')
    expect(record.categories.trooper.description).toContain('Battles')

    expect(record.categories.warrior.name).toBe('Warrior')
    expect(record.categories.warrior.description).toContain('Victories')

    expect(record.categories.headhunter.name).toBe('Headhunter')
    expect(record.categories.headhunter.description).toContain('operative')
  })
})

describe('createEmptyPersonalBests', () => {
  it('should return all bests as null', () => {
    const bests = createEmptyPersonalBests()

    expect(bests.highestCP).toBeNull()
    expect(bests.mostSPSpent).toBeNull()
    expect(bests.mostHexesExplored).toBeNull()
    expect(bests.mostGamesPlayed).toBeNull()
    expect(bests.mostGamesWon).toBeNull()
    expect(bests.mostOperatives).toBeNull()
    expect(bests.shortestVictory).toBeNull()
    expect(bests.longestVictory).toBeNull()
  })
})

describe('updatePersonalBests', () => {
  it('should initialize bests from first campaign', () => {
    const emptyBests = createEmptyPersonalBests()

    const newRecord: SoloPerformanceRecord = {
      campaignId: 'campaign-1',
      date: '2025-01-15T10:00:00Z',
      success: true,
      finalCP: 100,
      finalThreat: 10,
      rounds: 12,
      categories: {
        pioneer: { name: 'Pioneer', value: 50, description: 'SP spent' },
        explorer: { name: 'Explorer', value: 15, description: 'Hexes' },
        trooper: { name: 'Trooper', value: 10, description: 'Games' },
        warrior: { name: 'Warrior', value: 6, description: 'Wins' },
        headhunter: { name: 'Headhunter', value: 20, description: 'Ops' }
      },
      stats: { winRate: 0.6, avgCPPerRound: 8.33, spSpentPerRound: 4.17, hexesPerRound: 1.25 }
    }

    const bests = updatePersonalBests(emptyBests, newRecord)

    expect(bests.highestCP).toEqual({
      value: 100,
      campaignId: 'campaign-1',
      date: '2025-01-15T10:00:00Z'
    })
    expect(bests.mostSPSpent?.value).toBe(50)
    expect(bests.mostHexesExplored?.value).toBe(15)
    expect(bests.shortestVictory?.value).toBe(12)
  })

  it('should update highest CP when new record is higher', () => {
    const currentBests = createEmptyPersonalBests()
    currentBests.highestCP = {
      value: 100,
      campaignId: 'old',
      date: '2025-01-01T10:00:00Z'
    }

    const newRecord: SoloPerformanceRecord = {
      campaignId: 'new',
      date: '2025-01-02T10:00:00Z',
      success: true,
      finalCP: 150,
      finalThreat: 10,
      rounds: 10,
      categories: {
        pioneer: { name: 'Pioneer', value: 30, description: '' },
        explorer: { name: 'Explorer', value: 10, description: '' },
        trooper: { name: 'Trooper', value: 8, description: '' },
        warrior: { name: 'Warrior', value: 5, description: '' },
        headhunter: { name: 'Headhunter', value: 15, description: '' }
      },
      stats: { winRate: 0.625, avgCPPerRound: 15, spSpentPerRound: 3, hexesPerRound: 1 }
    }

    const bests = updatePersonalBests(currentBests, newRecord)

    expect(bests.highestCP?.value).toBe(150)
    expect(bests.highestCP?.campaignId).toBe('new')
  })

  it('should not update when new record is lower', () => {
    const currentBests = createEmptyPersonalBests()
    currentBests.highestCP = {
      value: 150,
      campaignId: 'old',
      date: '2025-01-01T10:00:00Z'
    }

    const newRecord: SoloPerformanceRecord = {
      campaignId: 'new',
      date: '2025-01-02T10:00:00Z',
      success: true,
      finalCP: 100,
      finalThreat: 10,
      rounds: 10,
      categories: {
        pioneer: { name: 'Pioneer', value: 30, description: '' },
        explorer: { name: 'Explorer', value: 10, description: '' },
        trooper: { name: 'Trooper', value: 8, description: '' },
        warrior: { name: 'Warrior', value: 5, description: '' },
        headhunter: { name: 'Headhunter', value: 15, description: '' }
      },
      stats: { winRate: 0.625, avgCPPerRound: 10, spSpentPerRound: 3, hexesPerRound: 1 }
    }

    const bests = updatePersonalBests(currentBests, newRecord)

    expect(bests.highestCP?.campaignId).toBe('old')
    expect(bests.highestCP?.value).toBe(150)
  })

  it('should track shortest successful campaign', () => {
    const currentBests = createEmptyPersonalBests()
    currentBests.shortestVictory = {
      value: 10,
      campaignId: 'old',
      date: '2025-01-01T10:00:00Z'
    }

    const newRecord: SoloPerformanceRecord = {
      campaignId: 'new',
      date: '2025-01-02T10:00:00Z',
      success: true,
      finalCP: 120,
      finalThreat: 10,
      rounds: 8,
      categories: {
        pioneer: { name: 'Pioneer', value: 40, description: '' },
        explorer: { name: 'Explorer', value: 12, description: '' },
        trooper: { name: 'Trooper', value: 6, description: '' },
        warrior: { name: 'Warrior', value: 4, description: '' },
        headhunter: { name: 'Headhunter', value: 18, description: '' }
      },
      stats: { winRate: 0.667, avgCPPerRound: 15, spSpentPerRound: 5, hexesPerRound: 1.5 }
    }

    const bests = updatePersonalBests(currentBests, newRecord)

    expect(bests.shortestVictory?.value).toBe(8)
    expect(bests.shortestVictory?.campaignId).toBe('new')
  })

  it('should ignore failed campaigns for victory records', () => {
    const currentBests = createEmptyPersonalBests()

    const failedRecord: SoloPerformanceRecord = {
      campaignId: 'failed',
      date: '2025-01-02T10:00:00Z',
      success: false,
      finalCP: 80,
      finalThreat: 10,
      rounds: 5,
      categories: {
        pioneer: { name: 'Pioneer', value: 25, description: '' },
        explorer: { name: 'Explorer', value: 8, description: '' },
        trooper: { name: 'Trooper', value: 4, description: '' },
        warrior: { name: 'Warrior', value: 2, description: '' },
        headhunter: { name: 'Headhunter', value: 10, description: '' }
      },
      stats: { winRate: 0.5, avgCPPerRound: 16, spSpentPerRound: 5, hexesPerRound: 1.6 }
    }

    const bests = updatePersonalBests(currentBests, failedRecord)

    // Should update non-victory records
    expect(bests.highestCP?.value).toBe(80)
    expect(bests.mostSPSpent?.value).toBe(25)

    // Should NOT update victory-specific records
    expect(bests.shortestVictory).toBeNull()
    expect(bests.longestVictory).toBeNull()
  })

  it('should update all category bests independently', () => {
    const currentBests = createEmptyPersonalBests()
    currentBests.highestCP = { value: 200, campaignId: 'c1', date: '2025-01-01T10:00:00Z' }
    currentBests.mostHexesExplored = { value: 10, campaignId: 'c2', date: '2025-01-01T10:00:00Z' }

    const newRecord: SoloPerformanceRecord = {
      campaignId: 'new',
      date: '2025-01-02T10:00:00Z',
      success: true,
      finalCP: 150, // Lower than best
      finalThreat: 10,
      rounds: 12,
      categories: {
        pioneer: { name: 'Pioneer', value: 60, description: '' },
        explorer: { name: 'Explorer', value: 20, description: '' }, // Higher than best
        trooper: { name: 'Trooper', value: 15, description: '' },
        warrior: { name: 'Warrior', value: 10, description: '' },
        headhunter: { name: 'Headhunter', value: 25, description: '' }
      },
      stats: { winRate: 0.667, avgCPPerRound: 12.5, spSpentPerRound: 5, hexesPerRound: 1.67 }
    }

    const bests = updatePersonalBests(currentBests, newRecord)

    // Should NOT update CP (lower than best)
    expect(bests.highestCP?.campaignId).toBe('c1')

    // Should update hexes (higher than best)
    expect(bests.mostHexesExplored?.value).toBe(20)
    expect(bests.mostHexesExplored?.campaignId).toBe('new')
  })

  it('should track longest victory separately from shortest', () => {
    const currentBests = createEmptyPersonalBests()

    const shortRecord: SoloPerformanceRecord = {
      campaignId: 'short',
      date: '2025-01-01T10:00:00Z',
      success: true,
      finalCP: 120,
      finalThreat: 10,
      rounds: 6,
      categories: {
        pioneer: { name: 'Pioneer', value: 30, description: '' },
        explorer: { name: 'Explorer', value: 10, description: '' },
        trooper: { name: 'Trooper', value: 5, description: '' },
        warrior: { name: 'Warrior', value: 3, description: '' },
        headhunter: { name: 'Headhunter', value: 15, description: '' }
      },
      stats: { winRate: 0.6, avgCPPerRound: 20, spSpentPerRound: 5, hexesPerRound: 1.67 }
    }

    let bests = updatePersonalBests(currentBests, shortRecord)
    expect(bests.shortestVictory?.value).toBe(6)
    expect(bests.longestVictory?.value).toBe(6)

    const longRecord: SoloPerformanceRecord = {
      ...shortRecord,
      campaignId: 'long',
      date: '2025-01-02T10:00:00Z',
      rounds: 20
    }

    bests = updatePersonalBests(bests, longRecord)
    expect(bests.shortestVictory?.value).toBe(6)
    expect(bests.longestVictory?.value).toBe(20)
  })
})
