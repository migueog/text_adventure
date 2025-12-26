import { describe, it, expect } from 'vitest'
import {
  calculateTotalHexesExplored,
  calculateTotalBattles,
  generateNarrativeSummary
} from './campaignStatistics'
import type { Hex, Player } from '@/types/campaign'

describe('campaignStatistics', () => {
  describe('calculateTotalHexesExplored', () => {
    it('should count unique explored hexes', () => {
      const hexMap: Record<string, Hex> = {
        '0,0': { id: '0,0', row: 0, col: 0, explored: true, type: 'surface', location: 0, condition: 0, exploredBy: [0] },
        '0,1': { id: '0,1', row: 0, col: 1, explored: true, type: 'surface', location: 0, condition: 0, exploredBy: [0] },
        '1,0': { id: '1,0', row: 1, col: 0, explored: false, type: 'tomb', location: 0, condition: 0, exploredBy: [] },
        '1,1': { id: '1,1', row: 1, col: 1, explored: true, type: 'tomb', location: 0, condition: 0, exploredBy: [0] }
      }

      const result = calculateTotalHexesExplored(hexMap)

      expect(result).toBe(3)
    })

    it('should return 0 when no hexes are explored', () => {
      const hexMap: Record<string, Hex> = {
        '0,0': { id: '0,0', row: 0, col: 0, explored: false, type: 'surface', location: 0, condition: 0, exploredBy: [] },
        '0,1': { id: '0,1', row: 0, col: 1, explored: false, type: 'tomb', location: 0, condition: 0, exploredBy: [] }
      }

      const result = calculateTotalHexesExplored(hexMap)

      expect(result).toBe(0)
    })

    it('should handle empty hex map', () => {
      const hexMap: Record<string, Hex> = {}

      const result = calculateTotalHexesExplored(hexMap)

      expect(result).toBe(0)
    })
  })

  describe('calculateTotalBattles', () => {
    it('should sum gamesPlayed across all players', () => {
      const players: Player[] = [
        {
          id: 0,
          name: 'Player 1',
          killTeamName: 'Team 1',
          color: '#ff0000',
          position: { row: 0, col: 0 },
          supplyPoints: 5,
          campaignPoints: 3,
          operativesKilled: 2,
          gamesPlayed: 5,
          gamesWon: 3,
          gamesLost: 2,
          exploredHexes: 10,
          bases: [],
          camps: [],
          history: [],
          priority: 1
        },
        {
          id: 1,
          name: 'Player 2',
          killTeamName: 'Team 2',
          color: '#00ff00',
          position: { row: 1, col: 1 },
          supplyPoints: 3,
          campaignPoints: 2,
          operativesKilled: 1,
          gamesPlayed: 4,
          gamesWon: 2,
          gamesLost: 2,
          exploredHexes: 8,
          bases: [],
          camps: [],
          history: [],
          priority: 2
        }
      ]

      const result = calculateTotalBattles(players)

      expect(result).toBe(9)
    })

    it('should return 0 when no players exist', () => {
      const players: Player[] = []

      const result = calculateTotalBattles(players)

      expect(result).toBe(0)
    })

    it('should return 0 when no battles played', () => {
      const players: Player[] = [
        {
          id: 0,
          name: 'Player 1',
          killTeamName: 'Team 1',
          color: '#ff0000',
          position: { row: 0, col: 0 },
          supplyPoints: 5,
          campaignPoints: 0,
          operativesKilled: 0,
          gamesPlayed: 0,
          gamesWon: 0,
          gamesLost: 0,
          exploredHexes: 5,
          bases: [],
          camps: [],
          history: [],
          priority: 1
        }
      ]

      const result = calculateTotalBattles(players)

      expect(result).toBe(0)
    })
  })

  describe('generateNarrativeSummary', () => {
    const winner: Player = {
      id: 0,
      name: 'Commander Rex',
      killTeamName: 'Death Watch',
      color: '#ff0000',
      position: { row: 0, col: 0 },
      supplyPoints: 5,
      campaignPoints: 10,
      operativesKilled: 15,
      gamesPlayed: 12,
      gamesWon: 8,
      gamesLost: 4,
      exploredHexes: 20,
      bases: [],
      camps: [],
      history: [],
      priority: 1
    }

    it('should generate summary for Warlord victory', () => {
      const result = generateNarrativeSummary(winner, 'Warlord')

      expect(result).toContain('Commander Rex')
      expect(result).toContain('Death Watch')
      expect(result.length).toBeGreaterThan(50)
    })

    it('should generate summary for Explorer victory', () => {
      const result = generateNarrativeSummary(winner, 'Explorer')

      expect(result).toContain('Commander Rex')
      expect(result).toContain('Death Watch')
      expect(result.length).toBeGreaterThan(50)
    })

    it('should generate summary for Headhunter victory', () => {
      const result = generateNarrativeSummary(winner, 'Headhunter')

      expect(result).toContain('Commander Rex')
      expect(result).toContain('Death Watch')
      expect(result.length).toBeGreaterThan(50)
    })

    it('should generate summary for Pioneer victory', () => {
      const result = generateNarrativeSummary(winner, 'Pioneer')

      expect(result).toContain('Commander Rex')
      expect(result).toContain('Death Watch')
      expect(result.length).toBeGreaterThan(50)
    })

    it('should generate summary for Trooper victory', () => {
      const result = generateNarrativeSummary(winner, 'Trooper')

      expect(result).toContain('Commander Rex')
      expect(result).toContain('Death Watch')
      expect(result.length).toBeGreaterThan(50)
    })

    it('should generate generic summary for unknown category', () => {
      const result = generateNarrativeSummary(winner, 'Unknown')

      expect(result).toContain('Commander Rex')
      expect(result).toContain('Death Watch')
      expect(result.length).toBeGreaterThan(30)
    })
  })
})
