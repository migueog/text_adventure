import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateExportData,
  exportCampaignJSON,
  type CampaignExport
} from './campaignExport'
import type { Player, Event, Hex } from '@/types/campaign'

describe('campaignExport', () => {
  describe('generateExportData', () => {
    const mockPlayers: Player[] = [
      {
        id: 0,
        name: 'Player 1',
        killTeamName: 'Team 1',
        color: '#ff0000',
        position: { row: 0, col: 0 },
        supplyPoints: 5,
        campaignPoints: 10,
        operativesKilled: 5,
        gamesPlayed: 8,
        gamesWon: 5,
        gamesLost: 3,
        exploredHexes: 12,
        bases: [{ row: 0, col: 0 }],
        camps: [],
        history: [],
        priority: 1
      }
    ]

    const mockEvents: Event[] = [
      { message: 'Game started', type: 'system', round: 1, icon: 'ℹ️', phase: 'Movement', timestamp: '12:00:00' },
      { message: 'Player moved', type: 'movement', round: 1, icon: '➡️', phase: 'Movement', timestamp: '12:01:00' }
    ]

    const mockHexMap: Record<string, Hex> = {
      '0,0': { id: '0,0', row: 0, col: 0, explored: true, type: 'surface', location: 0, condition: 0, exploredBy: [0] }
    }

    const mockVictoryCategories = {
      Warlord: 'Player 1',
      Explorer: 'Player 1',
      Headhunter: 'Player 1',
      Pioneer: 'Player 1',
      Trooper: 'Player 1'
    }

    it('should include version field', () => {
      const result = generateExportData(
        7, 10, 5, 'movement', mockHexMap,
        mockPlayers, mockEvents,
        mockVictoryCategories, 'Player 1'
      )

      expect(result.version).toBe('1.0.0')
    })

    it('should include exportedAt timestamp', () => {
      const before = new Date().toISOString()

      const result = generateExportData(
        7, 10, 5, 'movement', mockHexMap,
        mockPlayers, mockEvents,
        mockVictoryCategories, 'Player 1'
      )

      const after = new Date().toISOString()

      expect(result.exportedAt).toBeDefined()
      expect(result.exportedAt >= before).toBe(true)
      expect(result.exportedAt <= after).toBe(true)
    })

    it('should include all campaign data', () => {
      const result = generateExportData(
        7, 10, 5, 'movement', mockHexMap,
        mockPlayers, mockEvents,
        mockVictoryCategories, 'Player 1'
      )

      expect(result.campaign.threatLevel).toBe(7)
      expect(result.campaign.targetThreatLevel).toBe(10)
      expect(result.campaign.currentRound).toBe(5)
      expect(result.campaign.currentPhase).toBe('movement')
      expect(result.campaign.hexMap).toEqual(mockHexMap)
    })

    it('should include players array', () => {
      const result = generateExportData(
        7, 10, 5, 'movement', mockHexMap,
        mockPlayers, mockEvents,
        mockVictoryCategories, 'Player 1'
      )

      expect(result.players).toEqual(mockPlayers)
      expect(result.players.length).toBe(1)
    })

    it('should include events array', () => {
      const result = generateExportData(
        7, 10, 5, 'movement', mockHexMap,
        mockPlayers, mockEvents,
        mockVictoryCategories, 'Player 1'
      )

      expect(result.events).toEqual(mockEvents)
      expect(result.events.length).toBe(2)
    })

    it('should include victory data', () => {
      const result = generateExportData(
        7, 10, 5, 'movement', mockHexMap,
        mockPlayers, mockEvents,
        mockVictoryCategories, 'Player 1'
      )

      expect(result.victoryData.categories).toEqual(mockVictoryCategories)
      expect(result.victoryData.champion).toBe('Player 1')
    })
  })

  describe('exportCampaignJSON', () => {
    let createElementSpy: ReturnType<typeof vi.spyOn>
    let createObjectURLSpy: ReturnType<typeof vi.spyOn>
    let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>
    let mockAnchor: any

    beforeEach(() => {
      mockAnchor = {
        href: '',
        download: '',
        click: vi.fn()
      }

      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    })

    afterEach(() => {
      createElementSpy.mockRestore()
      createObjectURLSpy.mockRestore()
      revokeObjectURLSpy.mockRestore()
    })

    it('should create blob with JSON data', () => {
      const mockExport: CampaignExport = {
        version: '1.0.0',
        exportedAt: '2025-01-26T15:00:00.000Z',
        campaign: {
          threatLevel: 7,
          targetThreatLevel: 10,
          currentRound: 5,
          currentPhase: 'movement',
          hexMap: {}
        },
        players: [],
        events: [],
        victoryData: {
          categories: {},
          champion: 'Player 1'
        }
      }

      exportCampaignJSON(mockExport)

      expect(createObjectURLSpy).toHaveBeenCalled()
      const blob = createObjectURLSpy.mock.calls[0][0] as Blob
      expect(blob.type).toBe('application/json')
    })

    it('should trigger download with correct filename pattern', () => {
      const mockExport: CampaignExport = {
        version: '1.0.0',
        exportedAt: '2025-01-26T15:30:45.123Z',
        campaign: {
          threatLevel: 7,
          targetThreatLevel: 10,
          currentRound: 5,
          currentPhase: 'movement',
          hexMap: {}
        },
        players: [],
        events: [],
        victoryData: {
          categories: {},
          champion: 'Player 1'
        }
      }

      exportCampaignJSON(mockExport)

      expect(mockAnchor.download).toMatch(/^campaign_export_\d{8}_\d{6}\.json$/)
    })

    it('should call anchor click to trigger download', () => {
      const mockExport: CampaignExport = {
        version: '1.0.0',
        exportedAt: '2025-01-26T15:00:00.000Z',
        campaign: {
          threatLevel: 7,
          targetThreatLevel: 10,
          currentRound: 5,
          currentPhase: 'movement',
          hexMap: {}
        },
        players: [],
        events: [],
        victoryData: {
          categories: {},
          champion: 'Player 1'
        }
      }

      exportCampaignJSON(mockExport)

      expect(mockAnchor.click).toHaveBeenCalled()
    })

    it('should clean up object URL after download', () => {
      const mockExport: CampaignExport = {
        version: '1.0.0',
        exportedAt: '2025-01-26T15:00:00.000Z',
        campaign: {
          threatLevel: 7,
          targetThreatLevel: 10,
          currentRound: 5,
          currentPhase: 'movement',
          hexMap: {}
        },
        players: [],
        events: [],
        victoryData: {
          categories: {},
          champion: 'Player 1'
        }
      }

      exportCampaignJSON(mockExport)

      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
    })
  })
})
