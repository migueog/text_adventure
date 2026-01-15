/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useImportExport } from './useImportExport'
import type { Player, Event, Hex, CampaignAuditLog } from '@/types/campaign'
import type { CampaignExport } from '@/lib/utils/campaignExport'

/**
 * WHY: Test-Driven Development for useImportExport hook
 * Tests campaign export/import functionality (Issue #23)
 */

// Mock campaign export utilities
vi.mock('@/lib/utils/campaignExport', () => ({
  generateExportData: vi.fn((threatLevel, targetThreatLevel, currentRound, currentPhase, hexMap, players, events, victoryCategories, champion, auditLog) => ({
    version: '1.0.0',
    exportedAt: '2024-01-01T00:00:00.000Z',
    campaign: {
      threatLevel,
      targetThreatLevel,
      currentRound,
      currentPhase,
      hexMap
    },
    players,
    events,
    victoryData: {
      categories: victoryCategories,
      champion
    },
    auditLog
  })),
  exportCampaignJSON: vi.fn(),
}))

describe('useImportExport', () => {
  // Mock data
  const mockPlayers: Player[] = [
    {
      id: 0,
      name: 'Alice',
      killTeamName: 'Test Team',
      color: '#FF0000',
      supplyPoints: 7,
      campaignPoints: 5,
      position: { row: 0, col: 0 },
      bases: [{ row: 0, col: 0 }],
      camps: [],
      exploredHexes: 3,
      operativesKilled: 2,
      gamesPlayed: 2,
      gamesWon: 1,
      gamesLost: 1,
      history: [],
      supplyPointsSpent: 5,
      battleHistory: [],
      operativeKillDetails: [],
      priority: 0,
      battleResult: null,
      searchedHexes: [],
      intelCount: 0,
    }
  ]

  const mockHexes: Record<string, Hex> = {
    '0,0': {
      id: '0,0',
      row: 0,
      col: 0,
      type: 'surface',
      location: 11,
      condition: 11,
      explored: true,
      exploredBy: [0],
      exploredLocation: 'SL11-16',
      exploredCondition: 'SC11-16',
    }
  }

  const mockEvents: Event[] = [
    {
      id: '1',
      message: 'Campaign started',
      type: 'system',
      timestamp: '2024-01-01T00:00:00.000Z',
      round: 1,
      phase: 'Movement',
    }
  ]

  const mockAuditLog: CampaignAuditLog = [
    {
      hexId: '0,0',
      action: 'EXPLORE',
      timestamp: '2024-01-01T00:00:00.000Z',
      round: 1,
      phase: 'Movement',
      before: {},
      after: {},
      description: 'Explored hex',
    }
  ]

  let mockSetPlayers: ReturnType<typeof vi.fn>
  let mockSetHexes: ReturnType<typeof vi.fn>
  let mockSetThreatLevel: ReturnType<typeof vi.fn>
  let mockSetTargetThreatLevel: ReturnType<typeof vi.fn>
  let mockSetCurrentRound: ReturnType<typeof vi.fn>
  let mockSetCurrentPhase: ReturnType<typeof vi.fn>
  let mockSetEventLog: ReturnType<typeof vi.fn>
  let mockSetSoloMode: ReturnType<typeof vi.fn>
  let mockAddEvent: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockSetPlayers = vi.fn()
    mockSetHexes = vi.fn()
    mockSetThreatLevel = vi.fn()
    mockSetTargetThreatLevel = vi.fn()
    mockSetCurrentRound = vi.fn()
    mockSetCurrentPhase = vi.fn()
    mockSetEventLog = vi.fn()
    mockSetSoloMode = vi.fn()
    mockAddEvent = vi.fn()
  })

  describe('initial state', () => {
    it('should initialize with import modal closed', () => {
      const { result } = renderHook(() => useImportExport({
        importModalOpen: false,
        players: mockPlayers,
        hexes: mockHexes,
        threatLevel: 5,
        targetThreatLevel: 10,
        currentRound: 3,
        currentPhase: 'Movement',
        eventLog: mockEvents,
        auditLog: mockAuditLog,
        setPlayers: mockSetPlayers,
        setHexes: mockSetHexes,
        setThreatLevel: mockSetThreatLevel,
        setTargetThreatLevel: mockSetTargetThreatLevel,
        setCurrentRound: mockSetCurrentRound,
        setCurrentPhase: mockSetCurrentPhase,
        setEventLog: mockSetEventLog,
        setSoloMode: mockSetSoloMode,
        addEvent: mockAddEvent,
      }))

      expect(result.current.importModalOpen).toBe(false)
    })
  })

  describe('exportCampaign', () => {
    it('should generate export data with current state', () => {
      const { result } = renderHook(() => useImportExport({
        importModalOpen: false,
        players: mockPlayers,
        hexes: mockHexes,
        threatLevel: 5,
        targetThreatLevel: 10,
        currentRound: 3,
        currentPhase: 'Movement',
        eventLog: mockEvents,
        auditLog: mockAuditLog,
        setPlayers: mockSetPlayers,
        setHexes: mockSetHexes,
        setThreatLevel: mockSetThreatLevel,
        setTargetThreatLevel: mockSetTargetThreatLevel,
        setCurrentRound: mockSetCurrentRound,
        setCurrentPhase: mockSetCurrentPhase,
        setEventLog: mockSetEventLog,
        setSoloMode: mockSetSoloMode,
        addEvent: mockAddEvent,
      }))

      act(() => {
        result.current.exportCampaign()
      })

      expect(mockAddEvent).toHaveBeenCalledWith(
        'Campaign exported successfully',
        'system'
      )
    })

    it('should include audit log in export', async () => {
      // WHY: Import the mocked module to check its calls
      const campaignExportModule = await import('@/lib/utils/campaignExport')
      const mockGenerateExportData = vi.mocked(campaignExportModule.generateExportData)

      const { result } = renderHook(() => useImportExport({
        importModalOpen: false,
        players: mockPlayers,
        hexes: mockHexes,
        threatLevel: 5,
        targetThreatLevel: 10,
        currentRound: 3,
        currentPhase: 'Movement',
        eventLog: mockEvents,
        auditLog: mockAuditLog,
        setPlayers: mockSetPlayers,
        setHexes: mockSetHexes,
        setThreatLevel: mockSetThreatLevel,
        setTargetThreatLevel: mockSetTargetThreatLevel,
        setCurrentRound: mockSetCurrentRound,
        setCurrentPhase: mockSetCurrentPhase,
        setEventLog: mockSetEventLog,
        setSoloMode: mockSetSoloMode,
        addEvent: mockAddEvent,
      }))

      act(() => {
        result.current.exportCampaign()
      })

      expect(mockGenerateExportData).toHaveBeenCalledWith(
        5,
        10,
        3,
        'Movement',
        mockHexes,
        mockPlayers,
        mockEvents,
        {},
        '',
        mockAuditLog
      )
    })
  })

  describe('loadCampaign', () => {
    const mockImportData: CampaignExport = {
      version: '1.0.0',
      exportedAt: '2024-01-01T00:00:00.000Z',
      campaign: {
        threatLevel: 7,
        targetThreatLevel: 10,
        currentRound: 5,
        currentPhase: 'Action',
        hexMap: mockHexes
      },
      players: mockPlayers,
      events: mockEvents,
      victoryData: {
        categories: {},
        champion: ''
      },
      auditLog: mockAuditLog
    }

    it('should load all campaign state from import data', () => {
      const { result } = renderHook(() => useImportExport({
        importModalOpen: false,
        players: [],
        hexes: {},
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Movement',
        eventLog: [],
        auditLog: [],
        setPlayers: mockSetPlayers,
        setHexes: mockSetHexes,
        setThreatLevel: mockSetThreatLevel,
        setTargetThreatLevel: mockSetTargetThreatLevel,
        setCurrentRound: mockSetCurrentRound,
        setCurrentPhase: mockSetCurrentPhase,
        setEventLog: mockSetEventLog,
        setSoloMode: mockSetSoloMode,
        addEvent: mockAddEvent,
      }))

      act(() => {
        result.current.loadCampaign(mockImportData)
      })

      expect(mockSetPlayers).toHaveBeenCalledWith(mockPlayers)
      expect(mockSetHexes).toHaveBeenCalledWith(mockHexes)
      expect(mockSetThreatLevel).toHaveBeenCalledWith(7)
      expect(mockSetTargetThreatLevel).toHaveBeenCalledWith(10)
      expect(mockSetCurrentRound).toHaveBeenCalledWith(5)
      expect(mockSetEventLog).toHaveBeenCalledWith(mockEvents)
    })

    it('should set current phase index from phase name', () => {
      const { result } = renderHook(() => useImportExport({
        importModalOpen: false,
        players: [],
        hexes: {},
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Movement',
        eventLog: [],
        auditLog: [],
        setPlayers: mockSetPlayers,
        setHexes: mockSetHexes,
        setThreatLevel: mockSetThreatLevel,
        setTargetThreatLevel: mockSetTargetThreatLevel,
        setCurrentRound: mockSetCurrentRound,
        setCurrentPhase: mockSetCurrentPhase,
        setEventLog: mockSetEventLog,
        setSoloMode: mockSetSoloMode,
        addEvent: mockAddEvent,
      }))

      act(() => {
        result.current.loadCampaign(mockImportData)
      })

      // WHY: Action phase is index 2 (Movement=0, Battle=1, Action=2, Threat=3)
      expect(mockSetCurrentPhase).toHaveBeenCalledWith(2)
    })

    it('should detect solo mode from player count', () => {
      const { result } = renderHook(() => useImportExport({
        importModalOpen: false,
        players: [],
        hexes: {},
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Movement',
        eventLog: [],
        auditLog: [],
        setPlayers: mockSetPlayers,
        setHexes: mockSetHexes,
        setThreatLevel: mockSetThreatLevel,
        setTargetThreatLevel: mockSetTargetThreatLevel,
        setCurrentRound: mockSetCurrentRound,
        setCurrentPhase: mockSetCurrentPhase,
        setEventLog: mockSetEventLog,
        setSoloMode: mockSetSoloMode,
        addEvent: mockAddEvent,
      }))

      act(() => {
        result.current.loadCampaign(mockImportData)
      })

      expect(mockSetSoloMode).toHaveBeenCalledWith(true)
    })

    it('should log import success event', () => {
      const { result } = renderHook(() => useImportExport({
        importModalOpen: false,
        players: [],
        hexes: {},
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Movement',
        eventLog: [],
        auditLog: [],
        setPlayers: mockSetPlayers,
        setHexes: mockSetHexes,
        setThreatLevel: mockSetThreatLevel,
        setTargetThreatLevel: mockSetTargetThreatLevel,
        setCurrentRound: mockSetCurrentRound,
        setCurrentPhase: mockSetCurrentPhase,
        setEventLog: mockSetEventLog,
        setSoloMode: mockSetSoloMode,
        addEvent: mockAddEvent,
      }))

      act(() => {
        result.current.loadCampaign(mockImportData)
      })

      expect(mockAddEvent).toHaveBeenCalledWith(
        'Campaign loaded successfully',
        'system'
      )
    })

    it('should handle multiplayer campaign import', () => {
      const multiplayerImport: CampaignExport = {
        ...mockImportData,
        players: [
          mockPlayers[0]!,
          { ...mockPlayers[0]!, id: 1, name: 'Bob' }
        ]
      }

      const { result } = renderHook(() => useImportExport({
        importModalOpen: false,
        players: [],
        hexes: {},
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Movement',
        eventLog: [],
        auditLog: [],
        setPlayers: mockSetPlayers,
        setHexes: mockSetHexes,
        setThreatLevel: mockSetThreatLevel,
        setTargetThreatLevel: mockSetTargetThreatLevel,
        setCurrentRound: mockSetCurrentRound,
        setCurrentPhase: mockSetCurrentPhase,
        setEventLog: mockSetEventLog,
        setSoloMode: mockSetSoloMode,
        addEvent: mockAddEvent,
      }))

      act(() => {
        result.current.loadCampaign(multiplayerImport)
      })

      expect(mockSetSoloMode).toHaveBeenCalledWith(false)
    })
  })

  describe('import modal control', () => {
    it('should open import modal', () => {
      const { result } = renderHook(() => useImportExport({
        importModalOpen: false,
        players: mockPlayers,
        hexes: mockHexes,
        threatLevel: 5,
        targetThreatLevel: 10,
        currentRound: 3,
        currentPhase: 'Movement',
        eventLog: mockEvents,
        auditLog: mockAuditLog,
        setPlayers: mockSetPlayers,
        setHexes: mockSetHexes,
        setThreatLevel: mockSetThreatLevel,
        setTargetThreatLevel: mockSetTargetThreatLevel,
        setCurrentRound: mockSetCurrentRound,
        setCurrentPhase: mockSetCurrentPhase,
        setEventLog: mockSetEventLog,
        setSoloMode: mockSetSoloMode,
        addEvent: mockAddEvent,
      }))

      const newState = result.current.setImportModalOpen(true)

      expect(newState.importModalOpen).toBe(true)
    })

    it('should close import modal', () => {
      const { result } = renderHook(() => useImportExport({
        importModalOpen: true,
        players: mockPlayers,
        hexes: mockHexes,
        threatLevel: 5,
        targetThreatLevel: 10,
        currentRound: 3,
        currentPhase: 'Movement',
        eventLog: mockEvents,
        auditLog: mockAuditLog,
        setPlayers: mockSetPlayers,
        setHexes: mockSetHexes,
        setThreatLevel: mockSetThreatLevel,
        setTargetThreatLevel: mockSetTargetThreatLevel,
        setCurrentRound: mockSetCurrentRound,
        setCurrentPhase: mockSetCurrentPhase,
        setEventLog: mockSetEventLog,
        setSoloMode: mockSetSoloMode,
        addEvent: mockAddEvent,
      }))

      const newState = result.current.setImportModalOpen(false)

      expect(newState.importModalOpen).toBe(false)
    })
  })
})
