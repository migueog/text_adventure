/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMovementPhase } from './useMovementPhase'
import type { Player, Hex, HexPosition } from '@/types/campaign'

/**
 * WHY: Test-Driven Development for useMovementPhase hook
 * Tests movement order calculation and movement actions (Phase 2, Hook 3)
 */

// Helper to create mock player
const createMockPlayer = (
  id: number,
  cp: number,
  sp: number,
  position: HexPosition,
  bases: HexPosition[] = [],
  camps: HexPosition[] = []
): Player => ({
  id,
  name: `Player ${id + 1}`,
  color: '#ffffff',
  killTeamName: `Kill Team ${id + 1}`,
  position,
  supplyPoints: sp,
  campaignPoints: cp,
  exploredHexes: 0,
  operativesKilled: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  bases,
  camps,
  history: [],
  battleResult: null,
  searchedHexes: [],
  battleHistory: [],
  supplyPointsSpent: 0,
  operativeKillDetails: [],
})

// Helper to create mock hex grid
const createMockHexes = (): Record<string, Hex> => ({
  '0,0': { id: '0,0', row: 0, col: 0, type: 'surface', explored: true, location: 11, condition: 11, exploredBy: [0] },
  '0,1': { id: '0,1', row: 0, col: 1, type: 'surface', explored: false, location: 0, condition: 0, exploredBy: [] },
  '1,0': { id: '1,0', row: 1, col: 0, type: 'surface', explored: false, location: 0, condition: 0, exploredBy: [] },
  '1,1': { id: '1,1', row: 1, col: 1, type: 'surface', explored: false, location: 0, condition: 0, exploredBy: [] },
  '2,0': { id: '2,0', row: 2, col: 0, type: 'tomb', explored: false, location: 0, condition: 0, exploredBy: [] },
  '2,1': { id: '2,1', row: 2, col: 1, type: 'blocked', explored: false, location: 0, condition: 0, exploredBy: [] },
})

