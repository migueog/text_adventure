/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useActionPhase } from './useActionPhase'
import type { Player, Hex } from '@/types/campaign'

/**
 * WHY: Test-Driven Development for useActionPhase hook
 * Tests action phase mechanics including order calculation and 10+ action types
 */

const createMockPlayer = (
  id: number,
  sp: number = 10,
  cp: number = 0,
  position: { row: number; col: number } = { row: 0, col: 0 },
  battleResult: Player['battleResult'] = null
): Player => ({
  id,
  name: `Player ${id}`,
  color: '#ff0000',
  supplyPoints: sp,
  campaignPoints: cp,
  position,
  bases: [{ row: 0, col: 0 }],
  camps: [],
  exploredHexes: 0,
  searchedHexes: [],
  operativesKilled: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  battleResult,
  supplyPointsSpent: 0,
  history: [],
})

const createMockHex = (
  row: number,
  col: number,
  type: 'surface' | 'tomb' = 'surface',
  location: number = 11,
  explored: boolean = true
): Hex => ({
  row,
  col,
  type,
  location,
  condition: 11,
  explored,
  exploredBy: [0],
})

const createMockHexes = (): Record<string, Hex> => ({
  '0,0': createMockHex(0, 0, 'surface', 11), // Base (Surface Ruin, searchable)
  '1,0': createMockHex(1, 0, 'surface', 11), // Surface Ruin (searchable)
  '0,1': createMockHex(0, 1, 'tomb', 11),    // Tomb Ruin (searchable)
  '2,0': createMockHex(2, 0, 'surface', 11, false), // Unexplored Surface Ruin
})

