/**
 * @vitest-environment jsdom
 * WHY: Test suite for useCampaign recordBattle function (Issue #34)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCampaign } from './useCampaign'
import type { ExtendedBattleRecord } from '@/types/battle'

describe('useCampaign - recordBattle', () => {
  /**
   * WHY: Helper to create test battle record
   */
  const createBattleInput = (
    overrides: Partial<Omit<ExtendedBattleRecord, 'round' | 'timestamp'>> = {}
  ): Omit<ExtendedBattleRecord, 'round' | 'timestamp'> => ({
    opponent: 1,
    result: 'WIN',
    status: 'completed',
    operativesKilled: 3,
    isExternalOpponent: false,
    cpEarned: 1,
    spEarned: 0,
    ...overrides
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T10:30:00Z'))
  })

  it('should add battle record to player history', () => {
    const { result } = renderHook(() => useCampaign())

    // Start a game with 2 players
    act(() => {
      result.current.startGame(2)
    })

    // Advance to battle phase
    act(() => {
      result.current.nextPhase() // Movement to Battle
    })

    // Record a battle
    act(() => {
      result.current.recordBattle(createBattleInput())
    })

    const player = result.current.players[0]
    expect(player?.battleHistory).toHaveLength(1)
    expect(player?.battleHistory[0]?.result).toBe('WIN')
  })

  it('should auto-generate timestamp', () => {
    const { result } = renderHook(() => useCampaign())

    act(() => {
      result.current.startGame(2)
    })

    act(() => {
      result.current.nextPhase()
    })

    act(() => {
      result.current.recordBattle(createBattleInput())
    })

    const player = result.current.players[0]
    expect(player?.battleHistory[0]?.timestamp).toBe('2024-06-15T10:30:00.000Z')
  })

  it('should store current round in battle record', () => {
    const { result } = renderHook(() => useCampaign())

    act(() => {
      result.current.startGame(2)
    })

    act(() => {
      result.current.nextPhase()
    })

    act(() => {
      result.current.recordBattle(createBattleInput())
    })

    const player = result.current.players[0]
    expect(player?.battleHistory[0]?.round).toBe(1)
  })

  it('should update player CP from battle', () => {
    const { result } = renderHook(() => useCampaign())

    act(() => {
      result.current.startGame(2)
    })

    const initialCP = result.current.players[0]?.campaignPoints ?? 0

    act(() => {
      result.current.nextPhase()
    })

    act(() => {
      result.current.recordBattle(createBattleInput({ cpEarned: 1, spEarned: 0 }))
    })

    expect(result.current.players[0]?.campaignPoints).toBe(initialCP + 1)
  })

  it('should update player SP from battle', () => {
    const { result } = renderHook(() => useCampaign())

    act(() => {
      result.current.startGame(2)
    })

    // WHY: Reduce SP first so we can verify it increases
    act(() => {
      result.current.updatePlayer(0, { supplyPoints: 5 })
    })

    const initialSP = result.current.players[0]?.supplyPoints ?? 0

    act(() => {
      result.current.nextPhase()
    })

    act(() => {
      result.current.recordBattle(createBattleInput({ result: 'LOSS', cpEarned: 0, spEarned: 1 }))
    })

    expect(result.current.players[0]?.supplyPoints).toBe(initialSP + 1)
  })

  it('should increment gamesPlayed', () => {
    const { result } = renderHook(() => useCampaign())

    act(() => {
      result.current.startGame(2)
    })

    act(() => {
      result.current.nextPhase()
    })

    act(() => {
      result.current.recordBattle(createBattleInput())
    })

    expect(result.current.players[0]?.gamesPlayed).toBe(1)
  })

  it('should increment gamesWon on WIN', () => {
    const { result } = renderHook(() => useCampaign())

    act(() => {
      result.current.startGame(2)
    })

    act(() => {
      result.current.nextPhase()
    })

    act(() => {
      result.current.recordBattle(createBattleInput({ result: 'WIN' }))
    })

    expect(result.current.players[0]?.gamesWon).toBe(1)
    expect(result.current.players[0]?.gamesLost).toBe(0)
  })

  it('should increment gamesLost on LOSS', () => {
    const { result } = renderHook(() => useCampaign())

    act(() => {
      result.current.startGame(2)
    })

    act(() => {
      result.current.nextPhase()
    })

    act(() => {
      result.current.recordBattle(createBattleInput({ result: 'LOSS', cpEarned: 0, spEarned: 1 }))
    })

    expect(result.current.players[0]?.gamesLost).toBe(1)
    expect(result.current.players[0]?.gamesWon).toBe(0)
  })

  it('should store isExternalOpponent flag', () => {
    const { result } = renderHook(() => useCampaign())

    act(() => {
      result.current.startGame(2)
    })

    act(() => {
      result.current.nextPhase()
    })

    act(() => {
      result.current.recordBattle(createBattleInput({
        isExternalOpponent: true,
        opponent: null
      }))
    })

    const player = result.current.players[0]
    expect(player?.battleHistory[0]?.isExternalOpponent).toBe(true)
    expect(player?.battleHistory[0]?.opponent).toBeNull()
  })

  it('should store optional mission details', () => {
    const { result } = renderHook(() => useCampaign())

    act(() => {
      result.current.startGame(2)
    })

    act(() => {
      result.current.nextPhase()
    })

    act(() => {
      result.current.recordBattle(createBattleInput({
        missionType: 'Loot and Salvage',
        vpScored: 12,
        vpOpponent: 8,
        operativesLost: 2,
        notes: 'Great game!'
      }))
    })

    const battle = result.current.players[0]?.battleHistory[0]
    expect(battle?.missionType).toBe('Loot and Salvage')
    expect(battle?.vpScored).toBe(12)
    expect(battle?.vpOpponent).toBe(8)
    expect(battle?.operativesLost).toBe(2)
    expect(battle?.notes).toBe('Great game!')
  })

  it('should handle BYE result correctly', () => {
    const { result } = renderHook(() => useCampaign())

    act(() => {
      result.current.startGame(2)
    })

    act(() => {
      result.current.nextPhase()
    })

    act(() => {
      result.current.recordBattle(createBattleInput({
        result: 'BYE',
        opponent: null,
        cpEarned: 0,
        spEarned: 2
      }))
    })

    const player = result.current.players[0]
    expect(player?.battleHistory[0]?.result).toBe('BYE')
    expect(player?.battleHistory[0]?.opponent).toBeNull()
    // WHY: Initial SP is capped at 10, adding 2 would exceed cap
    expect(player?.supplyPoints).toBe(10) // Capped at max SP
  })

  it('should update battleResult for Action Phase ordering', () => {
    const { result } = renderHook(() => useCampaign())

    act(() => {
      result.current.startGame(2)
    })

    act(() => {
      result.current.nextPhase()
    })

    act(() => {
      result.current.recordBattle(createBattleInput({ result: 'DRAW' }))
    })

    expect(result.current.players[0]?.battleResult).toBe('DRAW')
  })

  it('should add operatives killed to player total', () => {
    const { result } = renderHook(() => useCampaign())

    act(() => {
      result.current.startGame(2)
    })

    act(() => {
      result.current.nextPhase()
    })

    act(() => {
      result.current.recordBattle(createBattleInput({ operativesKilled: 5 }))
    })

    expect(result.current.players[0]?.operativesKilled).toBe(5)
  })
})
