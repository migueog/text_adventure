/**
 * WHY: Issue #56 - Integration tests for solo performance tracking
 * Tests the complete flow from campaign end to history display
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VictoryScreen from '@/components/VictoryScreen'
import { buildPerformanceRecord, updatePersonalBests, createEmptyPersonalBests } from '@/lib/utils/performanceCalculations'
import { savePerformanceRecord, loadPerformanceHistory, clearPerformanceHistory } from '@/lib/utils/performanceStorage'
import type { Player } from '@/types/campaign'
import type { SoloPerformanceHistory } from '@/types/soloPerformance'

// WHY: Mock localStorage for integration testing
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

global.localStorage = mockLocalStorage as Storage

describe('Solo Performance Tracking - Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('complete campaign flow', () => {
    it('should save performance record when solo campaign ends', () => {
      // WHY: Simulate player completing a solo campaign
      const player: Player = {
        id: 'player-1',
        name: 'Test Player',
        faction: 'Test Faction',
        campaignPoints: 120,
        supplyPoints: 3,
        supplyPointsSpent: 40,
        exploredHexes: 12,
        gamesPlayed: 10,
        gamesWon: 7,
        currentHex: { q: 0, r: 0 },
        operativeKillDetails: [
          { operativeName: 'Op1', wounds: 5 },
          { operativeName: 'Op2', wounds: 3 }
        ],
        moveHistory: []
      }

      const campaignId = 'test-campaign-1'
      const record = buildPerformanceRecord(
        campaignId,
        true,
        10,
        12,
        player
      )

      savePerformanceRecord(record)

      // WHY: Verify record was saved to localStorage
      const history = loadPerformanceHistory()
      expect(history.campaigns).toHaveLength(1)
      expect(history.campaigns[0].campaignId).toBe(campaignId)
      expect(history.campaigns[0].success).toBe(true)
      expect(history.campaigns[0].finalCP).toBe(120)
      expect(history.campaigns[0].categories.pioneer.value).toBe(40)
      expect(history.campaigns[0].categories.headhunter.value).toBe(8) // 5 + 3
    })

    it('should update personal bests across multiple campaigns', () => {
      // WHY: Simulate multiple campaigns with different achievements
      const player1: Player = {
        id: 'player-1',
        name: 'Player 1',
        faction: 'Faction A',
        campaignPoints: 100,
        supplyPoints: 2,
        supplyPointsSpent: 30,
        exploredHexes: 10,
        gamesPlayed: 8,
        gamesWon: 5,
        currentHex: { q: 0, r: 0 },
        operativeKillDetails: [{ operativeName: 'Op1', wounds: 10 }],
        moveHistory: []
      }

      const player2: Player = {
        ...player1,
        campaignPoints: 150,
        supplyPointsSpent: 50,
        exploredHexes: 15,
        gamesPlayed: 12,
        gamesWon: 8,
        operativeKillDetails: [{ operativeName: 'Op1', wounds: 20 }]
      }

      const player3: Player = {
        ...player1,
        campaignPoints: 130,
        supplyPointsSpent: 35,
        exploredHexes: 20, // Highest hexes
        gamesPlayed: 10,
        gamesWon: 9, // Highest wins
        operativeKillDetails: [{ operativeName: 'Op1', wounds: 15 }]
      }

      savePerformanceRecord(buildPerformanceRecord('campaign-1', true, 10, 12, player1))
      savePerformanceRecord(buildPerformanceRecord('campaign-2', true, 10, 10, player2))
      savePerformanceRecord(buildPerformanceRecord('campaign-3', true, 10, 11, player3))

      const history = loadPerformanceHistory()

      // WHY: Verify personal bests were tracked correctly
      expect(history.personalBests.highestCP?.value).toBe(150)
      expect(history.personalBests.highestCP?.campaignId).toBe('campaign-2')

      expect(history.personalBests.mostSPSpent?.value).toBe(50)
      expect(history.personalBests.mostSPSpent?.campaignId).toBe('campaign-2')

      expect(history.personalBests.mostHexesExplored?.value).toBe(20)
      expect(history.personalBests.mostHexesExplored?.campaignId).toBe('campaign-3')

      expect(history.personalBests.mostGamesWon?.value).toBe(9)
      expect(history.personalBests.mostGamesWon?.campaignId).toBe('campaign-3')

      expect(history.personalBests.mostOperatives?.value).toBe(20)
      expect(history.personalBests.mostOperatives?.campaignId).toBe('campaign-2')

      // WHY: Shortest victory should be campaign-2 (10 rounds)
      expect(history.personalBests.shortestVictory?.value).toBe(10)
      expect(history.personalBests.shortestVictory?.campaignId).toBe('campaign-2')
    })

    it('should not update victory-specific bests for failed campaigns', () => {
      const successPlayer: Player = {
        id: 'player-1',
        name: 'Player 1',
        faction: 'Faction A',
        campaignPoints: 100,
        supplyPoints: 2,
        supplyPointsSpent: 30,
        exploredHexes: 10,
        gamesPlayed: 8,
        gamesWon: 5,
        currentHex: { q: 0, r: 0 },
        operativeKillDetails: [],
        moveHistory: []
      }

      const failurePlayer: Player = {
        ...successPlayer,
        campaignPoints: 80
      }

      // WHY: Save successful campaign first
      savePerformanceRecord(buildPerformanceRecord('success-1', true, 10, 15, successPlayer))

      // WHY: Save failed campaign with fewer rounds
      savePerformanceRecord(buildPerformanceRecord('failure-1', false, 10, 8, failurePlayer))

      const history = loadPerformanceHistory()

      // WHY: Shortest victory should still be 15 (from successful campaign)
      // Not 8 (from failed campaign)
      expect(history.personalBests.shortestVictory?.value).toBe(15)
      expect(history.personalBests.shortestVictory?.campaignId).toBe('success-1')
    })
  })

  describe('VictoryScreen integration', () => {
    it('should display performance categories on victory screen', () => {
      const player: Player = {
        id: 'player-1',
        name: 'Solo Player',
        faction: 'Test Faction',
        campaignPoints: 120,
        supplyPoints: 3,
        supplyPointsSpent: 40,
        exploredHexes: 12,
        gamesPlayed: 10,
        gamesWon: 7,
        currentHex: { q: 0, r: 0 },
        operativeKillDetails: [
          { operativeName: 'Op1', wounds: 5 },
          { operativeName: 'Op2', wounds: 3 }
        ],
        moveHistory: []
      }

      render(
        <VictoryScreen
          players={[player]}
          onRestart={vi.fn()}
          currentRound={12}
          threatLevel={10}
          soloMode={true}
          soloVictory={true}
        />
      )

      // WHY: Verify all 5 performance categories are displayed
      expect(screen.getByText(/pioneer/i)).toBeInTheDocument()
      expect(screen.getByText(/explorer/i)).toBeInTheDocument()
      expect(screen.getByText(/trooper/i)).toBeInTheDocument()
      expect(screen.getByText(/warrior/i)).toBeInTheDocument()
      expect(screen.getByText(/headhunter/i)).toBeInTheDocument()

      // WHY: Verify category values
      expect(screen.getByText(/40.*sp spent/i)).toBeInTheDocument()
      expect(screen.getByText(/12.*hexes/i)).toBeInTheDocument()
      expect(screen.getByText(/10.*battles/i)).toBeInTheDocument()
      expect(screen.getByText(/7.*victories/i)).toBeInTheDocument()
    })

    it('should show "first campaign" message when no history exists', () => {
      const player: Player = {
        id: 'player-1',
        name: 'Solo Player',
        faction: 'Test Faction',
        campaignPoints: 100,
        supplyPoints: 5,
        supplyPointsSpent: 20,
        exploredHexes: 8,
        gamesPlayed: 6,
        gamesWon: 4,
        currentHex: { q: 0, r: 0 },
        operativeKillDetails: [],
        moveHistory: []
      }

      render(
        <VictoryScreen
          players={[player]}
          onRestart={vi.fn()}
          currentRound={10}
          threatLevel={10}
          soloMode={true}
          soloVictory={true}
        />
      )

      // WHY: All comparisons should say "First campaign!"
      const firstCampaignTexts = screen.getAllByText(/first campaign!/i)
      expect(firstCampaignTexts.length).toBeGreaterThan(0)
    })

    it('should show performance history button when campaigns exist', () => {
      // WHY: Save a campaign to localStorage
      const player: Player = {
        id: 'player-1',
        name: 'Previous Player',
        faction: 'Faction A',
        campaignPoints: 80,
        supplyPoints: 4,
        supplyPointsSpent: 15,
        exploredHexes: 6,
        gamesPlayed: 5,
        gamesWon: 3,
        currentHex: { q: 0, r: 0 },
        operativeKillDetails: [],
        moveHistory: []
      }

      savePerformanceRecord(buildPerformanceRecord('previous-1', true, 10, 10, player))

      // WHY: Render VictoryScreen with new campaign
      const newPlayer: Player = {
        ...player,
        campaignPoints: 100
      }

      render(
        <VictoryScreen
          players={[newPlayer]}
          onRestart={vi.fn()}
          currentRound={12}
          threatLevel={10}
          soloMode={true}
          soloVictory={true}
        />
      )

      // WHY: Button should show with campaign count
      expect(screen.getByText(/view performance history/i)).toBeInTheDocument()
      expect(screen.getByText(/1 campaign/i)).toBeInTheDocument()
    })
  })

  describe('personal bests logic', () => {
    it('should handle tied records correctly', () => {
      const player1: Player = {
        id: 'player-1',
        name: 'Player 1',
        faction: 'Faction A',
        campaignPoints: 100,
        supplyPoints: 3,
        supplyPointsSpent: 30,
        exploredHexes: 10,
        gamesPlayed: 8,
        gamesWon: 5,
        currentHex: { q: 0, r: 0 },
        operativeKillDetails: [],
        moveHistory: []
      }

      const player2: Player = {
        ...player1,
        campaignPoints: 100 // Same CP
      }

      savePerformanceRecord(buildPerformanceRecord('campaign-1', true, 10, 10, player1))
      savePerformanceRecord(buildPerformanceRecord('campaign-2', true, 10, 10, player2))

      const history = loadPerformanceHistory()

      // WHY: First campaign to achieve the record should hold it
      expect(history.personalBests.highestCP?.campaignId).toBe('campaign-1')
    })

    it('should update bests incrementally', () => {
      let bests = createEmptyPersonalBests()

      const record1 = buildPerformanceRecord(
        'c1',
        true,
        10,
        10,
        {
          id: '1',
          name: 'P1',
          faction: 'F1',
          campaignPoints: 100,
          supplyPoints: 3,
          supplyPointsSpent: 20,
          exploredHexes: 5,
          gamesPlayed: 5,
          gamesWon: 3,
          currentHex: { q: 0, r: 0 },
          operativeKillDetails: [],
          moveHistory: []
        }
      )

      bests = updatePersonalBests(bests, record1)
      expect(bests.highestCP?.value).toBe(100)

      const record2 = buildPerformanceRecord(
        'c2',
        true,
        10,
        8,
        {
          id: '2',
          name: 'P2',
          faction: 'F2',
          campaignPoints: 150,
          supplyPoints: 2,
          supplyPointsSpent: 30,
          exploredHexes: 10,
          gamesPlayed: 8,
          gamesWon: 6,
          currentHex: { q: 0, r: 0 },
          operativeKillDetails: [],
          moveHistory: []
        }
      )

      bests = updatePersonalBests(bests, record2)
      expect(bests.highestCP?.value).toBe(150)
      expect(bests.shortestVictory?.value).toBe(8)
    })
  })

  describe('edge cases', () => {
    it('should handle localStorage quota gracefully', () => {
      // WHY: Simulate many campaigns
      const player: Player = {
        id: 'player-1',
        name: 'Player',
        faction: 'Faction',
        campaignPoints: 100,
        supplyPoints: 3,
        supplyPointsSpent: 20,
        exploredHexes: 10,
        gamesPlayed: 8,
        gamesWon: 5,
        currentHex: { q: 0, r: 0 },
        operativeKillDetails: [],
        moveHistory: []
      }

      // WHY: Save 50 campaigns
      for (let i = 0; i < 50; i++) {
        savePerformanceRecord(buildPerformanceRecord(`campaign-${i}`, true, 10, 10, player))
      }

      const history = loadPerformanceHistory()
      expect(history.campaigns).toHaveLength(50)
    })

    it('should recover from corrupted localStorage', () => {
      // WHY: Corrupt the stored data
      localStorage.setItem('ctesiphus-solo-performance', 'invalid json {{{')

      const history = loadPerformanceHistory()

      // WHY: Should return empty history instead of crashing
      expect(history.campaigns).toEqual([])
      expect(history.personalBests.highestCP).toBeNull()
    })

    it('should handle clearing all history', () => {
      const player: Player = {
        id: 'player-1',
        name: 'Player',
        faction: 'Faction',
        campaignPoints: 100,
        supplyPoints: 3,
        supplyPointsSpent: 20,
        exploredHexes: 10,
        gamesPlayed: 8,
        gamesWon: 5,
        currentHex: { q: 0, r: 0 },
        operativeKillDetails: [],
        moveHistory: []
      }

      savePerformanceRecord(buildPerformanceRecord('campaign-1', true, 10, 10, player))
      savePerformanceRecord(buildPerformanceRecord('campaign-2', true, 10, 12, player))

      let history = loadPerformanceHistory()
      expect(history.campaigns).toHaveLength(2)

      clearPerformanceHistory()

      history = loadPerformanceHistory()
      expect(history.campaigns).toEqual([])
      expect(history.personalBests.highestCP).toBeNull()
    })

    it('should handle zero values correctly', () => {
      const player: Player = {
        id: 'player-1',
        name: 'Player',
        faction: 'Faction',
        campaignPoints: 0,
        supplyPoints: 0,
        supplyPointsSpent: 0,
        exploredHexes: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        currentHex: { q: 0, r: 0 },
        operativeKillDetails: [],
        moveHistory: []
      }

      const record = buildPerformanceRecord('zero-campaign', false, 10, 5, player)

      expect(record.categories.pioneer.value).toBe(0)
      expect(record.categories.explorer.value).toBe(0)
      expect(record.categories.trooper.value).toBe(0)
      expect(record.categories.warrior.value).toBe(0)
      expect(record.categories.headhunter.value).toBe(0)
      expect(record.stats.winRate).toBe(0)
    })
  })

  describe('chronological ordering', () => {
    it('should maintain campaigns in newest-first order', () => {
      const player: Player = {
        id: 'player-1',
        name: 'Player',
        faction: 'Faction',
        campaignPoints: 100,
        supplyPoints: 3,
        supplyPointsSpent: 20,
        exploredHexes: 10,
        gamesPlayed: 8,
        gamesWon: 5,
        currentHex: { q: 0, r: 0 },
        operativeKillDetails: [],
        moveHistory: []
      }

      // WHY: Save campaigns with slight delays to ensure different timestamps
      savePerformanceRecord(buildPerformanceRecord('old-campaign', true, 10, 10, player))
      savePerformanceRecord(buildPerformanceRecord('mid-campaign', true, 10, 11, player))
      savePerformanceRecord(buildPerformanceRecord('new-campaign', true, 10, 12, player))

      const history = loadPerformanceHistory()

      // WHY: Newest should be first
      expect(history.campaigns[0].campaignId).toBe('new-campaign')
      expect(history.campaigns[1].campaignId).toBe('mid-campaign')
      expect(history.campaigns[2].campaignId).toBe('old-campaign')
    })
  })
})
