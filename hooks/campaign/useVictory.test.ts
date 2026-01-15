/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVictory } from './useVictory'
import type { Player } from '@/types/campaign'

/**
 * WHY: Test-Driven Development for useVictory hook
 * Tests campaign end detection, victory conditions, and extended mode (Issue #55, #53)
 */

describe('useVictory', () => {
  // Mock functions
  let mockAddEvent: ReturnType<typeof vi.fn>

  const createMockPlayer = (
    id: number,
    name: string,
    cp: number
  ): Player => ({
    id,
    name,
    killTeamName: `${name} Team`,
    color: '#000000',
    supplyPoints: 5,
    campaignPoints: cp,
    position: { row: 0, col: 0 },
    bases: [{ row: 0, col: 0 }],
    camps: [],
    exploredHexes: 5,
    operativesKilled: 3,
    gamesPlayed: 5,
    gamesWon: 3,
    gamesLost: 2,
    history: [],
    supplyPointsSpent: 10,
    battleHistory: [],
    operativeKillDetails: [],
    priority: 0,
    battleResult: null,
    searchedHexes: [],
    intelCount: 0,
  })

  beforeEach(() => {
    mockAddEvent = vi.fn()
  })

  describe('initial state', () => {
    it('should initialize with game not ended', () => {
      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: false,
        soloMode: false,
        threatLevel: 5,
        targetThreatLevel: 10,
        players: [],
        addEvent: mockAddEvent,
      }))

      expect(result.current.gameEnded).toBe(false)
      expect(result.current.extendedMode).toBe(false)
    })

    it('should initialize with extended mode disabled', () => {
      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: false,
        soloMode: false,
        threatLevel: 5,
        targetThreatLevel: 10,
        players: [],
        addEvent: mockAddEvent,
      }))

      expect(result.current.extendedMode).toBe(false)
    })
  })

  describe('checkCampaignEnd', () => {
    it('should detect campaign end when threat reaches target in multiplayer', () => {
      const players = [
        createMockPlayer(0, 'Alice', 15),
        createMockPlayer(1, 'Bob', 12),
      ]

      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: false,
        soloMode: false,
        threatLevel: 10,
        targetThreatLevel: 10,
        players,
        addEvent: mockAddEvent,
      }))

      const shouldEnd = result.current.checkCampaignEnd()

      expect(shouldEnd).toBe(true)
    })

    it('should not detect campaign end when threat below target', () => {
      const players = [createMockPlayer(0, 'Alice', 15)]

      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: false,
        soloMode: false,
        threatLevel: 8,
        targetThreatLevel: 10,
        players,
        addEvent: mockAddEvent,
      }))

      const shouldEnd = result.current.checkCampaignEnd()

      expect(shouldEnd).toBe(false)
    })

    it('should not detect campaign end when extended mode is active', () => {
      const players = [createMockPlayer(0, 'Alice', 15)]

      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: true,
        soloMode: false,
        threatLevel: 10,
        targetThreatLevel: 10,
        players,
        addEvent: mockAddEvent,
      }))

      const shouldEnd = result.current.checkCampaignEnd()

      expect(shouldEnd).toBe(false)
    })
  })

  describe('handleCampaignEnd - solo mode', () => {
    it('should detect solo victory when CP >= 10', () => {
      const players = [createMockPlayer(0, 'Alice', 12)]

      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: false,
        soloMode: true,
        threatLevel: 10,
        targetThreatLevel: 10,
        players,
        addEvent: mockAddEvent,
      }))

      const victoryResult = result.current.handleCampaignEnd()

      expect(victoryResult).toEqual({
        soloVictory: true,
        gameEnded: true,
      })
    })

    it('should detect solo failure when CP < 10', () => {
      const players = [createMockPlayer(0, 'Alice', 7)]

      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: false,
        soloMode: true,
        threatLevel: 10,
        targetThreatLevel: 10,
        players,
        addEvent: mockAddEvent,
      }))

      const victoryResult = result.current.handleCampaignEnd()

      expect(victoryResult).toEqual({
        soloVictory: false,
        gameEnded: true,
      })
    })

    it('should log success event when CP >= 10', () => {
      const players = [createMockPlayer(0, 'Alice', 15)]

      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: false,
        soloMode: true,
        threatLevel: 10,
        targetThreatLevel: 10,
        players,
        addEvent: mockAddEvent,
      }))

      result.current.handleCampaignEnd()

      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('CAMPAIGN SUCCESS'),
        'milestone'
      )
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('15 CP'),
        'milestone'
      )
    })

    it('should log failure event when CP < 10', () => {
      const players = [createMockPlayer(0, 'Alice', 6)]

      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: false,
        soloMode: true,
        threatLevel: 10,
        targetThreatLevel: 10,
        players,
        addEvent: mockAddEvent,
      }))

      result.current.handleCampaignEnd()

      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('CAMPAIGN FAILED'),
        'warning'
      )
      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('6 CP'),
        'warning'
      )
    })

    it('should handle exactly 10 CP as victory', () => {
      const players = [createMockPlayer(0, 'Alice', 10)]

      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: false,
        soloMode: true,
        threatLevel: 10,
        targetThreatLevel: 10,
        players,
        addEvent: mockAddEvent,
      }))

      const victoryResult = result.current.handleCampaignEnd()

      expect(victoryResult.soloVictory).toBe(true)
    })
  })

  describe('handleCampaignEnd - multiplayer mode', () => {
    it('should detect multiplayer campaign end', () => {
      const players = [
        createMockPlayer(0, 'Alice', 15),
        createMockPlayer(1, 'Bob', 12),
      ]

      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: false,
        soloMode: false,
        threatLevel: 10,
        targetThreatLevel: 10,
        players,
        addEvent: mockAddEvent,
      }))

      const victoryResult = result.current.handleCampaignEnd()

      expect(victoryResult.gameEnded).toBe(true)
      expect(victoryResult.soloVictory).toBeUndefined()
    })

    it('should log campaign end event for multiplayer', () => {
      const players = [
        createMockPlayer(0, 'Alice', 15),
        createMockPlayer(1, 'Bob', 12),
      ]

      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: false,
        soloMode: false,
        threatLevel: 10,
        targetThreatLevel: 10,
        players,
        addEvent: mockAddEvent,
      }))

      result.current.handleCampaignEnd()

      expect(mockAddEvent).toHaveBeenCalledWith(
        expect.stringContaining('Campaign ended'),
        'system'
      )
    })
  })

  describe('enableExtendedMode', () => {
    it('should enable extended mode and reopen game', () => {
      const { result } = renderHook(() => useVictory({
        gameEnded: true,
        extendedMode: false,
        soloMode: false,
        threatLevel: 10,
        targetThreatLevel: 10,
        players: [],
        addEvent: mockAddEvent,
      }))

      const extendedState = result.current.enableExtendedMode()

      expect(extendedState.extendedMode).toBe(true)
      expect(extendedState.gameEnded).toBe(false)
    })

    it('should log extended mode activation', () => {
      const { result } = renderHook(() => useVictory({
        gameEnded: true,
        extendedMode: false,
        soloMode: false,
        threatLevel: 10,
        targetThreatLevel: 10,
        players: [],
        addEvent: mockAddEvent,
      }))

      result.current.enableExtendedMode()

      expect(mockAddEvent).toHaveBeenCalledWith(
        'Campaign extended beyond target threat level',
        'system'
      )
    })
  })

  describe('edge cases', () => {
    it('should handle no players in solo mode', () => {
      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: false,
        soloMode: true,
        threatLevel: 10,
        targetThreatLevel: 10,
        players: [],
        addEvent: mockAddEvent,
      }))

      const victoryResult = result.current.handleCampaignEnd()

      expect(victoryResult.soloVictory).toBe(false)
      expect(victoryResult.gameEnded).toBe(true)
    })

    it('should handle negative CP as failure', () => {
      const players = [createMockPlayer(0, 'Alice', -5)]

      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: false,
        soloMode: true,
        threatLevel: 10,
        targetThreatLevel: 10,
        players,
        addEvent: mockAddEvent,
      }))

      const victoryResult = result.current.handleCampaignEnd()

      expect(victoryResult.soloVictory).toBe(false)
    })

    it('should handle very high CP as victory', () => {
      const players = [createMockPlayer(0, 'Alice', 100)]

      const { result } = renderHook(() => useVictory({
        gameEnded: false,
        extendedMode: false,
        soloMode: true,
        threatLevel: 10,
        targetThreatLevel: 10,
        players,
        addEvent: mockAddEvent,
      }))

      const victoryResult = result.current.handleCampaignEnd()

      expect(victoryResult.soloVictory).toBe(true)
    })
  })
})