describe('useActionPhase', () => {
  let mockUpdatePlayer: ReturnType<typeof vi.fn>
  let mockAddEvent: ReturnType<typeof vi.fn>
  let mockExploreHex: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockUpdatePlayer = vi.fn()
    mockAddEvent = vi.fn()
    mockExploreHex = vi.fn()
  })

  describe('initial state', () => {
    it('should initialize with null action order and 0 action index', () => {
      const players = [createMockPlayer(0)]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      expect(result.current.actionOrder).toBeNull()
      expect(result.current.actionIndex).toBe(0)
    })
  })

  describe('calculateActionOrder', () => {
    it('should calculate order based on battle results (WIN → DRAW → LOSS)', () => {
      const players = [
        createMockPlayer(0, 10, 0, { row: 0, col: 0 }, 'LOSS'),
        createMockPlayer(1, 10, 0, { row: 0, col: 1 }, 'WIN'),
        createMockPlayer(2, 10, 0, { row: 0, col: 2 }, 'DRAW'),
        createMockPlayer(3, 10, 0, { row: 0, col: 3 }, 'WIN'),
      ]

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes: createMockHexes(),
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.calculateActionOrder()
      })

      expect(result.current.actionOrder).toBeDefined()
      // Winners first (1, 3), then draws (2), then losses (0)
      const order = result.current.actionOrder!
      expect(order).toContain(1)
      expect(order).toContain(3)
      expect(order).toContain(2)
      expect(order).toContain(0)
      expect(order.indexOf(1)).toBeLessThan(order.indexOf(2))
      expect(order.indexOf(2)).toBeLessThan(order.indexOf(0))
    })

    it('should handle solo mode with single player', () => {
      const players = [createMockPlayer(0)]

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes: createMockHexes(),
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: true,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.calculateActionOrder()
      })

      expect(result.current.actionOrder).toEqual([0])
    })

    it('should log action order to event log', () => {
      const players = [
        createMockPlayer(0, 10, 0, { row: 0, col: 0 }, 'WIN'),
        createMockPlayer(1, 10, 0, { row: 0, col: 1 }, 'LOSS'),
      ]

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes: createMockHexes(),
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.calculateActionOrder()
      })

      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('Action order:'),
        'system'
      )
    })
  })

  describe('advanceActionTurn', () => {
    it('should advance to next player in action order', () => {
      const players = [createMockPlayer(0), createMockPlayer(1)]

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes: createMockHexes(),
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.calculateActionOrder()
      })

      const initialIndex = result.current.actionIndex

      act(() => {
        result.current.advanceActionTurn()
      })

      expect(result.current.actionIndex).toBe(initialIndex + 1)
    })

    it('should wrap to 0 when reaching end of action order', () => {
      const players = [createMockPlayer(0), createMockPlayer(1)]

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes: createMockHexes(),
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.calculateActionOrder()
      })

      // Advance to end
      act(() => {
        result.current.advanceActionTurn()
        result.current.advanceActionTurn()
      })

      expect(result.current.actionIndex).toBe(0)
    })
  })

  describe('performAction: RESUPPLY', () => {
    it('should resupply at base (fills to max 10 SP)', () => {
      const players = [createMockPlayer(0, 5, 0, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('RESUPPLY')
      })

      // WHY: Base resupply fills to max (10 SP), not +3 SP
      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        supplyPoints: 10, // 5 + actualGain (capped to fill to 10)
      }))
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('resupplied'),
        'action'
      )
    })

    it('should cap SP at maximum 10', () => {
      const players = [createMockPlayer(0, 9, 0, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('RESUPPLY')
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        supplyPoints: 10, // capped at max
      }))
    })

    it('should not resupply if already at max SP', () => {
      const players = [createMockPlayer(0, 10, 0, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('RESUPPLY')
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('already at max SP'),
        'system'
      )
    })
  })

  describe('performAction: SCOUT', () => {
    it('should scout adjacent hex with SP cost', () => {
      const players = [createMockPlayer(0, 5, 0, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('SCOUT', { targetHex: '2,0', distance: 2 })
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        supplyPoints: 3, // 5 - 2
        supplyPointsSpent: 2,
      }))
      expect(mockExploreHex).toHaveBeenCalledWith('2,0')
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('scouted 2,0'),
        'action'
      )
    })

    it('should fail if target already explored', () => {
      const players = [createMockPlayer(0, 5, 0, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('SCOUT', { targetHex: '1,0', distance: 1 })
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockExploreHex).not.toHaveBeenCalled()
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('already explored'),
        'warning'
      )
    })

    it('should fail if insufficient SP', () => {
      const players = [createMockPlayer(0, 1, 0, { row: 0, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('SCOUT', { targetHex: '2,0', distance: 2 })
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('Insufficient SP'),
        'error'
      )
    })
  })

  describe('performAction: SEARCH', () => {
    it('should search current hex and gain rewards', () => {
      const players = [createMockPlayer(0, 5, 0, { row: 1, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('SEARCH')
      })

      // WHY: Search costs 1 SP, may gain SP/CP
      expect(mockUpdatePlayer).toHaveBeenCalled()
      const updateCall = mockUpdatePlayer.mock.calls[0]
      expect(updateCall?.[0]).toBe(0)
      expect(updateCall?.[1]).toHaveProperty('searchedHexes')
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('searched'),
        'action'
      )
    })

    it('should fail if hex already searched', () => {
      const players = [createMockPlayer(0, 5, 0, { row: 1, col: 0 })]
      players[0]!.searchedHexes = ['1,0']
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('SEARCH')
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('cannot search'),
        'warning'
      )
    })

    it('should fail if insufficient SP', () => {
      const players = [createMockPlayer(0, 0, 0, { row: 1, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('SEARCH')
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('cannot search'),
        'warning'
      )
    })
  })

  describe('performAction: ENCAMP', () => {
    it('should build camp at current position', () => {
      const players = [createMockPlayer(0, 5, 0, { row: 1, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('ENCAMP', {
          options: { cost: 3, campToRemove: null }
        })
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        supplyPoints: 2, // 5 - 3
        supplyPointsSpent: 3,
        camps: [{ row: 1, col: 0 }],
      }))
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('built camp'),
        'action'
      )
    })

    it('should remove old camp when relocating', () => {
      const players = [createMockPlayer(0, 5, 0, { row: 1, col: 0 })]
      players[0]!.camps = [{ row: 0, col: 1 }]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('ENCAMP', {
          options: { cost: 2, campToRemove: { row: 0, col: 1 } }
        })
      })

      expect(mockUpdatePlayer).toHaveBeenCalled()
      const updateCall = mockUpdatePlayer.mock.calls[0]
      expect(updateCall?.[1]).toHaveProperty('camps')
      const camps = updateCall?.[1].camps
      expect(camps).toEqual([{ row: 1, col: 0 }])
    })

    it('should fail if insufficient SP', () => {
      const players = [createMockPlayer(0, 2, 0, { row: 1, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('ENCAMP', {
          options: { cost: 3, campToRemove: null }
        })
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('Not enough SP'),
        'error'
      )
    })
  })

  describe('performAction: DEMOLISH', () => {
    it('should demolish opponent camp with prerequisite', () => {
      const players = [
        createMockPlayer(0, 5, 0, { row: 1, col: 0 }),
        createMockPlayer(1, 5, 0, { row: 2, col: 0 }),
      ]
      // WHY: Add camp at player 0's position
      players[1]!.camps = [{ row: 1, col: 0 }]
      // WHY: Add battle prerequisite (won against player 1 this round)
      players[0]!.battleHistory = [{
        round: 1,
        timestamp: new Date().toISOString(),
        result: 'WIN',
        opponent: 1,
        killTeam: 'Team 1',
        opponentKillTeam: 'Team 2',
        location: 'Test Location',
        condition: 'Clear',
        spEarned: 0,
        cpEarned: 1,
        operativesKilled: 0,
      }]

      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('DEMOLISH', {
          options: { targetType: 'CAMP', targetPlayerId: 1 }
        })
      })

      expect(mockUpdatePlayer).toHaveBeenCalled()
      // WHY: Current player should lose 3 SP
      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        supplyPoints: 2, // 5 - 3
        supplyPointsSpent: 3,
      }))
      // WHY: Target player should lose camp
      expect(mockUpdatePlayer).toHaveBeenCalledWith(1, expect.objectContaining({
        camps: [],
      }))
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('demolished'),
        'action'
      )
    })

    it('should fail if insufficient SP', () => {
      const players = [createMockPlayer(0, 2, 0, { row: 1, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('DEMOLISH', {
          options: { targetType: 'CAMP', targetPlayerId: 1 }
        })
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('Cannot demolish'),
        'error'
      )
    })

    it('should fail if no valid targets at position', () => {
      const players = [createMockPlayer(0, 5, 0, { row: 1, col: 0 })]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('DEMOLISH', {
          options: { targetType: 'CAMP', targetPlayerId: 0 }
        })
      })

      expect(mockUpdatePlayer).not.toHaveBeenCalled()
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('Cannot demolish'),
        'error'
      )
    })
  })

  describe('performAction: unknown action', () => {
    it('should log error for unknown action types', () => {
      const players = [createMockPlayer(0)]
      const hexes = createMockHexes()

      const { result } = renderHook(() => useActionPhase({
        players,
        hexes,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Action',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
        exploreHex: mockExploreHex,
      }))

      act(() => {
        result.current.performAction('INVALID_ACTION')
      })

      expect(mockAddEvent).toHaveBeenCalledWith(
        'Unknown action: INVALID_ACTION',
        'error'
      )
    })
  })
})
