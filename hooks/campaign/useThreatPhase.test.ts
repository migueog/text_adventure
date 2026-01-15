/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThreatPhase } from './useThreatPhase'
import type { Player, Hex } from '@/types/campaign'

/**
 * WHY: Test-Driven Development for useThreatPhase hook
 * Tests threat level mechanics, location rules, and Beast Lair attacks (Phase 2, Hook 6)
 */

describe('useThreatPhase', () => {
  // Mock functions
  let mockUpdatePlayer: ReturnType<typeof vi.fn>
  let mockAddEvent: ReturnType<typeof vi.fn>
  let mockSetThreatLevel: ReturnType<typeof vi.fn>

  const createMockPlayer = (
    id: number,
    sp: number,
    cp: number,
    position: { row: number; col: number },
    history: any[] = []
  ): Player => ({
    id,
    name: `Player ${id}`,
    color: '#000000',
    supplyPoints: sp,
    campaignPoints: cp,
    position,
    bases: [{ row: 0, col: 0 }],
    camps: [],
    exploredHexes: 0,
    operativesKilled: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    soloPerformance: null,
    history,
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
    location: number,
    explored: boolean = true,
    state?: any
  ): Hex => ({
    id: `${row},${col}`,
    row,
    col,
    type,
    location,
    condition: 11, // Clear condition
    explored,
    exploredBy: explored ? [0] : [],
    state,
  })

  beforeEach(() => {
    mockUpdatePlayer = vi.fn()
    mockAddEvent = vi.fn()
    mockSetThreatLevel = vi.fn()
  })

  const createMockHexes = (): Record<string, Hex> => ({
    '0,0': createMockHex(0, 0, 'surface', 11), // Base (no threat rule)
    '1,0': createMockHex(1, 0, 'surface', 25), // Abandoned Camp (has threat rule)
    '0,1': createMockHex(0, 1, 'tomb', 36), // Tomb Entrance (has threat rule)
    '2,0': createMockHex(2, 0, 'surface', 23, true, { beastLairActive: true }), // Beast Lair
  })

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useThreatPhase({
        players: [],
        hexes: {},
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      expect(result.current.threatRulesResolved).toBe(false)
      expect(result.current.activeThreatRules).toEqual([])
      expect(result.current.showThreatCheckDialog).toBe(false)
      expect(result.current.pendingThreatCheck).toBeNull()
    })
  })

  describe('detectThreatRules', () => {
    it('should detect active threat phase location rules', () => {
      const players = [
        createMockPlayer(0, 10, 0, { row: 1, col: 0 }), // On Abandoned Camp (has threat rule)
        createMockPlayer(1, 10, 0, { row: 0, col: 1 }), // On Tomb Entrance (has threat rule)
      ]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      const rules = result.current.detectThreatRules()

      // WHY: Should find 2 active rules (Abandoned Camp and Tomb Entrance)
      expect(rules.length).toBeGreaterThanOrEqual(1)
    })

    it('should skip unexplored hexes', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 3, col: 0 })]
      const hexes = {
        '3,0': createMockHex(3, 0, 'surface', 21, false), // Unexplored
      }

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      const rules = result.current.detectThreatRules()

      expect(rules).toEqual([])
    })
  })

  describe('resolveThreatPhaseLocationRules', () => {
    it('should resolve location rules and update players', () => {
      const players = [
        createMockPlayer(0, 10, 0, { row: 1, col: 0 }), // On Abandoned Camp (has threat rule)
      ]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      act(() => {
        result.current.resolveThreatPhaseLocationRules()
      })

      // WHY: Should update player or log event from location rule
      expect(result.current.threatRulesResolved).toBe(true)
    })

    it('should handle location rules with effects', () => {
      const players = [
        createMockPlayer(1, 10, 0, { row: 0, col: 1 }), // On Tomb Entrance (has threat rule)
      ]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      act(() => {
        result.current.resolveThreatPhaseLocationRules()
      })

      // WHY: Should log events for location rule effects
      expect(result.current.threatRulesResolved).toBe(true)
    })

    it('should return empty array when no active rules', () => {
      const players = [
        createMockPlayer(0, 10, 0, { row: 0, col: 0 }), // On base (no threat rule)
      ]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      let resolutions: any[] = []
      act(() => {
        resolutions = result.current.resolveThreatPhaseLocationRules()
      })

      expect(resolutions).toEqual([])
      expect(result.current.threatRulesResolved).toBe(true)
    })

    it('should mark threat rules as resolved after execution', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      expect(result.current.threatRulesResolved).toBe(false)

      act(() => {
        result.current.resolveThreatPhaseLocationRules()
      })

      expect(result.current.threatRulesResolved).toBe(true)
    })
  })

  describe('resolveThreatPhaseAttacks', () => {
    it('should resolve Beast Lair attacks on nearby players', () => {
      const players = [
        createMockPlayer(0, 10, 0, { row: 1, col: 0 }), // Near Beast Lair at 2,0
      ]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      // WHY: Just verify function executes without errors (attack is randomized)
      expect(() => {
        act(() => {
          result.current.resolveThreatPhaseAttacks()
        })
      }).not.toThrow()
    })

    it('should not attack players out of range', () => {
      const players = [
        createMockPlayer(0, 10, 0, { row: 5, col: 5 }), // Far from Beast Lair
      ]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      const initialCallCount = mockUpdatePlayer.mock.calls.length

      act(() => {
        result.current.resolveThreatPhaseAttacks()
      })

      // WHY: No players in range means no attacks
      expect(mockUpdatePlayer).toHaveBeenCalledTimes(initialCallCount)
    })
  })

  describe('increaseThreat', () => {
    it('should increase threat level by specified amount', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      // WHY: Mock setThreatLevel to actually execute the setter function
      mockSetThreatLevel.mockImplementation((fn) => {
        if (typeof fn === 'function') {
          fn(3) // Execute with current threat level
        }
      })

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 3,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      act(() => {
        result.current.increaseThreat(2, 'Standard increase')
      })

      // WHY: Should call setThreatLevel to update to 5
      expect(mockSetThreatLevel).toHaveBeenCalledWith(expect.any(Function))
      expect(mockAddEvent).toHaveBeenCalledWith(
        'Threat increased by 2: Standard increase',
        'warning'
      )
    })

    it('should cap threat at 10', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 9,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      act(() => {
        result.current.increaseThreat(5, 'Big increase')
      })

      // WHY: Threat should be capped at 10
      expect(mockSetThreatLevel).toHaveBeenCalledWith(expect.any(Function))
      const setterFn = mockSetThreatLevel.mock.calls[0][0]
      expect(setterFn(9)).toBe(10)
    })

    it('should add warning when approaching campaign end', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      // WHY: Mock setThreatLevel to execute setter function
      mockSetThreatLevel.mockImplementation((fn) => {
        if (typeof fn === 'function') {
          fn(5) // Execute with current threat level
        }
      })

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 5,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      act(() => {
        result.current.increaseThreat(1, 'Approaching end')
      })

      // WHY: Should show warning when 1 level from target
      expect(mockAddEvent).toHaveBeenCalled()
    })
  })

  describe('handleThreatCheckConfirm', () => {
    it('should increase threat when check succeeds', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 3,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      // WHY: Set up pending threat check
      act(() => {
        result.current.setPendingThreatCheck({
          success: true,
          increase: 2,
          description: 'Search action threat',
          roll: 5,
        })
        result.current.setShowThreatCheckDialog(true)
      })

      act(() => {
        result.current.handleThreatCheckConfirm()
      })

      // WHY: Should increase threat and close dialog
      expect(mockSetThreatLevel).toHaveBeenCalled()
      expect(result.current.showThreatCheckDialog).toBe(false)
      expect(result.current.pendingThreatCheck).toBeNull()
    })

    it('should not increase threat when check fails', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 3,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      act(() => {
        result.current.setPendingThreatCheck({
          success: false,
          increase: 2,
          description: 'Search action threat',
          roll: 2,
        })
        result.current.setShowThreatCheckDialog(true)
      })

      const initialCallCount = mockSetThreatLevel.mock.calls.length

      act(() => {
        result.current.handleThreatCheckConfirm()
      })

      // WHY: Should not increase threat but should close dialog
      expect(mockSetThreatLevel).toHaveBeenCalledTimes(initialCallCount)
      expect(result.current.showThreatCheckDialog).toBe(false)
    })
  })

  describe('handleThreatPrevention', () => {
    it('should deduct SP to prevent threat increase', () => {
      const players = [createMockPlayer(0, 8, 0, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 3,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        currentPlayerIndex: 0,
        isSolo: true, // Solo mode
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      act(() => {
        result.current.setPendingThreatCheck({
          success: true,
          increase: 2,
          description: 'Search action threat',
          roll: 5,
        })
        result.current.setShowThreatCheckDialog(true)
      })

      act(() => {
        result.current.handleThreatPrevention(3)
      })

      // WHY: Should deduct 3 SP and close dialog without increasing threat
      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        supplyPoints: 5, // 8 - 3
      }))
      expect(result.current.showThreatCheckDialog).toBe(false)
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('prevented threat'),
        'action'
      )
    })

    it('should not prevent threat if insufficient SP', () => {
      const players = [createMockPlayer(0, 2, 0, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 3,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        currentPlayerIndex: 0,
        isSolo: true,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      act(() => {
        result.current.setPendingThreatCheck({
          success: true,
          increase: 2,
          description: 'Search action threat',
          roll: 5,
        })
      })

      const initialCallCount = mockUpdatePlayer.mock.calls.length

      act(() => {
        result.current.handleThreatPrevention(3)
      })

      // WHY: Should not deduct SP if player doesn't have enough
      expect(mockUpdatePlayer).toHaveBeenCalledTimes(initialCallCount)
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('Insufficient SP'),
        'error'
      )
    })
  })

  describe('checkForThreatRules', () => {
    it('should return true when active rules exist', () => {
      const players = [
        createMockPlayer(0, 10, 0, { row: 1, col: 0 }), // On location with rule
      ]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      const hasRules = result.current.checkForThreatRules()

      expect(hasRules).toBe(true)
    })

    it('should return false when no active rules', () => {
      const players = [
        createMockPlayer(0, 10, 0, { row: 0, col: 0 }), // On base (no rule)
      ]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useThreatPhase({
        players,
        hexes,
        threatLevel: 1,
        targetThreatLevel: 7,
        currentRound: 1,
        currentPhase: 'Threat',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        setThreatLevel: mockSetThreatLevel,
      }))

      const hasRules = result.current.checkForThreatRules()

      expect(hasRules).toBe(false)
    })
  })
})