describe('useMovementPhase', () => {
  describe('initial state', () => {
    it('should initialize with empty movement order', () => {
      const { result } = renderHook(() => useMovementPhase({
        players: [],
        hexes: {},
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: () => {},
        updatePlayer: () => {},
        exploreHex: () => {},
      }))

      expect(result.current.movementOrder).toEqual([])
      expect(result.current.movementIndex).toBe(0)
      expect(result.current.regroupPath).toBeNull()
    })
  })

  describe('calculateMovementOrder', () => {
    it('should order players by priority (lowest CP first)', () => {
      const players = [
        createMockPlayer(0, 5, 5, { row: 0, col: 0 }),
        createMockPlayer(1, 3, 5, { row: 0, col: 1 }),
        createMockPlayer(2, 7, 5, { row: 0, col: 2 }),
        createMockPlayer(3, 3, 5, { row: 0, col: 3 }),
      ]

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes: {},
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: () => {},
        updatePlayer: () => {},
        exploreHex: () => {},
      }))

      act(() => {
        result.current.calculateMovementOrder()
      })

      // Players 1 and 3 tied at 3 CP, Player 0 at 5 CP, Player 2 at 7 CP
      // Order should be: [1, 3, 0, 2] (tied players maintain order)
      expect(result.current.movementOrder).toEqual([1, 3, 0, 2])
    })

    it('should break CP ties using SP (lower SP wins)', () => {
      const players = [
        createMockPlayer(0, 5, 8, { row: 0, col: 0 }),
        createMockPlayer(1, 5, 3, { row: 0, col: 1 }),
        createMockPlayer(2, 5, 5, { row: 0, col: 2 }),
      ]

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes: {},
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: () => {},
        updatePlayer: () => {},
        exploreHex: () => {},
      }))

      act(() => {
        result.current.calculateMovementOrder()
      })

      // All tied at 5 CP, ordered by SP: 3 < 5 < 8
      expect(result.current.movementOrder).toEqual([1, 2, 0])
    })

    it('should return single player for solo mode', () => {
      const players = [createMockPlayer(0, 0, 10, { row: 0, col: 0 })]

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes: {},
        currentRound: 1,
        currentPhase: 'Movement',
        isSolo: true,
        addEvent: () => {},
        updatePlayer: () => {},
        exploreHex: () => {},
      }))

      act(() => {
        result.current.calculateMovementOrder()
      })

      expect(result.current.movementOrder).toEqual([0])
    })
  })

  describe('movePlayer', () => {
    let mockUpdatePlayer: ReturnType<typeof vi.fn>
    let mockAddEvent: ReturnType<typeof vi.fn>
    let mockExploreHex: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockUpdatePlayer = vi.fn()
      mockAddEvent = vi.fn()
      mockExploreHex = vi.fn()
    })

    it('should move player and deduct SP', () => {
      const players = [createMockPlayer(0, 0, 10, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes,
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.movePlayer(0, '1,0', 1)
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        position: { row: 1, col: 0 },
        supplyPoints: 9,
        supplyPointsSpent: 1,
      }))
      expect(mockAddEvent).toHaveBeenCalledWith(
        'Player 1 moved to 1,0 (cost: 1 SP)',
        'movement'
      )
    })

    it('should prevent movement beyond 3 hexes', () => {
      const players = [createMockPlayer(0, 0, 10, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes,
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.movePlayer(0, '2,0', 4)
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockAddEvent).toHaveBeenCalledWith(
        'Player 1 cannot move more than 3 hexes! (attempted: 4)',
        'error'
      )
    })

    it('should prevent movement to blocked hex', () => {
      const players = [createMockPlayer(0, 0, 10, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes,
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.movePlayer(0, '2,1', 1)
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockAddEvent).toHaveBeenCalledWith(
        'Player 1 cannot move to blocked hex!',
        'error'
      )
    })

    it('should prevent movement with insufficient SP', () => {
      const players = [createMockPlayer(0, 0, 2, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes,
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.movePlayer(0, '2,0', 3)
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockAddEvent).toHaveBeenCalledWith(
        "Player 1 doesn't have enough SP to move!",
        'error'
      )
    })

    it('should prevent movement to hex with 2 players', () => {
      const players = [
        createMockPlayer(0, 0, 10, { row: 0, col: 0 }),
        createMockPlayer(1, 0, 10, { row: 1, col: 0 }),
        createMockPlayer(2, 0, 10, { row: 1, col: 0 }),
      ]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes,
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.movePlayer(0, '1,0', 1)
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockAddEvent).toHaveBeenCalledWith(
        'Player 1 cannot move to 1,0 - already has 2 kill teams!',
        'error'
      )
    })

    it('should trigger exploration for unexplored hex', () => {
      const players = [createMockPlayer(0, 0, 10, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes,
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.movePlayer(0, '1,0', 1)
      })

      expect(mockExploreHex).toHaveBeenCalledWith('1,0')
    })

    it('should not trigger exploration for explored hex', () => {
      const players = [createMockPlayer(0, 0, 10, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes,
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.movePlayer(0, '0,0', 0)
      })

      expect(mockExploreHex).not.toHaveBeenCalled()
    })
  })

  describe('regroupPlayer', () => {
    let mockUpdatePlayer: ReturnType<typeof vi.fn>
    let mockAddEvent: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockUpdatePlayer = vi.fn()
      mockAddEvent = vi.fn()
    })

    it('should move player to nearest base for free', () => {
      const players = [
        createMockPlayer(
          0,
          0,
          5,
          { row: 2, col: 2 },
          [{ row: 0, col: 0 }],
          []
        )
      ]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes,
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: () => {},
      }))

      act(() => {
        result.current.regroupPlayer(0)
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        position: { row: 0, col: 0 },
      }))
      expect(mockAddEvent).toHaveBeenCalledWith(
        'Player 1 Regroup to 0,0 (free movement)',
        'movement'
      )
    })

    it('should move player to nearest camp if closer than base', () => {
      const players = [
        createMockPlayer(
          0,
          0,
          5,
          { row: 2, col: 2 },
          [{ row: 0, col: 0 }],
          [{ row: 2, col: 1 }]
        )
      ]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes,
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: () => {},
      }))

      act(() => {
        result.current.regroupPlayer(0)
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        position: { row: 2, col: 1 },
      }))
    })

    it('should show error if player has no bases or camps', () => {
      const players = [createMockPlayer(0, 0, 5, { row: 1, col: 1 }, [], [])]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes,
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: () => {},
      }))

      act(() => {
        result.current.regroupPlayer(0)
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockAddEvent).toHaveBeenCalledWith(
        'Player 1 has no bases or camps to regroup to!',
        'error'
      )
    })

    it('should set regroupPath for visualization', () => {
      const players = [
        createMockPlayer(
          0,
          0,
          5,
          { row: 2, col: 2 },
          [{ row: 0, col: 0 }],
          []
        )
      ]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes,
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: () => {},
      }))

      act(() => {
        result.current.regroupPlayer(0)
      })

      expect(result.current.regroupPath).toEqual([
        { row: 2, col: 2 }, // Current position
        { row: 0, col: 0 }  // Target base
      ])
    })
  })

  describe('holdPosition', () => {
    let mockUpdatePlayer: ReturnType<typeof vi.fn>
    let mockAddEvent: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockUpdatePlayer = vi.fn()
      mockAddEvent = vi.fn()
    })

    it('should keep player in current position with no SP cost', () => {
      const players = [createMockPlayer(0, 0, 5, { row: 1, col: 1 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes,
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: () => {},
      }))

      act(() => {
        result.current.holdPosition(0)
      })

      expect(mockUpdatePlayer).toHaveBeenCalled()

      // WHY: Verify history was added (SP doesn't change so it's not in update)
      const updateCall = mockUpdatePlayer.mock.calls[0]
      expect(updateCall?.[0]).toBe(0)
      expect(updateCall?.[1]).toMatchObject({
        history: expect.any(Array)
      })
      expect(mockAddEvent).toHaveBeenCalledWith(
        'Player 1 Hold position at 1,1',
        'movement'
      )
    })

    it('should add history entry for hold action', () => {
      const players = [createMockPlayer(0, 0, 8, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes,
        currentRound: 2,
        currentPhase: 'Movement',
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: () => {},
      }))

      act(() => {
        result.current.holdPosition(0)
      })

      const updateCall = mockUpdatePlayer.mock.calls[0]
      expect(updateCall?.[1]).toMatchObject({
        history: expect.arrayContaining([
          expect.objectContaining({
            round: 2,
            phase: 'Movement',
            action: 'Held position at 0,0',
            spBefore: 8,
            spAfter: 8,
          })
        ])
      })
    })
  })

  describe('clearRegroupPath', () => {
    it('should clear regroup path visualization', () => {
      const players = [
        createMockPlayer(
          0,
          0,
          5,
          { row: 2, col: 2 },
          [{ row: 0, col: 0 }],
          []
        )
      ]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useMovementPhase({
        players,
        hexes,
        currentRound: 1,
        currentPhase: 'Movement',
        addEvent: () => {},
        updatePlayer: () => {},
        exploreHex: () => {},
      }))

      act(() => {
        result.current.regroupPlayer(0)
      })

      expect(result.current.regroupPath).not.toBeNull()

      act(() => {
        result.current.clearRegroupPath()
      })

      expect(result.current.regroupPath).toBeNull()
    })
  })
})
