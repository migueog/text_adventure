/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useExploration } from './useExploration'
import type { Player, Hex, MapConfig } from '@/types/campaign'

/**
 * WHY: Test-Driven Development for useExploration hook
 * Tests D36 exploration with duplicate detection (Phase 2, Hook 7)
 */

// Mock dice rolls
vi.mock('@/lib/utils/dice', () => ({
  rollD36: vi.fn(() => 11), // Default to repeatable location (11-16)
  rollD6: vi.fn(() => 3),
  parseValue: (val: number | string | { d6: number }) => {
    if (typeof val === 'number') return val
    if (typeof val === 'string') return parseInt(val, 10)
    return 3 // D6 default
  }
}))

describe('useExploration', () => {
  // Mock functions
  let mockUpdatePlayer: ReturnType<typeof vi.fn>
  let mockAddEvent: ReturnType<typeof vi.fn>
  let mockSetHexes: ReturnType<typeof vi.fn>
  let mockAddAudit: ReturnType<typeof vi.fn>

  const createMockPlayer = (
    id: number,
    sp: number,
    cp: number,
    position: { row: number; col: number },
    exploredHexes: number = 0
  ): Player => ({
    id,
    name: `Player ${id}`,
    color: '#000000',
    supplyPoints: sp,
    campaignPoints: cp,
    position,
    bases: [{ row: 0, col: 0 }],
    camps: [],
    exploredHexes,
    operativesKilled: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    soloPerformance: null,
    history: [],
    supplyPointsSpent: 0,
    battleHistory: [],
    operativeKillDetails: [],
    priority: 0,
    battleResult: null,
    intel: 0,
  })

  const createMockHex = (
    row: number,
    col: number,
    type: 'surface' | 'tomb' | 'blocked',
    explored: boolean = false
  ): Hex => ({
    id: `${row},${col}`,
    row,
    col,
    type,
    location: 0, // Will be set on exploration
    condition: 0, // Will be set on exploration
    explored,
    exploredBy: [],
  })

  const mockMapConfig: MapConfig = {
    name: 'Standard (4 Players)',
    rows: 6,
    cols: 6,
    playerCount: 4,
  }

  beforeEach(() => {
    mockUpdatePlayer = vi.fn()
    mockAddEvent = vi.fn()
    mockSetHexes = vi.fn((fn) => {
      // WHY: Mock setHexes to execute the setter function
      const currentHexes: Record<string, Hex> = {
        '1,0': createMockHex(1, 0, 'surface', false),
        '0,1': createMockHex(0, 1, 'tomb', false),
        '2,0': createMockHex(2, 0, 'blocked', false),
      }
      return fn(currentHexes)
    })
    mockAddAudit = vi.fn()
  })

  describe('initial state', () => {
    it('should initialize with null exploration result', () => {
      const { result } = renderHook(() => useExploration({
        players: [createMockPlayer(0, 10, 0, { row: 0, col: 0 })],
        hexes: {},
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Movement',
        mapConfig: mockMapConfig,
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setHexes: mockSetHexes,
        addAudit: mockAddAudit,
        onThreatCheck: vi.fn(),
      }))

      expect(result.current.explorationResult).toBeNull()
    })
  })

  describe('exploreHex', () => {
    it('should explore surface hex and update state', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes: Record<string, Hex> = {
        '1,0': createMockHex(1, 0, 'surface', false),
      }

      const { result } = renderHook(() => useExploration({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Movement',
        mapConfig: mockMapConfig,
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setHexes: mockSetHexes,
        addAudit: mockAddAudit,
        onThreatCheck: vi.fn(),
      }))

      act(() => {
        result.current.exploreHex('1,0')
      })

      // WHY: Should call setHexes to mark hex as explored
      expect(mockSetHexes).toHaveBeenCalled()
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('Explored hex 1,0'),
        'exploration'
      )
    })

    it('should explore tomb hex and update state', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes: Record<string, Hex> = {
        '0,1': createMockHex(0, 1, 'tomb', false),
      }

      const { result } = renderHook(() => useExploration({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Movement',
        mapConfig: mockMapConfig,
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setHexes: mockSetHexes,
        addAudit: mockAddAudit,
        onThreatCheck: vi.fn(),
      }))

      act(() => {
        result.current.exploreHex('0,1')
      })

      expect(mockSetHexes).toHaveBeenCalled()
    })

    it('should not explore blocked hex', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes: Record<string, Hex> = {
        '2,0': createMockHex(2, 0, 'blocked', false),
      }

      const { result } = renderHook(() => useExploration({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Movement',
        mapConfig: mockMapConfig,
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setHexes: mockSetHexes,
        addAudit: mockAddAudit,
        onThreatCheck: vi.fn(),
      }))

      act(() => {
        result.current.exploreHex('2,0')
      })

      // WHY: Should show error for blocked hex
      expect(mockAddEvent).toHaveBeenCalledWith(
        'Cannot explore blocked hex',
        'error'
      )
    })

    it('should not explore already explored hex', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const exploredHex = {
        ...createMockHex(1, 0, 'surface', true),
        location: 11,
        condition: 11
      }
      const hexes: Record<string, Hex> = {
        '1,0': exploredHex, // Already explored
      }

      // WHY: Custom mock for this test to properly handle already-explored hex
      const customSetHexes = vi.fn((fn) => {
        return fn(hexes)
      })

      const { result } = renderHook(() => useExploration({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Movement',
        mapConfig: mockMapConfig,
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setHexes: customSetHexes,
        addAudit: mockAddAudit,
        onThreatCheck: vi.fn(),
      }))

      act(() => {
        result.current.exploreHex('1,0')
      })

      // WHY: Should show warning for already explored hex
      expect(mockAddEvent).toHaveBeenCalledWith(
        'Hex already explored',
        'warning'
      )
    })

    it('should set exploration result for modal display', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes: Record<string, Hex> = {
        '1,0': createMockHex(1, 0, 'surface', false),
      }

      const { result } = renderHook(() => useExploration({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Movement',
        mapConfig: mockMapConfig,
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setHexes: mockSetHexes,
        addAudit: mockAddAudit,
        onThreatCheck: vi.fn(),
      }))

      act(() => {
        result.current.exploreHex('1,0')
      })

      // WHY: Should set exploration result with location/condition data
      expect(result.current.explorationResult).toBeDefined()
      expect(result.current.explorationResult?.hexId).toBe('1,0')
      expect(result.current.explorationResult?.playerName).toBe('Player 0')
    })

    it('should update player explored hex count', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 }, 0)]
      const hexes: Record<string, Hex> = {
        '1,0': createMockHex(1, 0, 'surface', false),
      }

      const { result } = renderHook(() => useExploration({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Movement',
        mapConfig: mockMapConfig,
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setHexes: mockSetHexes,
        addAudit: mockAddAudit,
        onThreatCheck: vi.fn(),
      }))

      act(() => {
        result.current.exploreHex('1,0')
      })

      // WHY: Should increment exploredHexes count
      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        exploredHexes: 1
      }))
    })

    it('should trigger solo mode threat check for tomb exploration', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes: Record<string, Hex> = {
        '0,1': createMockHex(0, 1, 'tomb', false),
      }
      const mockOnThreatCheck = vi.fn()

      const { result } = renderHook(() => useExploration({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Movement',
        mapConfig: mockMapConfig,
        isSolo: true, // Solo mode
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setHexes: mockSetHexes,
        addAudit: mockAddAudit,
        onThreatCheck: mockOnThreatCheck,
      }))

      act(() => {
        result.current.exploreHex('0,1')
      })

      // WHY: Should trigger threat check callback for solo tomb exploration
      expect(mockOnThreatCheck).toHaveBeenCalled()
    })

    it('should not trigger threat check for surface hex in solo mode', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes: Record<string, Hex> = {
        '1,0': createMockHex(1, 0, 'surface', false),
      }
      const mockOnThreatCheck = vi.fn()

      const { result } = renderHook(() => useExploration({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Movement',
        mapConfig: mockMapConfig,
        isSolo: true,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setHexes: mockSetHexes,
        addAudit: mockAddAudit,
        onThreatCheck: mockOnThreatCheck,
      }))

      act(() => {
        result.current.exploreHex('1,0')
      })

      // WHY: Should not trigger threat check for surface hex
      expect(mockOnThreatCheck).not.toHaveBeenCalled()
    })

    it('should record audit trail for exploration', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes: Record<string, Hex> = {
        '1,0': createMockHex(1, 0, 'surface', false),
      }

      const { result } = renderHook(() => useExploration({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Movement',
        mapConfig: mockMapConfig,
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setHexes: mockSetHexes,
        addAudit: mockAddAudit,
        onThreatCheck: vi.fn(),
      }))

      act(() => {
        result.current.exploreHex('1,0')
      })

      // WHY: Should create audit entry with before/after snapshots
      expect(mockAddAudit).toHaveBeenCalledWith(
        '1,0',
        'EXPLORE',
        expect.any(Object), // before snapshot
        expect.any(Object), // after snapshot
        expect.stringContaining('Explored')
      )
    })
  })

  describe('clearExplorationResult', () => {
    it('should clear exploration result', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes: Record<string, Hex> = {
        '1,0': createMockHex(1, 0, 'surface', false),
      }

      const { result } = renderHook(() => useExploration({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Movement',
        mapConfig: mockMapConfig,
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setHexes: mockSetHexes,
        addAudit: mockAddAudit,
        onThreatCheck: vi.fn(),
      }))

      act(() => {
        result.current.exploreHex('1,0')
      })

      expect(result.current.explorationResult).not.toBeNull()

      act(() => {
        result.current.clearExplorationResult()
      })

      expect(result.current.explorationResult).toBeNull()
    })
  })
})
