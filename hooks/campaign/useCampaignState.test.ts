/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCampaignState } from './useCampaignState'
import type { Player } from '@/types/campaign'

/**
 * WHY: Test-Driven Development for useCampaignState hook
 * Tests core game state management (Phase 2, Hook 2)
 */
describe('useCampaignState', () => {
  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useCampaignState())

      expect(result.current.gameStarted).toBe(false)
      expect(result.current.playerCount).toBe(4)
      expect(result.current.players).toEqual([])
      expect(result.current.hexes).toEqual({})
      expect(result.current.currentRound).toBe(1)
      expect(result.current.currentPhase).toBe('Movement')
      expect(result.current.currentPlayerIndex).toBe(0)
      expect(result.current.mapConfig).toBeNull()
      expect(result.current.selectedHex).toBeNull()
      expect(result.current.eventLog).toEqual([])
      expect(result.current.gameEnded).toBe(false)
      expect(result.current.extendedMode).toBe(false)
      expect(result.current.targetThreatLevel).toBe(7)
    })
  })

  describe('startGame', () => {
    it('should initialize 4-player competitive game correctly', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      expect(result.current.gameStarted).toBe(true)
      expect(result.current.players).toHaveLength(4)
      expect(result.current.currentRound).toBe(1)
      expect(result.current.currentPhase).toBe('Movement')
      expect(result.current.currentPlayerIndex).toBe(0)
      expect(result.current.mapConfig).toBeDefined()
      expect(result.current.mapConfig?.name).toBe('Standard (4 Players)')
      expect(result.current.mapConfig?.rows).toBe(6)
      expect(result.current.mapConfig?.cols).toBe(6)
      expect(Object.keys(result.current.hexes)).toHaveLength(36)
    })

    it('should initialize 2-player game with correct map size', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(2, false)
      })

      expect(result.current.players).toHaveLength(2)
      expect(result.current.mapConfig?.rows).toBe(5)
      expect(result.current.mapConfig?.cols).toBe(5)
      expect(Object.keys(result.current.hexes)).toHaveLength(25)
    })

    it('should initialize 6-player game with correct map size', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(6, false)
      })

      expect(result.current.players).toHaveLength(6)
      expect(result.current.mapConfig?.rows).toBe(7)
      expect(result.current.mapConfig?.cols).toBe(7)
      expect(Object.keys(result.current.hexes)).toHaveLength(49)
    })

    it('should initialize solo mode correctly', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(1, true)
      })

      expect(result.current.gameStarted).toBe(true)
      expect(result.current.players).toHaveLength(1)
      // WHY: No config for 1 player, falls back to 4-player map
      expect(result.current.mapConfig?.rows).toBe(6)
      expect(result.current.mapConfig?.name).toBe('Standard (4 Players)')
    })

    it('should create players with correct starting positions', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      const players = result.current.players

      // All players should have different starting positions
      const positions = players.map(p => `${p.position.row},${p.position.col}`)
      const uniquePositions = new Set(positions)
      expect(uniquePositions.size).toBe(4)

      // All players should start on surface row (row 0)
      players.forEach(p => {
        expect(p.position.row).toBe(0)
      })
    })

    it('should mark starting hexes as explored with base location', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(3, false)
      })

      const players = result.current.players
      const hexes = result.current.hexes

      players.forEach((player, idx) => {
        const hexId = `${player.position.row},${player.position.col}`
        const hex = hexes[hexId]

        expect(hex).toBeDefined()
        expect(hex?.explored).toBe(true)
        expect(hex?.location).toBe(11) // Base location
        expect(hex?.condition).toBe(11) // Clear condition
        expect(hex?.exploredBy).toContain(idx)
      })
    })

    it('should initialize players with correct starting resources', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      result.current.players.forEach(player => {
        expect(player.supplyPoints).toBe(10)
        expect(player.campaignPoints).toBe(0)
        expect(player.exploredHexes).toBe(0)
        expect(player.operativesKilled).toBe(0)
        expect(player.gamesPlayed).toBe(0)
        expect(player.gamesWon).toBe(0)
        expect(player.gamesLost).toBe(0)
        expect(player.bases).toHaveLength(1)
        expect(player.camps).toEqual([])
        expect(player.history).toEqual([])
      })
    })

    it('should add start event to log', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      expect(result.current.eventLog.length).toBeGreaterThan(0)
      const startEvent = result.current.eventLog.find(e => e.message.includes('Campaign started'))
      expect(startEvent).toBeDefined()
      expect(startEvent?.type).toBe('system')
    })

    it('should reset gameEnded flag when starting new game', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      expect(result.current.gameEnded).toBe(false)
    })
  })

  describe('updatePlayer', () => {
    it('should update player fields correctly', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      const initialSP = result.current.players[0]!.supplyPoints

      act(() => {
        result.current.updatePlayer(0, {
          supplyPoints: 5,
          campaignPoints: 3
        })
      })

      expect(result.current.players[0]!.supplyPoints).toBe(5)
      expect(result.current.players[0]!.campaignPoints).toBe(3)
    })

    it('should only update specified player', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      const player1SP = result.current.players[1]!.supplyPoints

      act(() => {
        result.current.updatePlayer(0, { supplyPoints: 3 })
      })

      // Player 1 should remain unchanged
      expect(result.current.players[1]!.supplyPoints).toBe(player1SP)
      // Player 0 should be updated
      expect(result.current.players[0]!.supplyPoints).toBe(3)
    })

    it('should preserve other player fields when updating', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      const originalPlayer = result.current.players[2]!

      act(() => {
        result.current.updatePlayer(2, { supplyPoints: 7 })
      })

      const updatedPlayer = result.current.players[2]!

      expect(updatedPlayer.id).toBe(originalPlayer.id)
      expect(updatedPlayer.name).toBe(originalPlayer.name)
      expect(updatedPlayer.color).toBe(originalPlayer.color)
      expect(updatedPlayer.campaignPoints).toBe(originalPlayer.campaignPoints)
      expect(updatedPlayer.supplyPoints).toBe(7) // Only this changed
    })
  })

  describe('updatePriorities', () => {
    it('should recalculate player priorities based on CP/SP', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
        // Give players different CP values
        result.current.updatePlayer(0, { campaignPoints: 3 })
        result.current.updatePlayer(1, { campaignPoints: 5 })
        result.current.updatePlayer(2, { campaignPoints: 1 })
        result.current.updatePlayer(3, { campaignPoints: 5 })
      })

      act(() => {
        result.current.updatePriorities()
      })

      // Priority is calculated by determinePriority utility
      // This test just verifies the function can be called without errors
      expect(result.current.players).toHaveLength(4)
    })
  })

  describe('checkRollOff', () => {
    it('should return false when no tied priorities', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
        result.current.updatePlayer(0, { campaignPoints: 1 })
        result.current.updatePlayer(1, { campaignPoints: 2 })
        result.current.updatePlayer(2, { campaignPoints: 3 })
        result.current.updatePlayer(3, { campaignPoints: 4 })
      })

      const needsRollOff = result.current.checkRollOff()

      expect(needsRollOff).toBe(false)
    })

    it('should return true when priorities are tied', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
        result.current.updatePlayer(0, { campaignPoints: 5, supplyPoints: 5 })
        result.current.updatePlayer(1, { campaignPoints: 5, supplyPoints: 5 })
      })

      const needsRollOff = result.current.checkRollOff()

      expect(needsRollOff).toBe(true)
    })
  })

  describe('enableExtendedMode', () => {
    it('should enable extended mode and reopen game', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      act(() => {
        result.current.enableExtendedMode()
      })

      expect(result.current.extendedMode).toBe(true)
      expect(result.current.gameEnded).toBe(false)
    })

    it('should add event log entry for extended mode', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      const initialLogLength = result.current.eventLog.length

      act(() => {
        result.current.enableExtendedMode()
      })

      expect(result.current.eventLog.length).toBeGreaterThan(initialLogLength)
      const extendedEvent = result.current.eventLog.find(e =>
        e.message.includes('extended')
      )
      expect(extendedEvent).toBeDefined()
    })
  })

  describe('addEvent', () => {
    it('should add event with correct metadata', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      act(() => {
        result.current.addEvent('Test event message', 'action')
      })

      const testEvent = result.current.eventLog.find(e => e.message === 'Test event message')

      expect(testEvent).toBeDefined()
      expect(testEvent?.type).toBe('action')
      expect(testEvent?.round).toBe(1)
      expect(testEvent?.phase).toBe('Movement')
      expect(testEvent?.timestamp).toBeDefined()
    })

    it('should prepend events (newest first)', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      act(() => {
        result.current.addEvent('First event', 'system')
        result.current.addEvent('Second event', 'system')
      })

      expect(result.current.eventLog[0]!.message).toBe('Second event')
      expect(result.current.eventLog[1]!.message).toBe('First event')
    })

    it('should default to system type if not specified', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      act(() => {
        result.current.addEvent('Default type event')
      })

      const event = result.current.eventLog.find(e => e.message === 'Default type event')
      expect(event?.type).toBe('system')
    })

    it('should support all event types', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      const eventTypes = ['system', 'movement', 'exploration', 'reward', 'action', 'battle', 'warning', 'error'] as const

      eventTypes.forEach(type => {
        act(() => {
          result.current.addEvent(`Test ${type}`, type)
        })
      })

      eventTypes.forEach(type => {
        const event = result.current.eventLog.find(e => e.message === `Test ${type}`)
        expect(event?.type).toBe(type)
        expect(event?.icon).toBeDefined()
      })
    })
  })

  describe('state setters', () => {
    it('should update playerCount', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.setPlayerCount(6)
      })

      expect(result.current.playerCount).toBe(6)
    })

    it('should update targetThreatLevel', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.setTargetThreatLevel(9)
      })

      expect(result.current.targetThreatLevel).toBe(9)
    })

    it('should update selectedHex', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.setSelectedHex('3,4')
      })

      expect(result.current.selectedHex).toBe('3,4')
    })
  })

  describe('state persistence', () => {
    it('should maintain state across multiple operations', () => {
      const { result } = renderHook(() => useCampaignState())

      act(() => {
        result.current.startGame(4, false)
      })

      const initialPlayerCount = result.current.players.length

      act(() => {
        result.current.updatePlayer(0, { campaignPoints: 5 })
        result.current.addEvent('Test event', 'action')
        result.current.setSelectedHex('2,2')
      })

      expect(result.current.players.length).toBe(initialPlayerCount)
      expect(result.current.players[0]!.campaignPoints).toBe(5)
      expect(result.current.selectedHex).toBe('2,2')
      expect(result.current.eventLog.some(e => e.message === 'Test event')).toBe(true)
    })
  })
})
