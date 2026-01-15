/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBattlePhase } from './useBattlePhase'
import type { Player } from '@/types/campaign'
import type { ExtendedBattleRecord } from '@/types/battle'

/**
 * WHY: Test-Driven Development for useBattlePhase hook
 * Tests battle recording, rewards, and phase completion (Phase 2, Hook 4)
 */

// Helper to create mock player
const createMockPlayer = (
  id: number,
  cp: number,
  sp: number,
  gamesPlayed: number = 0,
  gamesWon: number = 0,
  gamesLost: number = 0
): Player => ({
  id,
  name: `Player ${id + 1}`,
  color: '#ffffff',
  killTeamName: `Kill Team ${id + 1}`,
  position: { row: 0, col: 0 },
  supplyPoints: sp,
  campaignPoints: cp,
  exploredHexes: 0,
  operativesKilled: 0,
  gamesPlayed,
  gamesWon,
  gamesLost,
  bases: [],
  camps: [],
  history: [],
  battleResult: null,
  searchedHexes: [],
  battleHistory: [],
  supplyPointsSpent: 0,
  operativeKillDetails: [],
})

describe('useBattlePhase', () => {
  describe('initial state', () => {
    it('should initialize with battleCompleted as false', () => {
      const { result } = renderHook(() => useBattlePhase({
        players: [],
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Battle',
        isSolo: false,
        addEvent: () => {},
        updatePlayer: () => {},
      }))

      expect(result.current.battleCompleted).toBe(false)
    })
  })

  describe('recordBattle', () => {
    let mockUpdatePlayer: ReturnType<typeof vi.fn>
    let mockAddEvent: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockUpdatePlayer = vi.fn()
      mockAddEvent = vi.fn()
    })

    it('should record WIN battle result with CP reward', () => {
      const players = [createMockPlayer(0, 0, 5)]
      const battleRecord: Omit<ExtendedBattleRecord, 'round' | 'timestamp'> = {
        result: 'WIN',
        opponent: 'Player 2',
        killTeam: 'Kill Team 1',
        opponentKillTeam: 'Kill Team 2',
        location: 'Abandoned Outpost',
        condition: 'Clear',
        spEarned: 0,
        cpEarned: 1,
        operativesKilled: 2,
        operativeKills: [
          { operativeName: 'Scout', wounds: 8 },
          { operativeName: 'Heavy', wounds: 12 }
        ]
      }

      const { result } = renderHook(() => useBattlePhase({
        players,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Battle',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
      }))

      act(() => {
        result.current.recordBattle(battleRecord)
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        supplyPoints: 5,
        campaignPoints: 1,
        gamesPlayed: 1,
        gamesWon: 1,
        gamesLost: 0,
        operativesKilled: 2,
        battleResult: 'WIN',
      }))

      expect(mockAddEvent).toHaveBeenCalledWith(
        'Player 1: WIN (+1 CP, +0 SP)',
        'battle'
      )

      expect(result.current.battleCompleted).toBe(true)
    })

    it('should record LOSS battle result with SP reward', () => {
      const players = [createMockPlayer(0, 2, 3)]
      const battleRecord: Omit<ExtendedBattleRecord, 'round' | 'timestamp'> = {
        result: 'LOSS',
        opponent: 'Player 2',
        killTeam: 'Kill Team 1',
        opponentKillTeam: 'Kill Team 2',
        location: 'Supply Cache',
        condition: 'Critical',
        spEarned: 1,
        cpEarned: 0,
        operativesKilled: 1,
        operativeKills: [
          { operativeName: 'Leader', wounds: 10 }
        ]
      }

      const { result } = renderHook(() => useBattlePhase({
        players,
        currentPlayerIndex: 0,
        currentRound: 2,
        currentPhase: 'Battle',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
      }))

      act(() => {
        result.current.recordBattle(battleRecord)
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        supplyPoints: 4,
        campaignPoints: 2,
        gamesPlayed: 1,
        gamesWon: 0,
        gamesLost: 1,
        operativesKilled: 1,
        battleResult: 'LOSS',
      }))
    })

    it('should record DRAW battle result with SP reward', () => {
      const players = [createMockPlayer(0, 1, 5)]
      const battleRecord: Omit<ExtendedBattleRecord, 'round' | 'timestamp'> = {
        result: 'DRAW',
        opponent: 'Player 3',
        killTeam: 'Kill Team 1',
        opponentKillTeam: 'Kill Team 3',
        location: 'Dark Corridor',
        condition: 'Clear',
        spEarned: 1,
        cpEarned: 0,
        operativesKilled: 0,
        operativeKills: []
      }

      const { result } = renderHook(() => useBattlePhase({
        players,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Battle',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
      }))

      act(() => {
        result.current.recordBattle(battleRecord)
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        supplyPoints: 6,
        campaignPoints: 1,
        gamesPlayed: 1,
        gamesWon: 0,
        gamesLost: 0,
        battleResult: 'DRAW',
      }))
    })

    it('should clamp SP at maximum of 10', () => {
      const players = [createMockPlayer(0, 0, 9)]
      const battleRecord: Omit<ExtendedBattleRecord, 'round' | 'timestamp'> = {
        result: 'LOSS',
        opponent: 'Player 2',
        killTeam: 'Kill Team 1',
        opponentKillTeam: 'Kill Team 2',
        location: 'Supply Cache',
        condition: 'Clear',
        spEarned: 3,
        cpEarned: 0,
        operativesKilled: 0,
        operativeKills: []
      }

      const { result } = renderHook(() => useBattlePhase({
        players,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Battle',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
      }))

      act(() => {
        result.current.recordBattle(battleRecord)
      })

      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        supplyPoints: 10, // Clamped at max
      }))
    })

    it('should add battle record to battleHistory', () => {
      const players = [createMockPlayer(0, 0, 5)]
      const battleRecord: Omit<ExtendedBattleRecord, 'round' | 'timestamp'> = {
        result: 'WIN',
        opponent: 'Player 2',
        killTeam: 'Kill Team 1',
        opponentKillTeam: 'Kill Team 2',
        location: 'Central Hub',
        condition: 'Clear',
        spEarned: 0,
        cpEarned: 1,
        operativesKilled: 1,
        operativeKills: [{ operativeName: 'Trooper', wounds: 7 }]
      }

      const { result } = renderHook(() => useBattlePhase({
        players,
        currentPlayerIndex: 0,
        currentRound: 3,
        currentPhase: 'Battle',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
      }))

      act(() => {
        result.current.recordBattle(battleRecord)
      })

      const updateCall = mockUpdatePlayer.mock.calls[0]
      expect(updateCall?.[1]).toMatchObject({
        battleHistory: expect.arrayContaining([
          expect.objectContaining({
            result: 'WIN',
            opponent: 'Player 2',
            round: 3,
            timestamp: expect.any(String),
          })
        ])
      })
    })

    it('should track operative kill details', () => {
      const players = [createMockPlayer(0, 0, 5)]
      const battleRecord: Omit<ExtendedBattleRecord, 'round' | 'timestamp'> = {
        result: 'WIN',
        opponent: 'Player 2',
        killTeam: 'Kill Team 1',
        opponentKillTeam: 'Kill Team 2',
        location: 'Arena',
        condition: 'Clear',
        spEarned: 0,
        cpEarned: 1,
        operativesKilled: 2,
        operativeKills: [
          { operativeName: 'Gunner', wounds: 9 },
          { operativeName: 'Medic', wounds: 8 }
        ]
      }

      const { result } = renderHook(() => useBattlePhase({
        players,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Battle',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
      }))

      act(() => {
        result.current.recordBattle(battleRecord)
      })

      const updateCall = mockUpdatePlayer.mock.calls[0]
      expect(updateCall?.[1]).toMatchObject({
        operativeKillDetails: expect.arrayContaining([
          expect.objectContaining({
            operativeName: 'Gunner',
            wounds: 9,
            opponentId: 'Player 2',
            round: 1,
          }),
          expect.objectContaining({
            operativeName: 'Medic',
            wounds: 8,
            opponentId: 'Player 2',
            round: 1,
          })
        ])
      })
    })

    it('should add history entry for battle', () => {
      const players = [createMockPlayer(0, 0, 5)]
      const battleRecord: Omit<ExtendedBattleRecord, 'round' | 'timestamp'> = {
        result: 'WIN',
        opponent: 'Player 2',
        killTeam: 'Kill Team 1',
        opponentKillTeam: 'Kill Team 2',
        location: 'Arena',
        condition: 'Clear',
        spEarned: 0,
        cpEarned: 1,
        operativesKilled: 0,
        operativeKills: []
      }

      const { result } = renderHook(() => useBattlePhase({
        players,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Battle',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
      }))

      act(() => {
        result.current.recordBattle(battleRecord)
      })

      const updateCall = mockUpdatePlayer.mock.calls[0]
      expect(updateCall?.[1]).toMatchObject({
        history: expect.arrayContaining([
          expect.objectContaining({
            round: 1,
            phase: 'Battle',
            action: 'Battle result: WIN',
            spBefore: 5,
            spAfter: 5,
            cpBefore: 0,
            cpAfter: 1,
          })
        ])
      })
    })
  })

  describe('recordMissingPlayer', () => {
    let mockUpdatePlayer: ReturnType<typeof vi.fn>
    let mockAddEvent: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockUpdatePlayer = vi.fn()
      mockAddEvent = vi.fn()
    })

    it('should record WIN for present player', () => {
      const players = [
        createMockPlayer(0, 0, 5),
        createMockPlayer(1, 0, 5)
      ]

      const { result } = renderHook(() => useBattlePhase({
        players,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Battle',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
      }))

      act(() => {
        result.current.recordMissingPlayer(0, 1)
      })

      // Present player (0) gets WIN
      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, expect.objectContaining({
        campaignPoints: 1,
        supplyPoints: 5, // No SP change for WIN
        gamesPlayed: 1,
        gamesWon: 1,
        battleResult: 'WIN',
      }))

      expect(mockAddEvent).toHaveBeenCalledWith(
        'Player 1: WIN (+1 CP) - opponent absent',
        'battle'
      )
    })

    it('should record LOSS for absent player', () => {
      const players = [
        createMockPlayer(0, 0, 5),
        createMockPlayer(1, 0, 5)
      ]

      const { result } = renderHook(() => useBattlePhase({
        players,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Battle',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
      }))

      act(() => {
        result.current.recordMissingPlayer(0, 1)
      })

      // Absent player (1) gets LOSS
      expect(mockUpdatePlayer).toHaveBeenCalledWith(1, expect.objectContaining({
        campaignPoints: 0, // No CP for LOSS
        supplyPoints: 6, // +1 SP for LOSS
        gamesPlayed: 1,
        gamesLost: 1,
        battleResult: 'LOSS',
      }))

      expect(mockAddEvent).toHaveBeenCalledWith(
        'Player 2: LOSS (+1 SP) - marked as absent',
        'battle'
      )
    })

    it('should mark battle as completed', () => {
      const players = [
        createMockPlayer(0, 0, 5),
        createMockPlayer(1, 0, 5)
      ]

      const { result } = renderHook(() => useBattlePhase({
        players,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Battle',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
      }))

      act(() => {
        result.current.recordMissingPlayer(0, 1)
      })

      expect(result.current.battleCompleted).toBe(true)
    })

    it('should add battle records to both players', () => {
      const players = [
        createMockPlayer(0, 0, 5),
        createMockPlayer(1, 0, 5)
      ]

      const { result } = renderHook(() => useBattlePhase({
        players,
        currentPlayerIndex: 0,
        currentRound: 2,
        currentPhase: 'Battle',
        isSolo: false,
        addEvent: mockAddEvent,
        updatePlayer: mockUpdatePlayer,
      }))

      act(() => {
        result.current.recordMissingPlayer(0, 1)
      })

      // Present player gets WIN record
      const presentCall = mockUpdatePlayer.mock.calls.find(call => call[0] === 0)
      expect(presentCall?.[1]).toMatchObject({
        battleHistory: expect.arrayContaining([
          expect.objectContaining({
            result: 'WIN',
            opponent: 1, // ID, not name
            round: 2,
          })
        ])
      })

      // Absent player gets LOSS record
      const absentCall = mockUpdatePlayer.mock.calls.find(call => call[0] === 1)
      expect(absentCall?.[1]).toMatchObject({
        battleHistory: expect.arrayContaining([
          expect.objectContaining({
            result: 'LOSS',
            opponent: 0, // ID, not name
            round: 2,
          })
        ])
      })
    })
  })

  describe('resetBattleResults', () => {
    it('should clear all player battleResult fields', () => {
      const players = [
        { ...createMockPlayer(0, 0, 5), battleResult: 'WIN' as const },
        { ...createMockPlayer(1, 0, 5), battleResult: 'LOSS' as const },
        { ...createMockPlayer(2, 0, 5), battleResult: 'DRAW' as const },
      ]

      let mockUpdatePlayer = vi.fn()

      const { result } = renderHook(() => useBattlePhase({
        players,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Battle',
        isSolo: false,
        addEvent: () => {},
        updatePlayer: mockUpdatePlayer,
      }))

      act(() => {
        result.current.resetBattleResults()
      })

      // Should update each player to clear battleResult
      expect(mockUpdatePlayer).toHaveBeenCalledTimes(3)
      expect(mockUpdatePlayer).toHaveBeenCalledWith(0, { battleResult: null })
      expect(mockUpdatePlayer).toHaveBeenCalledWith(1, { battleResult: null })
      expect(mockUpdatePlayer).toHaveBeenCalledWith(2, { battleResult: null })
    })

    it('should reset battleCompleted flag', () => {
      const players = [createMockPlayer(0, 0, 5)]

      const { result } = renderHook(() => useBattlePhase({
        players,
        currentPlayerIndex: 0,
        currentRound: 1,
        currentPhase: 'Battle',
        isSolo: false,
        addEvent: () => {},
        updatePlayer: () => {},
      }))

      // First record a battle
      act(() => {
        result.current.recordBattle({
          result: 'WIN',
          opponent: 'Test',
          killTeam: 'KT1',
          opponentKillTeam: 'KT2',
          location: 'Arena',
          condition: 'Clear',
          spEarned: 0,
          cpEarned: 1,
          operativesKilled: 0,
          operativeKills: []
        })
      })

      expect(result.current.battleCompleted).toBe(true)

      // Then reset
      act(() => {
        result.current.resetBattleResults()
      })

      expect(result.current.battleCompleted).toBe(false)
    })
  })
})
