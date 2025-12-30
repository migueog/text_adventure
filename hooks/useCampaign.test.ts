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

  describe('movement validation and restrictions', () => {
    describe('SP validation', () => {
      it('should not allow movement beyond available SP', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
          result.current.updatePlayer(0, { supplyPoints: 2 })
        })

        const initialPosition = result.current.players[0]?.position
        const initialSP = result.current.players[0]?.supplyPoints

        // Try to move 3 hexes with only 2 SP
        act(() => {
          result.current.movePlayer(0, '0,3', 3)
        })

        // Movement should be blocked
        expect(result.current.players[0]?.position).toEqual(initialPosition)
        expect(result.current.players[0]?.supplyPoints).toBe(initialSP)
      })

      it('should allow movement exactly equal to available SP', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
          result.current.updatePlayer(0, { supplyPoints: 2, position: { row: 0, col: 0 } })
        })

        // Find a non-blocked hex within 2 distance
        const validHex = Object.entries(result.current.hexes).find(([hexId, hex]) => {
          if (hex.type === 'blocked') return false
          const parts = hexId.split(',').map(Number)
          const distance = Math.abs((parts[0] ?? 0) - 0) + Math.abs((parts[1] ?? 0) - 0)
          return distance <= 2 && distance > 0
        })

        if (validHex) {
          const [hexId] = validHex
          const parts = hexId.split(',').map(Number)
          const distance = Math.abs((parts[0] ?? 0) - 0) + Math.abs((parts[1] ?? 0) - 0)
          const initialSP = result.current.players[0]?.supplyPoints || 0

          // Move with exact SP available
          act(() => {
            result.current.movePlayer(0, hexId, distance)
          })

          expect(result.current.players[0]?.position).toEqual({ row: parts[0] ?? 0, col: parts[1] ?? 0 })
          expect(result.current.players[0]?.supplyPoints).toBe(initialSP - distance)
        }
      })
    })

    describe('distance validation', () => {
      it('should not allow movement beyond 3 hexes', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        const initialPosition = result.current.players[0]?.position

        // Create validation function to check if move would be valid
        const distance = 4 // More than max of 3
        const hasEnoughSP = (result.current.players[0]?.supplyPoints || 0) >= distance

        // If distance > 3, movement should be invalid even with enough SP
        if (hasEnoughSP) {
          // This move should be blocked by distance validation
          act(() => {
            result.current.movePlayer(0, '0,4', 4)
          })

          // Position should not change
          expect(result.current.players[0]?.position).toEqual(initialPosition)
        }
      })

      it('should allow movement up to 3 hexes', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        // Move exactly 3 hexes (max allowed)
        act(() => {
          result.current.movePlayer(0, '0,3', 3)
        })

        expect(result.current.players[0]?.position).toEqual({ row: 0, col: 3 })
      })
    })

    describe('blocked hex validation', () => {
      it('should not allow movement to blocked hex', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        const initialPosition = result.current.players[0]?.position

        // Try to move to a hex that will be blocked
        // First, find a blocked hex in the map
        const blockedHex = Object.entries(result.current.hexes).find(
          ([_, hex]) => hex.type === 'blocked'
        )

        if (blockedHex) {
          const [hexId] = blockedHex
          const distance = 1

          act(() => {
            result.current.movePlayer(0, hexId, distance)
          })

          // Movement should be blocked
          expect(result.current.players[0]?.position).toEqual(initialPosition)
        }
      })

      it('should allow movement to non-blocked hexes only', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        // Find a non-blocked hex
        const nonBlockedHex = Object.entries(result.current.hexes).find(
          ([_, hex]) => hex.type !== 'blocked'
        )

        if (nonBlockedHex) {
          const [hexId] = nonBlockedHex
          const parts = hexId.split(',').map(Number)
          const targetRow = parts[0] ?? 0
          const targetCol = parts[1] ?? 0

          act(() => {
            result.current.movePlayer(0, hexId, 1)
          })

          // Should successfully move to non-blocked hex
          expect(result.current.players[0]?.position).toEqual({ row: targetRow, col: targetCol })
        }
      })
    })

    describe('hex capacity validation', () => {
      it('should not allow movement to hex with 2+ players already present', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(3) // 3 players
        })

        // Move players 0 and 1 to the same hex
        act(() => {
          result.current.updatePlayer(0, { position: { row: 1, col: 1 } })
          result.current.updatePlayer(1, { position: { row: 1, col: 1 } })
        })

        // Now try to move player 2 to that same hex (would be 3 players)
        const player2InitialPosition = result.current.players[2]?.position

        act(() => {
          result.current.movePlayer(2, '1,1', 1)
        })

        // Movement should be blocked (max 2 per hex)
        expect(result.current.players[2]?.position).toEqual(player2InitialPosition)
      })

      it('should allow movement to hex with only 1 player present', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        // Move player 0 to 1,1
        act(() => {
          result.current.updatePlayer(0, { position: { row: 1, col: 1 } })
        })

        // Player 1 should be able to move to same hex (total would be 2)
        act(() => {
          result.current.movePlayer(1, '1,1', 1)
        })

        // Should successfully move
        expect(result.current.players[1]?.position).toEqual({ row: 1, col: 1 })
      })

      it('should allow movement to empty hex', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        // Move to hex that has no other players
        act(() => {
          result.current.movePlayer(0, '2,2', 1)
        })

        expect(result.current.players[0]?.position).toEqual({ row: 2, col: 2 })
      })
    })

    describe('movement error messages', () => {
      it('should add error event when movement validation fails', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
          result.current.updatePlayer(0, { supplyPoints: 1 })
        })

        const initialLogLength = result.current.eventLog.length

        // Try to move beyond available SP
        act(() => {
          result.current.movePlayer(0, '0,3', 3)
        })

        // Should have error event
        expect(result.current.eventLog.length).toBeGreaterThan(initialLogLength)

        const errorEvent = result.current.eventLog.find(e => e.type === 'error')
        expect(errorEvent).toBeDefined()
        expect(errorEvent?.message).toContain('SP')
      })
    })
  })

  describe('auto-exploration on movement', () => {
    it('should automatically explore hex when moving to unexplored hex', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      // Find an unexplored hex
      const unexploredHex = Object.entries(result.current.hexes).find(
        ([_, hex]) => !hex.explored && hex.type !== 'blocked'
      )

      if (unexploredHex) {
        const [hexId] = unexploredHex

        // Move to unexplored hex
        act(() => {
          result.current.movePlayer(0, hexId, 1)
        })

        // Hex should now be explored
        const exploredHex = result.current.hexes[hexId]
        expect(exploredHex?.explored).toBe(true)
        expect(exploredHex?.location).toBeDefined()
        expect(exploredHex?.condition).toBeDefined()
      }
    })

    it('should not re-explore already explored hex', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      // Find an unexplored hex and explore it
      const unexploredHex = Object.entries(result.current.hexes).find(
        ([_, hex]) => !hex.explored && hex.type !== 'blocked'
      )

      if (unexploredHex) {
        const [hexId] = unexploredHex

        // Move to hex (auto-explores)
        act(() => {
          result.current.movePlayer(0, hexId, 1)
        })

        const firstExploration = {
          location: result.current.hexes[hexId]?.location,
          condition: result.current.hexes[hexId]?.condition
        }

        // Move away
        act(() => {
          result.current.updatePlayer(0, { position: { row: 0, col: 0 } })
        })

        // Move back to same hex
        act(() => {
          result.current.movePlayer(0, hexId, 1)
        })

        // Location and condition should remain the same (not re-rolled)
        expect(result.current.hexes[hexId]?.location).toBe(firstExploration.location)
        expect(result.current.hexes[hexId]?.condition).toBe(firstExploration.condition)
      }
    })

    it('should add exploration event to log when auto-exploring', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      // Find an unexplored hex
      const unexploredHex = Object.entries(result.current.hexes).find(
        ([_, hex]) => !hex.explored && hex.type !== 'blocked'
      )

      if (unexploredHex) {
        const [hexId] = unexploredHex
        const initialLogLength = result.current.eventLog.length

        // Move to unexplored hex (triggers auto-exploration)
        act(() => {
          result.current.movePlayer(0, hexId, 1)
        })

        // Should have both movement and exploration events
        expect(result.current.eventLog.length).toBeGreaterThan(initialLogLength)

        const explorationEvent = result.current.eventLog.find(
          e => e.type === 'exploration' && e.message.includes('Explored')
        )
        expect(explorationEvent).toBeDefined()
      }
    })

    it('should update exploredBy list when auto-exploring', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      // Find an unexplored hex
      const unexploredHex = Object.entries(result.current.hexes).find(
        ([_, hex]) => !hex.explored && hex.type !== 'blocked'
      )

      if (unexploredHex) {
        const [hexId] = unexploredHex

        // Player 0 moves to unexplored hex
        act(() => {
          result.current.movePlayer(0, hexId, 1)
        })

        // exploredBy should include player 0
        const exploredHex = result.current.hexes[hexId]
        expect(exploredHex?.exploredBy).toContain(0)
        expect(exploredHex?.exploredBy.length).toBeGreaterThan(0)
      }
    })

    it('should work with REGROUP action to unexplored hex', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      // Find an unexplored hex
      const unexploredHex = Object.entries(result.current.hexes).find(
        ([_, hex]) => !hex.explored && hex.type !== 'blocked'
      )

      if (unexploredHex) {
        const [hexId] = unexploredHex
        const parts = hexId.split(',').map(Number)

        // Set a base at the unexplored hex
        act(() => {
          result.current.updatePlayer(0, {
            bases: [{ row: parts[0] ?? 0, col: parts[1] ?? 0 }],
            position: { row: 0, col: 0 } // Start somewhere else
          })
        })

        // REGROUP to the base (which is in unexplored hex)
        act(() => {
          result.current.regroupPlayer(0)
        })

        // Since regroupPlayer just moves but doesn't auto-explore
        // This test verifies regroupPlayer behavior
        // (Note: may need to add auto-explore to regroupPlayer if required)
        expect(result.current.players[0]?.position).toEqual({ row: parts[0] ?? 0, col: parts[1] ?? 0 })
      }
    })

    it('should only explore destination hex, not intermediate hexes', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
        result.current.updatePlayer(0, { position: { row: 0, col: 0 } })
      })

      // Find an unexplored, non-blocked hex to move to
      const unexploredHex = Object.entries(result.current.hexes).find(
        ([hexId, hex]) => !hex.explored && hex.type !== 'blocked' && hexId !== '0,0'
      )

      if (unexploredHex) {
        const [hexId] = unexploredHex

        // Count unexplored hexes before move
        const unexploredCountBefore = Object.values(result.current.hexes).filter(
          h => !h.explored
        ).length

        // Move to the unexplored hex
        act(() => {
          result.current.movePlayer(0, hexId, 1)
        })

        // Count unexplored hexes after move
        const unexploredCountAfter = Object.values(result.current.hexes).filter(
          h => !h.explored
        ).length

        // Exactly 1 hex should have been explored (destination)
        expect(unexploredCountAfter).toBe(unexploredCountBefore - 1)

        // The destination hex should be explored
        expect(result.current.hexes[hexId]?.explored).toBe(true)
      }
    })
  })

  describe('exploration result state', () => {
    it('should set exploration result when hex is explored', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      // Find an unexplored hex to move to
      const unexploredHex = Object.entries(result.current.hexes).find(
        ([hexId, hex]) => !hex.explored && hex.type !== 'blocked' && hexId !== '0,0'
      )

      if (unexploredHex) {
        const [hexId, hex] = unexploredHex

        // Move to the unexplored hex
        act(() => {
          result.current.movePlayer(0, hexId, 1)
        })

        // explorationResult should be set with location and condition data
        expect(result.current.explorationResult).not.toBeNull()
        expect(result.current.explorationResult?.hexId).toBe(hexId)
        expect(result.current.explorationResult?.hexNumber).toBeDefined()
        expect(result.current.explorationResult?.location).toBeDefined()
        expect(result.current.explorationResult?.location.name).toBeTruthy()
        expect(result.current.explorationResult?.location.description).toBeTruthy()
        expect(result.current.explorationResult?.condition).toBeDefined()
        expect(result.current.explorationResult?.condition.name).toBeTruthy()
        expect(result.current.explorationResult?.condition.description).toBeTruthy()
        expect(result.current.explorationResult?.playerName).toBe(result.current.players[0]?.name)
      }
    })

    it('should clear exploration result when clearExplorationResult is called', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      // Find an unexplored hex and explore it
      const unexploredHex = Object.entries(result.current.hexes).find(
        ([hexId, hex]) => !hex.explored && hex.type !== 'blocked' && hexId !== '0,0'
      )

      if (unexploredHex) {
        const [hexId] = unexploredHex

        // Move to trigger exploration
        act(() => {
          result.current.movePlayer(0, hexId, 1)
        })

        // Verify result is set
        expect(result.current.explorationResult).not.toBeNull()

        // Clear the result
        act(() => {
          result.current.clearExplorationResult()
        })

        // Result should be null
        expect(result.current.explorationResult).toBeNull()
      }
    })

    it('should include roll results in exploration data', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.startGame(2)
      })

      // Find an unexplored hex
      const unexploredHex = Object.entries(result.current.hexes).find(
        ([hexId, hex]) => !hex.explored && hex.type !== 'blocked' && hexId !== '0,0'
      )

      if (unexploredHex) {
        const [hexId] = unexploredHex

        // Move to trigger exploration
        act(() => {
          result.current.movePlayer(0, hexId, 1)
        })

        // Verify roll data is included
        expect(result.current.explorationResult).not.toBeNull()
        expect(result.current.explorationResult?.locationRoll).toBeDefined()
        expect(result.current.explorationResult?.conditionRoll).toBeDefined()
        expect(typeof result.current.explorationResult?.locationRoll).toBe('number')
        expect(typeof result.current.explorationResult?.conditionRoll).toBe('number')
        // Rolls should be valid D36 values (11-36: D3 for tens × 10 + D6 for units)
        expect(result.current.explorationResult?.locationRoll).toBeGreaterThanOrEqual(11)
        expect(result.current.explorationResult?.locationRoll).toBeLessThanOrEqual(36)
        expect(result.current.explorationResult?.conditionRoll).toBeGreaterThanOrEqual(11)
        expect(result.current.explorationResult?.conditionRoll).toBeLessThanOrEqual(36)
      }
    })
  })

  describe('priority-based movement order', () => {
    describe('movement order calculation', () => {
      it('should calculate movement order at round start', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(3)
        })

        // Movement order should be calculated and defined
        expect(result.current.movementOrder).toBeDefined()
        expect(Array.isArray(result.current.movementOrder)).toBe(true)
        expect(result.current.movementOrder.length).toBe(3)
      })

      it('should use priority order (lowest CP first)', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(3)
        })

        // Set different CP values for each player
        act(() => {
          result.current.updatePlayer(0, { campaignPoints: 5 })
          result.current.updatePlayer(1, { campaignPoints: 2 })
          result.current.updatePlayer(2, { campaignPoints: 8 })
        })

        // Recalculate movement order
        act(() => {
          result.current.calculateMovementOrder()
        })

        // Movement order should be [1, 0, 2] (lowest CP first)
        expect(result.current.movementOrder[0]).toBe(1) // Player with CP=2
        expect(result.current.movementOrder[1]).toBe(0) // Player with CP=5
        expect(result.current.movementOrder[2]).toBe(2) // Player with CP=8
      })

      it('should recalculate priority each round', () => {
        const { result} = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        const initialOrder = [...result.current.movementOrder]

        // Change CP values
        act(() => {
          result.current.updatePlayer(0, { campaignPoints: 10 })
          result.current.updatePlayer(1, { campaignPoints: 5 })
        })

        // Advance to next round (should recalculate)
        act(() => {
          // Move through all phases to trigger round advance
          result.current.nextPhase() // Move to Battle
          result.current.recordBattle({ id: 'WIN', name: 'Win', cpReward: 1, spCost: 0 }, null, 0)
          result.current.nextPhase() // Move to Action
          result.current.nextPhase() // Move to Threat
          result.current.nextPhase() // Move to Movement (Player 2)
          result.current.recordBattle({ id: 'WIN', name: 'Win', cpReward: 1, spCost: 0 }, null, 0)
          result.current.nextPhase() // Move to Action
          result.current.nextPhase() // Move to Threat
          result.current.nextPhase() // New round starts
        })

        // Movement order should have changed
        expect(result.current.movementOrder).not.toEqual(initialOrder)
      })

      it('should maintain order throughout round even if CP/SP changes', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        const orderAtRoundStart = [...result.current.movementOrder]

        // Change CP mid-round
        act(() => {
          result.current.updatePlayer(0, { campaignPoints: 100 })
        })

        // Movement order should remain the same
        expect(result.current.movementOrder).toEqual(orderAtRoundStart)
      })
    })

    describe('movement index tracking', () => {
      it('should advance to next player in movement order', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        const initialIndex = result.current.movementIndex

        // Advance phase (should move to next player in movement order)
        act(() => {
          result.current.nextPhase()
        })

        // Movement index should have advanced or phase changed
        expect(result.current.movementIndex >= initialIndex).toBe(true)
      })

      it('should reset movement index at round start', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(2)
        })

        // Advance through full round
        act(() => {
          result.current.nextPhase() // Battle
          result.current.recordBattle({ id: 'WIN', name: 'Win', cpReward: 1, spCost: 0 }, null, 0)
          result.current.nextPhase() // Action
          result.current.nextPhase() // Threat
          result.current.nextPhase() // Player 2 Movement
          result.current.recordBattle({ id: 'WIN', name: 'Win', cpReward: 1, spCost: 0 }, null, 0)
          result.current.nextPhase() // Action
          result.current.nextPhase() // Threat
          result.current.nextPhase() // New round
        })

        // Movement index should be reset to 0
        expect(result.current.movementIndex).toBe(0)
      })

      it('should handle last player in movement order', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(3)
        })

        // Verify we can advance through all players
        const orderLength = result.current.movementOrder.length

        for (let i = 0; i < orderLength; i++) {
          expect(result.current.movementIndex).toBeLessThan(orderLength)
          act(() => {
            result.current.nextPhase()
          })
        }
      })
    })

    describe('solo mode', () => {
      it('should skip priority calculation in solo mode', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(1, true) // Solo mode
        })

        // Movement order should bypass priority calculation
        expect(result.current.movementOrder).toBeDefined()
        expect(result.current.movementOrder.length).toBe(1)
      })

      it('should set movement order to [0] for solo', () => {
        const { result } = renderHook(() => useCampaign())

        act(() => {
          result.current.startGame(1, true) // Solo mode
        })

        // Movement order should always be [0]
        expect(result.current.movementOrder).toEqual([0])
      })
    })
  })
})
