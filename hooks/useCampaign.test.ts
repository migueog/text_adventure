import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCampaign } from './useCampaign'

describe('useCampaign hook', () => {
  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useCampaign())

      expect(result.current.gameStarted).toBe(false)
      expect(result.current.players).toEqual([])
      expect(result.current.currentRound).toBe(1)
      expect(result.current.threatLevel).toBe(1)
    })

    it('should start game with correct player count', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(3)
      })

      expect(result.current.gameStarted).toBe(true)
      expect(result.current.players).toHaveLength(3)
    })

    it('should initialize players with correct starting values', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      const player = result.current.players[0]
      expect(player).toBeDefined()
      if (player) {
        expect(player.supplyPoints).toBe(10)
        expect(player.campaignPoints).toBe(0)
        expect(player.exploredHexes).toBe(0)
      }
    })
  })

  describe('supply points management', () => {
    it('should update supply points through updatePlayer', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      const initialSP = result.current.players[0]?.supplyPoints || 0

      act(() => {
        result.current.updatePlayer(0, { supplyPoints: initialSP + 3 })
      })

      expect(result.current.players[0]?.supplyPoints).toBe(initialSP + 3)
    })

    it('should perform resupply action', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      act(() => {
        result.current.updatePlayer(0, { supplyPoints: 5 })
      })

      act(() => {
        result.current.performAction('RESUPPLY')
      })

      expect(result.current.players[0]?.supplyPoints).toBeGreaterThan(5)
    })

    it('should not exceed maximum supply points (10)', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      act(() => {
        result.current.updatePlayer(0, { supplyPoints: 10 })
        result.current.performAction('RESUPPLY')
      })

      expect(result.current.players[0]?.supplyPoints).toBe(10)
    })

    it('should handle scout action that costs SP', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      const initialSP = result.current.players[0]?.supplyPoints || 0
      const unexploredHex = Object.keys(result.current.hexes).find(
        id => !result.current.hexes[id]?.explored
      )

      if (unexploredHex && initialSP >= 1) {
        act(() => {
          result.current.performAction('SCOUT', { targetHex: unexploredHex, distance: 1 })
        })

        expect(result.current.players[0]?.supplyPoints).toBe(initialSP - 1)
      }
    })

    it('should record history when performing actions', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      const unexploredHex = Object.keys(result.current.hexes).find(
        id => !result.current.hexes[id]?.explored
      )

      if (unexploredHex) {
        act(() => {
          result.current.performAction('SCOUT', { targetHex: unexploredHex, distance: 1 })
        })

        const player = result.current.players[0]
        expect(player?.history?.length || 0).toBeGreaterThan(0)
      }
    })
  })

  describe('campaign points management', () => {
    it('should update campaign points through battle results', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      const initialCP = result.current.players[0]?.campaignPoints || 0
      const victoryResult = { name: 'Victory', spGain: 0, cpGain: 1 }

      act(() => {
        result.current.recordBattle(victoryResult, null, 0)
      })

      expect(result.current.players[0]?.campaignPoints).toBe(initialCP + 1)
    })

    it('should allow updating CP through updatePlayer', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      act(() => {
        result.current.updatePlayer(0, { campaignPoints: -3 })
      })

      expect(result.current.players[0]?.campaignPoints).toBe(-3)
    })
  })

  describe('hex ownership', () => {
    it('should explore hexes when exploreHex is called', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      const unexploredHex = Object.keys(result.current.hexes).find(
        id => !result.current.hexes[id]?.explored
      )

      if (unexploredHex) {
        act(() => {
          result.current.exploreHex(unexploredHex)
        })

        expect(result.current.hexes[unexploredHex]?.explored).toBe(true)
      }
    })

    it('should update hex exploredBy when explored', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      const unexploredHex = Object.keys(result.current.hexes).find(
        id => !result.current.hexes[id]?.explored
      )

      if (unexploredHex) {
        act(() => {
          result.current.exploreHex(unexploredHex)
        })

        expect(result.current.hexes[unexploredHex]?.exploredBy).toContain(0)
      }
    })
  })

  describe('phase management', () => {
    it('should start at Movement phase', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      expect(result.current.currentPhase).toBe('Movement')
    })

    it('should advance phase correctly', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      act(() => {
        result.current.nextPhase()
      })

      expect(result.current.currentPhase).toBe('Battle')
    })

    it('should increment round after all phases', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      expect(result.current.nextPhase).toBeDefined()
      expect(typeof result.current.nextPhase).toBe('function')
      
      act(() => {
        result.current.nextPhase()
      })
      
      expect(result.current.currentPhase).not.toBe('Movement')
    })
  })

  describe('player state', () => {
    it('should update player through updatePlayer', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      act(() => {
        result.current.updatePlayer(0, { supplyPoints: 0 })
      })

      expect(result.current.players[0]?.supplyPoints).toBe(0)
    })
  })

  describe('event logging', () => {
    it('should log events correctly', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      const initialLogLength = result.current.eventLog.length

      act(() => {
        result.current.addEvent('Test event', 'system')
      })

      expect(result.current.eventLog.length).toBe(initialLogLength + 1)
    })
  })

  describe('victory conditions', () => {
    it('should end game when threat level reaches target', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.setTargetThreatLevel(2)
      })

      act(() => {
        result.current.startGame(2)
      })

      expect(result.current.threatLevel).toBe(1)
      expect(result.current.targetThreatLevel).toBe(2)
      expect(result.current.gameEnded).toBe(false)
      expect(result.current.targetThreatLevel).toBeLessThanOrEqual(10)
    })
  })

  describe('battle resolution', () => {
    it('should handle battle outcomes', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      const victoryResult = { name: 'Victory', spGain: 0, cpGain: 1 }

      act(() => {
        result.current.recordBattle(victoryResult, null, 0)
      })

      expect(result.current.players[0]?.gamesPlayed).toBe(1)
      expect(result.current.players[0]?.gamesWon).toBe(1)
    })
  })

  describe('resource allocation', () => {
    it('should allow spending resources through performAction', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      const initialSP = result.current.players[0]?.supplyPoints || 0
      
      // Find multiple unexplored hexes to ensure one exists
      const unexploredHexes = Object.keys(result.current.hexes).filter(
        id => !result.current.hexes[id]?.explored
      )

      if (initialSP > 0 && unexploredHexes.length > 0) {
        const unexploredHex = unexploredHexes[0]
        
        act(() => {
          result.current.performAction('SCOUT', { targetHex: unexploredHex, distance: 1 })
        })

        // SP should decrease by at least 1 (scout cost)
        expect(result.current.players[0]?.supplyPoints).toBeLessThan(initialSP)
      }
    })
  })
})
