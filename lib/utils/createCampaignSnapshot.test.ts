/**
 * WHY: Issue #57 - Tests for campaign snapshot creation
 * TDD: Write tests first before implementation
 */

import { describe, it, expect } from 'vitest'
import { buildCampaignSnapshot } from './createCampaignSnapshot'
import type { CampaignState, Player, Hex } from '@/types/campaign'

describe('createCampaignSnapshot', () => {
  describe('buildCampaignSnapshot', () => {
    const mockPlayer: Player = {
      id: 1,
      name: 'Player 1',
      killTeamName: 'Blood Ravens',
      faction: 'Space Marines',
      backstory: 'Elite veterans of the Blood Ravens chapter',
      color: '#ff0000',
      supplyPoints: 5,
      campaignPoints: 11,
      position: { row: 0, col: 2 },
      bases: [{ row: 0, col: 2 }],
      camps: [{ row: 1, col: 3 }],
      exploredHexes: 3,
      gamesPlayed: 8,
      gamesWon: 5,
      gamesLost: 3,
      operativesKilled: 12,
      history: [],
      battleResult: null,
      searchedHexes: ['0,2', '1,1'],
      battleHistory: []
    }

    const mockHexes: Record<string, Hex> = {
      '0,2': {
        id: '0,2',
        row: 0,
        col: 2,
        type: 'surface',
        explored: true,
        location: 25,
        condition: 21,
        exploredBy: [1],
        exploredLocation: 'SL25',
        exploredCondition: 'SC21'
      },
      '1,1': {
        id: '1,1',
        row: 1,
        col: 1,
        type: 'surface',
        explored: true,
        location: 16,
        condition: 16,
        exploredBy: [1],
        exploredLocation: 'SL11-16',
        exploredCondition: 'SC11-16'
      },
      '1,3': {
        id: '1,3',
        row: 1,
        col: 3,
        type: 'surface',
        explored: true,
        location: 26,
        condition: 22,
        exploredBy: [1],
        exploredLocation: 'SL26',
        exploredCondition: 'SC22'
      },
      '2,2': {
        id: '2,2',
        row: 2,
        col: 2,
        type: 'tomb',
        explored: false,
        location: 0,
        condition: 0,
        exploredBy: []
      }
    }

    const mockState: CampaignState = {
      gameStarted: true,
      gameEnded: true,
      soloMode: true,
      currentRound: 12,
      currentPhase: 'Threat',
      currentPlayerIndex: 0,
      threatLevel: 10,
      targetThreatLevel: 10,
      selectedHex: null,
      players: [mockPlayer],
      hexes: mockHexes,
      mapConfig: {
        name: '5×5 Small Map',
        rows: 5,
        cols: 5,
        surfaceRows: 3,
        tombRows: 2
      },
      eventLog: [],
      soloVictory: true
    }

    it('should create campaign snapshot with all required fields', () => {
      const snapshot = buildCampaignSnapshot(mockState, mockPlayer)

      expect(snapshot.campaignId).toBeDefined()
      expect(snapshot.campaignName).toBeDefined()
      expect(snapshot.playerName).toBe('Player 1')
      expect(snapshot.killTeamName).toBe('Blood Ravens')
      expect(snapshot.faction).toBe('Space Marines')
      expect(snapshot.backstory).toBe('Elite veterans of the Blood Ravens chapter')
      expect(snapshot.mapSize).toEqual({ rows: 5, cols: 5 })
      expect(snapshot.finalCP).toBe(11)
      expect(snapshot.finalThreat).toBe(10)
      expect(snapshot.rounds).toBe(12)
      expect(snapshot.success).toBe(true)
      expect(snapshot.completedDate).toBeDefined()
      expect(snapshot.targetThreatLevel).toBe(10)
    })

    it('should extract only explored hexes', () => {
      const snapshot = buildCampaignSnapshot(mockState, mockPlayer)

      expect(snapshot.exploredHexes).toHaveLength(3)

      const hexIds = snapshot.exploredHexes.map(h => h.hexId)
      expect(hexIds).toContain('0,2')
      expect(hexIds).toContain('1,1')
      expect(hexIds).toContain('1,3')
      expect(hexIds).not.toContain('2,2') // Unexplored hex not included
    })

    it('should include hex location and condition data', () => {
      const snapshot = buildCampaignSnapshot(mockState, mockPlayer)

      const baseHex = snapshot.exploredHexes.find(h => h.hexId === '0,2')
      expect(baseHex).toBeDefined()
      expect(baseHex?.row).toBe(0)
      expect(baseHex?.col).toBe(2)
      expect(baseHex?.type).toBe('surface')
      expect(baseHex?.locationNumber).toBe(25)
      expect(baseHex?.conditionNumber).toBe(21)
      expect(baseHex?.locationId).toBe('SL25')
      expect(baseHex?.conditionId).toBe('SC21')
    })

    it('should mark searched hexes correctly', () => {
      const snapshot = buildCampaignSnapshot(mockState, mockPlayer)

      const searchedHex = snapshot.exploredHexes.find(h => h.hexId === '0,2')
      expect(searchedHex?.searched).toBe(true)

      const unsearchedHex = snapshot.exploredHexes.find(h => h.hexId === '1,3')
      expect(unsearchedHex?.searched).toBe(false)
    })

    it('should mark camped hexes correctly', () => {
      const snapshot = buildCampaignSnapshot(mockState, mockPlayer)

      const campHex = snapshot.exploredHexes.find(h => h.hexId === '1,3')
      expect(campHex?.camped).toBe(true)

      const baseHex = snapshot.exploredHexes.find(h => h.hexId === '0,2')
      expect(baseHex?.camped).toBe(false)
    })

    it('should preserve hex state for special locations', () => {
      const mockStateWithPortal: CampaignState = {
        ...mockState,
        hexes: {
          ...mockHexes,
          '1,1': {
            ...mockHexes['1,1'],
            state: {
              portalDestinations: {
                tomb: '3-2',
                surface: '0-1'
              }
            }
          }
        }
      }

      const snapshot = buildCampaignSnapshot(mockStateWithPortal, mockPlayer)

      const portalHex = snapshot.exploredHexes.find(h => h.hexId === '1,1')
      expect(portalHex?.state).toBeDefined()
      expect(portalHex?.state?.portalDestinations).toEqual({
        tomb: '3-2',
        surface: '0-1'
      })
    })

    it('should handle missing optional fields gracefully', () => {
      const playerWithoutNarrative: Player = {
        ...mockPlayer,
        faction: undefined,
        backstory: undefined
      }

      const snapshot = buildCampaignSnapshot(mockState, playerWithoutNarrative)

      expect(snapshot.faction).toBeUndefined()
      expect(snapshot.backstory).toBeUndefined()
    })

    it('should generate campaign ID with timestamp format', () => {
      const snapshot = buildCampaignSnapshot(mockState, mockPlayer)

      expect(snapshot.campaignId).toMatch(/^campaign-\d+$/)
      // WHY: Timestamp-based ID ensures uniqueness in real use
      expect(snapshot.campaignId).toContain('campaign-')
    })

    it('should use ISO 8601 timestamp for completedDate', () => {
      const snapshot = buildCampaignSnapshot(mockState, mockPlayer)

      // Check format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(snapshot.completedDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
    })

    it('should handle empty exploredHexes array', () => {
      const stateWithNoExploration: CampaignState = {
        ...mockState,
        hexes: {
          '0,0': {
            id: '0,0',
            row: 0,
            col: 0,
            type: 'surface',
            explored: false,
            location: 0,
            condition: 0,
            exploredBy: []
          }
        }
      }

      const snapshot = buildCampaignSnapshot(stateWithNoExploration, mockPlayer)

      expect(snapshot.exploredHexes).toEqual([])
    })

    it('should mark base hex correctly (from bases array)', () => {
      const snapshot = buildCampaignSnapshot(mockState, mockPlayer)

      const baseHex = snapshot.exploredHexes.find(h => h.hexId === '0,2')
      // Base hex should NOT be marked as camped (bases are separate from camps)
      expect(baseHex?.camped).toBe(false)
    })
  })
})
