/**
 * WHY: Issue #56 - Tests for localStorage operations
 * TDD: Write tests first for performance history storage
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadPerformanceHistory,
  savePerformanceRecord,
  clearPerformanceHistory
} from './performanceStorage'
import type { SoloPerformanceRecord } from '@/types/soloPerformance'

// WHY: Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

// WHY: Replace global localStorage with mock
global.localStorage = mockLocalStorage as Storage

describe('performanceStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadPerformanceHistory', () => {
    it('should return empty history when none exists', () => {
      const history = loadPerformanceHistory()

      expect(history.campaigns).toEqual([])
      expect(history.personalBests.highestCP).toBeNull()
      expect(history.personalBests.mostSPSpent).toBeNull()
      expect(history.personalBests.mostHexesExplored).toBeNull()
      expect(history.personalBests.mostGamesPlayed).toBeNull()
      expect(history.personalBests.mostGamesWon).toBeNull()
      expect(history.personalBests.mostOperatives).toBeNull()
      expect(history.personalBests.shortestVictory).toBeNull()
      expect(history.personalBests.longestVictory).toBeNull()
    })

    it('should load existing history from localStorage', () => {
      const mockHistory = {
        campaigns: [
          {
            campaignId: 'campaign-1',
            date: '2025-01-15T10:00:00Z',
            success: true,
            finalCP: 150,
            finalThreat: 10,
            rounds: 12,
            categories: {
              pioneer: { name: 'Pioneer', value: 50, description: 'SP' },
              explorer: { name: 'Explorer', value: 15, description: 'Hexes' },
              trooper: { name: 'Trooper', value: 10, description: 'Games' },
              warrior: { name: 'Warrior', value: 6, description: 'Wins' },
              headhunter: { name: 'Headhunter', value: 20, description: 'Ops' }
            },
            stats: { winRate: 0.6, avgCPPerRound: 12.5, spSpentPerRound: 4.17, hexesPerRound: 1.25 }
          }
        ],
        personalBests: {
          highestCP: { value: 150, campaignId: 'campaign-1', date: '2025-01-15T10:00:00Z' },
          mostSPSpent: null,
          mostHexesExplored: null,
          mostGamesPlayed: null,
          mostGamesWon: null,
          mostOperatives: null,
          shortestVictory: null,
          longestVictory: null
        },
        lastUpdated: '2025-01-15T10:00:00Z'
      }

      localStorage.setItem('ctesiphus-solo-performance', JSON.stringify(mockHistory))

      const history = loadPerformanceHistory()

      expect(history.campaigns).toHaveLength(1)
      expect(history.campaigns[0].campaignId).toBe('campaign-1')
      expect(history.personalBests.highestCP?.value).toBe(150)
    })

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('ctesiphus-solo-performance', 'invalid json {{{')

      const history = loadPerformanceHistory()

      // WHY: Should fall back to empty history instead of crashing
      expect(history.campaigns).toEqual([])
      expect(history.personalBests.highestCP).toBeNull()
    })

    it('should return empty history for null localStorage value', () => {
      localStorage.setItem('ctesiphus-solo-performance', 'null')

      const history = loadPerformanceHistory()

      expect(history.campaigns).toEqual([])
    })
  })

  describe('savePerformanceRecord', () => {
    it('should add new record to empty history', () => {
      const record: SoloPerformanceRecord = {
        campaignId: 'campaign-1',
        date: '2025-01-15T10:00:00Z',
        success: true,
        finalCP: 120,
        finalThreat: 10,
        rounds: 10,
        categories: {
          pioneer: { name: 'Pioneer', value: 40, description: 'SP spent' },
          explorer: { name: 'Explorer', value: 12, description: 'Hexes' },
          trooper: { name: 'Trooper', value: 8, description: 'Games' },
          warrior: { name: 'Warrior', value: 5, description: 'Wins' },
          headhunter: { name: 'Headhunter', value: 16, description: 'Ops' }
        },
        stats: { winRate: 0.625, avgCPPerRound: 12, spSpentPerRound: 4, hexesPerRound: 1.2 }
      }

      savePerformanceRecord(record)

      const history = loadPerformanceHistory()
      expect(history.campaigns).toHaveLength(1)
      expect(history.campaigns[0].campaignId).toBe('campaign-1')
      expect(history.campaigns[0].finalCP).toBe(120)
    })

    it('should update personal bests when saving', () => {
      const record1: SoloPerformanceRecord = {
        campaignId: 'campaign-1',
        date: '2025-01-15T10:00:00Z',
        success: true,
        finalCP: 100,
        finalThreat: 10,
        rounds: 12,
        categories: {
          pioneer: { name: 'Pioneer', value: 30, description: '' },
          explorer: { name: 'Explorer', value: 10, description: '' },
          trooper: { name: 'Trooper', value: 8, description: '' },
          warrior: { name: 'Warrior', value: 5, description: '' },
          headhunter: { name: 'Headhunter', value: 12, description: '' }
        },
        stats: { winRate: 0.625, avgCPPerRound: 8.33, spSpentPerRound: 2.5, hexesPerRound: 0.83 }
      }

      const record2: SoloPerformanceRecord = {
        campaignId: 'campaign-2',
        date: '2025-01-16T10:00:00Z',
        success: true,
        finalCP: 150,
        finalThreat: 10,
        rounds: 10,
        categories: {
          pioneer: { name: 'Pioneer', value: 50, description: '' },
          explorer: { name: 'Explorer', value: 15, description: '' },
          trooper: { name: 'Trooper', value: 10, description: '' },
          warrior: { name: 'Warrior', value: 7, description: '' },
          headhunter: { name: 'Headhunter', value: 20, description: '' }
        },
        stats: { winRate: 0.7, avgCPPerRound: 15, spSpentPerRound: 5, hexesPerRound: 1.5 }
      }

      savePerformanceRecord(record1)
      savePerformanceRecord(record2)

      const history = loadPerformanceHistory()

      // WHY: Should update to higher CP
      expect(history.personalBests.highestCP?.value).toBe(150)
      expect(history.personalBests.highestCP?.campaignId).toBe('campaign-2')

      // WHY: Should update to shorter victory
      expect(history.personalBests.shortestVictory?.value).toBe(10)
    })

    it('should maintain chronological order (newest first)', () => {
      const older: SoloPerformanceRecord = {
        campaignId: 'older',
        date: '2025-01-01T10:00:00Z',
        success: true,
        finalCP: 100,
        finalThreat: 10,
        rounds: 12,
        categories: {
          pioneer: { name: 'Pioneer', value: 30, description: '' },
          explorer: { name: 'Explorer', value: 10, description: '' },
          trooper: { name: 'Trooper', value: 8, description: '' },
          warrior: { name: 'Warrior', value: 5, description: '' },
          headhunter: { name: 'Headhunter', value: 12, description: '' }
        },
        stats: { winRate: 0.625, avgCPPerRound: 8.33, spSpentPerRound: 2.5, hexesPerRound: 0.83 }
      }

      const newer: SoloPerformanceRecord = {
        campaignId: 'newer',
        date: '2025-01-02T10:00:00Z',
        success: true,
        finalCP: 120,
        finalThreat: 10,
        rounds: 10,
        categories: {
          pioneer: { name: 'Pioneer', value: 40, description: '' },
          explorer: { name: 'Explorer', value: 12, description: '' },
          trooper: { name: 'Trooper', value: 9, description: '' },
          warrior: { name: 'Warrior', value: 6, description: '' },
          headhunter: { name: 'Headhunter', value: 15, description: '' }
        },
        stats: { winRate: 0.667, avgCPPerRound: 12, spSpentPerRound: 4, hexesPerRound: 1.2 }
      }

      savePerformanceRecord(older)
      savePerformanceRecord(newer)

      const history = loadPerformanceHistory()

      // WHY: Newest should be first
      expect(history.campaigns[0].campaignId).toBe('newer')
      expect(history.campaigns[1].campaignId).toBe('older')
    })

    it('should update lastUpdated timestamp', () => {
      const record: SoloPerformanceRecord = {
        campaignId: 'campaign-1',
        date: '2025-01-15T10:00:00Z',
        success: true,
        finalCP: 100,
        finalThreat: 10,
        rounds: 10,
        categories: {
          pioneer: { name: 'Pioneer', value: 30, description: '' },
          explorer: { name: 'Explorer', value: 10, description: '' },
          trooper: { name: 'Trooper', value: 8, description: '' },
          warrior: { name: 'Warrior', value: 5, description: '' },
          headhunter: { name: 'Headhunter', value: 12, description: '' }
        },
        stats: { winRate: 0.625, avgCPPerRound: 10, spSpentPerRound: 3, hexesPerRound: 1 }
      }

      const beforeSave = new Date().toISOString()
      savePerformanceRecord(record)
      const afterSave = new Date().toISOString()

      const history = loadPerformanceHistory()

      expect(history.lastUpdated).toBeDefined()
      expect(history.lastUpdated >= beforeSave).toBe(true)
      expect(history.lastUpdated <= afterSave).toBe(true)
    })
  })

  describe('clearPerformanceHistory', () => {
    it('should remove all history from localStorage', () => {
      const record: SoloPerformanceRecord = {
        campaignId: 'campaign-1',
        date: '2025-01-15T10:00:00Z',
        success: true,
        finalCP: 100,
        finalThreat: 10,
        rounds: 10,
        categories: {
          pioneer: { name: 'Pioneer', value: 30, description: '' },
          explorer: { name: 'Explorer', value: 10, description: '' },
          trooper: { name: 'Trooper', value: 8, description: '' },
          warrior: { name: 'Warrior', value: 5, description: '' },
          headhunter: { name: 'Headhunter', value: 12, description: '' }
        },
        stats: { winRate: 0.625, avgCPPerRound: 10, spSpentPerRound: 3, hexesPerRound: 1 }
      }

      savePerformanceRecord(record)

      let history = loadPerformanceHistory()
      expect(history.campaigns).toHaveLength(1)

      clearPerformanceHistory()

      history = loadPerformanceHistory()
      expect(history.campaigns).toEqual([])
      expect(history.personalBests.highestCP).toBeNull()
    })

    it('should be safe to call on empty history', () => {
      expect(() => clearPerformanceHistory()).not.toThrow()

      const history = loadPerformanceHistory()
      expect(history.campaigns).toEqual([])
    })
  })
})
