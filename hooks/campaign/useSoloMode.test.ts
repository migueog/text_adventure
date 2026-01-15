/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSoloMode } from './useSoloMode'
import type { Player } from '@/types/campaign'

/**
 * WHY: Test-Driven Development for useSoloMode hook
 * Tests solo mode state management, progress warnings, and victory conditions (Issue #54, #55, #56)
 */

describe('useSoloMode', () => {
  // Mock functions
  let mockAddEvent: ReturnType<typeof vi.fn>

  const createMockPlayer = (
    id: number,
    cp: number,
    sp: number = 5
  ): Player => ({
    id,
    name: `Player ${id}`,
    killTeamName: 'Test Team',
    color: '#000000',
    supplyPoints: sp,
    campaignPoints: cp,
    position: { row: 0, col: 0 },
    bases: [{ row: 0, col: 0 }],
    camps: [],
    exploredHexes: 0,
    operativesKilled: 0,
    gamesPlayed: 5,
    gamesWon: 3,
    gamesLost: 2,
    history: [],
    supplyPointsSpent: 15,
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
    it('should initialize with solo mode disabled', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: false,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [],
        threatLevel: 5,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      expect(result.current.soloMode).toBe(false)
    })

    it('should initialize with solo mode enabled', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [],
        threatLevel: 5,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      expect(result.current.soloMode).toBe(true)
    })

    it('should initialize with joint ops mode settings', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: true, resupplyReductionsUsed: 2 },
        players: [],
        threatLevel: 5,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      expect(result.current.soloSettings.jointOpsMode).toBe(true)
      expect(result.current.soloSettings.resupplyReductionsUsed).toBe(2)
    })
  })

  describe('checkSoloProgressWarning', () => {
    it('should not warn when solo mode is disabled', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: false,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [createMockPlayer(0, 5)],
        threatLevel: 9,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      act(() => {
        result.current.checkSoloProgressWarning(9, 5)
      })

      expect(mockAddEvent).not.toHaveBeenCalled()
    })

    it('should warn critical when threat is 9 and CP < 10', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [createMockPlayer(0, 7)],
        threatLevel: 9,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      act(() => {
        result.current.checkSoloProgressWarning(9, 7)
      })

      expect(mockAddEvent).toHaveBeenCalledWith(
        '🚨 CRITICAL: Campaign will likely end next round! You need 3 more CP for victory!',
        'warning'
      )
    })

    it('should confirm victory secured when threat is 9 and CP >= 10', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [createMockPlayer(0, 12)],
        threatLevel: 9,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      act(() => {
        result.current.checkSoloProgressWarning(9, 12)
      })

      expect(mockAddEvent).toHaveBeenCalledWith(
        '✅ Victory secured! You have 10+ CP. Campaign will end successfully when threat reaches 10.',
        'milestone'
      )
    })

    it('should warn at threat 8 when CP < 8', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [createMockPlayer(0, 5)],
        threatLevel: 8,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      act(() => {
        result.current.checkSoloProgressWarning(8, 5)
      })

      expect(mockAddEvent).toHaveBeenCalledWith(
        '⚠️ WARNING: Only ~2 rounds likely remain. You need 5 more CP for victory.',
        'warning'
      )
    })

    it('should not warn at threat 8 when CP >= 8', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [createMockPlayer(0, 10)],
        threatLevel: 8,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      act(() => {
        result.current.checkSoloProgressWarning(8, 10)
      })

      expect(mockAddEvent).not.toHaveBeenCalled()
    })

    it('should not warn at lower threat levels', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [createMockPlayer(0, 3)],
        threatLevel: 6,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      act(() => {
        result.current.checkSoloProgressWarning(6, 3)
      })

      expect(mockAddEvent).not.toHaveBeenCalled()
    })
  })

  describe('checkSoloVictory', () => {
    it('should return victory when player has 10+ CP', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [createMockPlayer(0, 12)],
        threatLevel: 10,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      const victory = result.current.checkSoloVictory()

      expect(victory).toBe(true)
    })

    it('should return failure when player has < 10 CP', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [createMockPlayer(0, 8)],
        threatLevel: 10,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      const victory = result.current.checkSoloVictory()

      expect(victory).toBe(false)
    })

    it('should return false when no players exist', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [],
        threatLevel: 10,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      const victory = result.current.checkSoloVictory()

      expect(victory).toBe(false)
    })

    it('should return false when solo mode is disabled', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: false,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [createMockPlayer(0, 12)],
        threatLevel: 10,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      const victory = result.current.checkSoloVictory()

      expect(victory).toBe(false)
    })
  })

  describe('buildSoloPerformanceRecord', () => {
    it('should build performance record from player data', () => {
      const player = createMockPlayer(0, 15, 5)
      player.exploredHexes = 12
      player.supplyPointsSpent = 20
      player.operativeKillDetails = [
        { round: 1, operativeName: 'Fire Warrior', wounds: 7, woundValue: 1, opponentId: null },
        { round: 2, operativeName: 'Stealth Suit', wounds: 3, woundValue: 0, opponentId: null },
      ]

      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [player],
        threatLevel: 10,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      const record = result.current.buildSoloPerformanceRecord(
        'test-campaign-123',
        true,
        10,
        8
      )

      expect(record.campaignId).toBe('test-campaign-123')
      expect(record.success).toBe(true)
      expect(record.finalCP).toBe(15)
      expect(record.finalThreat).toBe(10)
      expect(record.rounds).toBe(8)
      expect(record.categories.pioneer.value).toBe(20)
      expect(record.categories.explorer.value).toBe(12)
      expect(record.categories.trooper.value).toBe(5)
      expect(record.categories.warrior.value).toBe(3)
      expect(record.categories.headhunter.value).toBe(10) // 7 + 3 wounds
      expect(record.stats.winRate).toBeCloseTo(0.6) // 3/5
      expect(record.stats.avgCPPerRound).toBeCloseTo(1.875) // 15/8
    })

    it('should handle player with no operative kills', () => {
      const player = createMockPlayer(0, 8, 3)

      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [player],
        threatLevel: 10,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      const record = result.current.buildSoloPerformanceRecord(
        'test-campaign-456',
        false,
        10,
        10
      )

      expect(record.categories.headhunter.value).toBe(0)
      expect(record.success).toBe(false)
    })
  })

  describe('resupply reduction tracking', () => {
    it('should track resupply reduction usage count', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 1 },
        players: [createMockPlayer(0, 5)],
        threatLevel: 5,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      expect(result.current.soloSettings.resupplyReductionsUsed).toBe(1)
    })

    it('should allow resupply reduction when under 3 uses', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 2 },
        players: [createMockPlayer(0, 5)],
        threatLevel: 5,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      const canUse = result.current.canUseResupplyReduction()
      expect(canUse).toBe(true)
    })

    it('should prevent resupply reduction at 3 uses', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 3 },
        players: [createMockPlayer(0, 5)],
        threatLevel: 5,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      const canUse = result.current.canUseResupplyReduction()
      expect(canUse).toBe(false)
    })
  })

  describe('joint ops mode', () => {
    it('should track joint ops mode setting', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: true, resupplyReductionsUsed: 0 },
        players: [createMockPlayer(0, 5)],
        threatLevel: 5,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      expect(result.current.soloSettings.jointOpsMode).toBe(true)
    })

    it('should default joint ops mode to false', () => {
      const { result } = renderHook(() => useSoloMode({
        soloMode: true,
        soloSettings: { jointOpsMode: false, resupplyReductionsUsed: 0 },
        players: [createMockPlayer(0, 5)],
        threatLevel: 5,
        targetThreatLevel: 10,
        addEvent: mockAddEvent,
      }))

      expect(result.current.soloSettings.jointOpsMode).toBe(false)
    })
  })
})
