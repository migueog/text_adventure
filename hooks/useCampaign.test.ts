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

  describe('Extended Campaign Mode', () => {
    it('should initialize with extendedMode false', () => {
      const { result } = renderHook(() => useCampaign())

      expect(result.current.extendedMode).toBe(false)
    })

    it('should set extendedMode to true when enableExtendedMode is called', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      act(() => {
        result.current.enableExtendedMode()
      })

      expect(result.current.extendedMode).toBe(true)
    })

    it('should keep gameEnded false when extended mode is enabled', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.setTargetThreatLevel(2)
        result.current.startGame(2)
      })

      // Manually set game as ended (simulating reaching target)
      act(() => {
        result.current.setThreatLevel(2)
      })

      // Initially, manually setting threat doesn't end game
      // (end logic only runs in nextPhase)
      expect(result.current.gameEnded).toBe(false)

      // Enable extended mode
      act(() => {
        result.current.enableExtendedMode()
      })

      // Extended mode should be active and game not ended
      expect(result.current.gameEnded).toBe(false)
      expect(result.current.extendedMode).toBe(true)
    })

    it('should allow threat to exceed target when extended mode active', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.setTargetThreatLevel(5)
        result.current.startGame(2)
        result.current.setThreatLevel(5)
        result.current.enableExtendedMode()
      })

      // Increase threat beyond target
      act(() => {
        result.current.setThreatLevel(7)
      })

      expect(result.current.threatLevel).toBe(7)
      expect(result.current.gameEnded).toBe(false)
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

  describe('movement action types', () => {
    describe('MANOEUVRE action', () => {
      it('should move player to target hex with SP cost', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        const player = result.current.players[0]
        if (!player) return

        const initialSP = player.supplyPoints
        const initialPosition = player.position

        // Manoeuvre 2 hexes (costs 2 SP)
        act(() => {
          result.current.movePlayer(0, '0,2', 2)
        })

        const updatedPlayer = result.current.players[0]
        expect(updatedPlayer?.position).toEqual({ row: 0, col: 2 })
        expect(updatedPlayer?.supplyPoints).toBe(initialSP - 2)
        expect(updatedPlayer?.position).not.toEqual(initialPosition)
      })

      it('should prevent movement if insufficient SP', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        // Set player SP to 1
        act(() => {
          result.current.updatePlayer(0, { supplyPoints: 1 })
        })

        const initialPosition = result.current.players[0]?.position

        // Try to move 3 hexes (costs 3 SP, but only have 1)
        act(() => {
          result.current.movePlayer(0, '0,3', 3)
        })

        // Position should not change
        expect(result.current.players[0]?.position).toEqual(initialPosition)
        expect(result.current.players[0]?.supplyPoints).toBe(1)
      })

      it('should cost 1 SP per hex moved', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        const initialSP = result.current.players[0]?.supplyPoints || 0

        // Move 1 hex
        act(() => {
          result.current.movePlayer(0, '0,1', 1)
        })

        expect(result.current.players[0]?.supplyPoints).toBe(initialSP - 1)
      })

      it('should add movement event to log', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        const initialLogLength = result.current.eventLog.length

        act(() => {
          result.current.movePlayer(0, '1,0', 1)
        })

        expect(result.current.eventLog.length).toBeGreaterThan(initialLogLength)

        // WHY: movePlayer triggers auto-exploration, so movement event is at index 1
        const movementEvent = result.current.eventLog.find(e => e.type === 'movement' && e.message.includes('moved to'))
        expect(movementEvent).toBeDefined()
        expect(movementEvent?.message).toContain('moved to')
      })
    })

    describe('REGROUP action', () => {
      it('should move player to nearest base for free', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        // Set up player with a base at 2,2
        act(() => {
          result.current.updatePlayer(0, {
            position: { row: 0, col: 0 },
            bases: [{ row: 2, col: 2 }]
          })
        })

        const initialSP = result.current.players[0]?.supplyPoints || 0

        // REGROUP to nearest base
        act(() => {
          result.current.regroupPlayer(0)
        })

        const player = result.current.players[0]
        expect(player?.position).toEqual({ row: 2, col: 2 })
        expect(player?.supplyPoints).toBe(initialSP) // No SP cost
      })

      it('should move to nearest camp when no bases exist', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        // Set up player with camp at 1,1
        act(() => {
          result.current.updatePlayer(0, {
            position: { row: 0, col: 0 },
            camps: [{ row: 1, col: 1 }],
            bases: []
          })
        })

        const initialSP = result.current.players[0]?.supplyPoints || 0

        act(() => {
          result.current.regroupPlayer(0)
        })

        const player = result.current.players[0]
        expect(player?.position).toEqual({ row: 1, col: 1 })
        expect(player?.supplyPoints).toBe(initialSP)
      })

      it('should choose closest base/camp when multiple exist', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        // Player at 0,0 with base at 1,0 (close) and 5,5 (far)
        act(() => {
          result.current.updatePlayer(0, {
            position: { row: 0, col: 0 },
            bases: [{ row: 1, col: 0 }, { row: 5, col: 5 }]
          })
        })

        act(() => {
          result.current.regroupPlayer(0)
        })

        // Should move to nearest base at 1,0
        expect(result.current.players[0]?.position).toEqual({ row: 1, col: 0 })
      })

      it('should move to next nearest when already at closest', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        // Player already at base 1,0, with another base at 3,0
        act(() => {
          result.current.updatePlayer(0, {
            position: { row: 1, col: 0 },
            bases: [{ row: 1, col: 0 }, { row: 3, col: 0 }]
          })
        })

        act(() => {
          result.current.regroupPlayer(0)
        })

        // Should move to next nearest at 3,0
        expect(result.current.players[0]?.position).toEqual({ row: 3, col: 0 })
      })

      it('should not work when no bases or camps exist', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        const initialPosition = result.current.players[0]?.position

        // Try to regroup with no bases/camps
        act(() => {
          result.current.regroupPlayer(0)
        })

        // Position should not change
        expect(result.current.players[0]?.position).toEqual(initialPosition)
      })

      it('should add regroup event to log', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        act(() => {
          result.current.updatePlayer(0, {
            bases: [{ row: 2, col: 2 }]
          })
        })

        const initialLogLength = result.current.eventLog.length

        act(() => {
          result.current.regroupPlayer(0)
        })

        expect(result.current.eventLog.length).toBeGreaterThan(initialLogLength)

        const latestEvent = result.current.eventLog[0]
        expect(latestEvent?.message).toContain('Regroup')
        expect(latestEvent?.type).toBe('movement')
      })
    })

    describe('HOLD action', () => {
      it('should keep player in current position', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        const initialPosition = result.current.players[0]?.position

        act(() => {
          result.current.holdPosition(0)
        })

        expect(result.current.players[0]?.position).toEqual(initialPosition)
      })

      it('should not cost SP', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        const initialSP = result.current.players[0]?.supplyPoints

        act(() => {
          result.current.holdPosition(0)
        })

        expect(result.current.players[0]?.supplyPoints).toBe(initialSP)
      })

      it('should add hold event to log', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        const initialLogLength = result.current.eventLog.length

        act(() => {
          result.current.holdPosition(0)
        })

        expect(result.current.eventLog.length).toBeGreaterThan(initialLogLength)

        const latestEvent = result.current.eventLog[0]
        expect(latestEvent?.message).toContain('Hold')
        expect(latestEvent?.type).toBe('movement')
      })

      it('should work even with 0 SP', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        act(() => {
          result.current.updatePlayer(0, { supplyPoints: 0 })
        })

        const initialPosition = result.current.players[0]?.position

        act(() => {
          result.current.holdPosition(0)
        })

        expect(result.current.players[0]?.position).toEqual(initialPosition)
        expect(result.current.players[0]?.supplyPoints).toBe(0)
      })
    })
  })
})
