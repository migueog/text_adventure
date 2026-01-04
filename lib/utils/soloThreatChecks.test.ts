/**
 * WHY: Unit tests for solo mode threat check utilities (Issue #54)
 *
 * Tests all threat check functions with mocked dice rolls.
 * Coverage: 100% of all functions and branches.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Player, Hex } from '@/types/campaign'
import {
  checkTombExplorationThreat,
  checkBattleThreat,
  checkSearchThreat,
  executeTrophyHallThreat,
  executeVoidShieldThreat,
  calculateResupplyReduction,
  executeResupplyReduction,
  isTrophyHall,
  isVoidShieldGenerator
} from './soloThreatChecks'
import * as dice from './dice'

describe('soloThreatChecks', () => {
  // WHY: Spy on dice functions to control random results
  let rollD6Spy: ReturnType<typeof vi.spyOn>
  let rollD3Spy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    rollD6Spy = vi.spyOn(dice, 'rollD6')
    rollD3Spy = vi.spyOn(dice, 'rollD3')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('checkTombExplorationThreat', () => {
    it('should return success when D6 roll is 4 or higher', () => {
      rollD6Spy.mockReturnValue(4)

      const result = checkTombExplorationThreat()

      expect(result.trigger).toBe('TOMB_EXPLORATION')
      expect(result.roll).toBe(4)
      expect(result.threshold).toBe(4)
      expect(result.success).toBe(true)
      expect(result.increase).toBe(1)
      expect(result.preventable).toBe(false)
      expect(result.prevented).toBe(false)
    })

    it('should return failure when D6 roll is below 4', () => {
      rollD6Spy.mockReturnValue(3)

      const result = checkTombExplorationThreat()

      expect(result.success).toBe(false)
      expect(result.increase).toBe(0)
    })

    it('should include descriptive event log message', () => {
      rollD6Spy.mockReturnValue(5)

      const result = checkTombExplorationThreat()

      expect(result.description).toContain('Tomb exploration')
      expect(result.description).toContain('5')
      expect(result.description).toContain('4+')
    })
  })

  describe('checkBattleThreat', () => {
    it('should use 3+ threshold for WIN', () => {
      rollD6Spy.mockReturnValue(3)

      const result = checkBattleThreat('WIN')

      expect(result.trigger).toBe('BATTLE_WIN')
      expect(result.triggerName).toBe('Battle Win')
      expect(result.threshold).toBe(3)
      expect(result.success).toBe(true)
      expect(result.increase).toBe(1)
    })

    it('should use 5+ threshold for LOSS', () => {
      rollD6Spy.mockReturnValue(5)

      const result = checkBattleThreat('LOSS')

      expect(result.trigger).toBe('BATTLE_LOSS_DRAW')
      expect(result.triggerName).toBe('Battle Loss/Draw')
      expect(result.threshold).toBe(5)
      expect(result.success).toBe(true)
      expect(result.increase).toBe(1)
    })

    it('should use 5+ threshold for DRAW', () => {
      rollD6Spy.mockReturnValue(6)

      const result = checkBattleThreat('DRAW')

      expect(result.trigger).toBe('BATTLE_LOSS_DRAW')
      expect(result.threshold).toBe(5)
      expect(result.success).toBe(true)
    })

    it('should return no check for BYE result', () => {
      const result = checkBattleThreat('BYE')

      expect(result.success).toBe(false)
      expect(result.increase).toBe(0)
      expect(result.roll).toBe(0)
      expect(result.threshold).toBeUndefined()
      expect(result.description).toContain('BYE')
    })

    it('should fail when roll is below threshold', () => {
      rollD6Spy.mockReturnValue(2)

      const result = checkBattleThreat('WIN')

      expect(result.success).toBe(false)
      expect(result.increase).toBe(0)
    })
  })

  describe('checkSearchThreat', () => {
    it('should use 5+ threshold', () => {
      rollD6Spy.mockReturnValue(5)

      const result = checkSearchThreat()

      expect(result.trigger).toBe('SEARCH_ACTION')
      expect(result.threshold).toBe(5)
      expect(result.success).toBe(true)
      expect(result.increase).toBe(1)
    })

    it('should be marked as preventable', () => {
      rollD6Spy.mockReturnValue(6)

      const result = checkSearchThreat()

      expect(result.preventable).toBe(true)
      expect(result.prevented).toBe(false)
    })

    it('should fail when roll is below 5', () => {
      rollD6Spy.mockReturnValue(4)

      const result = checkSearchThreat()

      expect(result.success).toBe(false)
      expect(result.increase).toBe(0)
    })

    it('should mention prevention in description when successful', () => {
      rollD6Spy.mockReturnValue(5)

      const result = checkSearchThreat()

      expect(result.description).toContain('can prevent with 1 SP')
    })
  })

  describe('executeTrophyHallThreat', () => {
    it('should roll D3 for increase amount', () => {
      rollD3Spy.mockReturnValue(2)

      const result = executeTrophyHallThreat()

      expect(result.trigger).toBe('TROPHY_HALL_DEMOLISH')
      expect(result.roll).toBe(2)
      expect(result.increase).toBe(2)
    })

    it('should be automatic (no threshold)', () => {
      rollD3Spy.mockReturnValue(1)

      const result = executeTrophyHallThreat()

      expect(result.threshold).toBeUndefined()
      expect(result.success).toBe(true)
    })

    it('should not be preventable', () => {
      rollD3Spy.mockReturnValue(3)

      const result = executeTrophyHallThreat()

      expect(result.preventable).toBe(false)
      expect(result.prevented).toBe(false)
    })

    it('should include D3 amount in description', () => {
      rollD3Spy.mockReturnValue(3)

      const result = executeTrophyHallThreat()

      expect(result.description).toContain('3')
      expect(result.description).toContain('D3')
    })
  })

  describe('executeVoidShieldThreat', () => {
    it('should roll D3 for increase amount', () => {
      rollD3Spy.mockReturnValue(1)

      const result = executeVoidShieldThreat()

      expect(result.trigger).toBe('VOID_SHIELD_SEARCH')
      expect(result.roll).toBe(1)
      expect(result.increase).toBe(1)
    })

    it('should be automatic (no threshold)', () => {
      rollD3Spy.mockReturnValue(2)

      const result = executeVoidShieldThreat()

      expect(result.threshold).toBeUndefined()
      expect(result.success).toBe(true)
    })

    it('should not be preventable', () => {
      rollD3Spy.mockReturnValue(2)

      const result = executeVoidShieldThreat()

      expect(result.preventable).toBe(false)
    })
  })

  describe('calculateResupplyReduction', () => {
    const mockPlayer: Player = {
      id: 1,  // WHY: Player.id is number, not string
      name: 'Test Player',
      color: '#ff0000',
      killTeamName: 'Test Team',
      position: { row: 0, col: 0 },
      bases: [],
      camps: [],
      supplyPoints: 5,
      campaignPoints: 0,
      exploredHexes: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      operativesKilled: 0,
      history: [],
      battleResult: null,
      searchedHexes: [],
      battleHistory: [],
      backstory: ''
    }

    it('should return null if no uses remaining', () => {
      const mockHex: Hex = {
        id: 'hex1',
        row: 0,
        col: 0,
        type: 'tomb',
        location: 1,
        condition: 1,
        explored: true,
        exploredBy: []
      }

      const result = calculateResupplyReduction(mockPlayer, mockHex, 0)

      expect(result).toBeNull()
    })

    it('should return D3 reduction at base', () => {
      const baseHex: Hex = {
        id: 'hex1',
        row: 0,
        col: 0,
        type: 'surface',
        location: 0,  // SL00 = location 0
        condition: 1,
        explored: true,
        exploredBy: []
      }

      const result = calculateResupplyReduction(mockPlayer, baseHex, 3)

      expect(result).not.toBeNull()
      expect(result?.location).toBe('base')
      expect(result?.reductionAmount).toBe('D3')
      expect(result?.usesRemaining).toBe(3)
    })

    it('should return D3 reduction at camp', () => {
      const campHex: Hex = {
        id: 'hex1',
        row: 2,
        col: 3,
        type: 'tomb',
        location: 1,
        condition: 1,
        explored: true,
        exploredBy: []
      }

      // WHY: Player has a camp at this hex position
      const playerWithCamp: Player = {
        ...mockPlayer,
        camps: [{ row: 2, col: 3 }]
      }

      const result = calculateResupplyReduction(playerWithCamp, campHex, 2)

      expect(result).not.toBeNull()
      expect(result?.location).toBe('camp')
      expect(result?.reductionAmount).toBe('D3')
    })

    it('should return 1 reduction at other locations', () => {
      const otherHex: Hex = {
        id: 'hex1',
        row: 1,
        col: 1,
        type: 'tomb',
        location: 1,
        condition: 1,
        explored: true,
        exploredBy: []
      }

      const result = calculateResupplyReduction(mockPlayer, otherHex, 1)

      expect(result).not.toBeNull()
      expect(result?.location).toBe('other')
      expect(result?.reductionAmount).toBe(1)
    })

    it('should track remaining uses correctly', () => {
      const hex: Hex = {
        id: 'hex1',
        row: 1,
        col: 1,
        type: 'tomb',
        location: 1,
        condition: 1,
        explored: true,
        exploredBy: []
      }

      const result = calculateResupplyReduction(mockPlayer, hex, 2)

      expect(result?.usesRemaining).toBe(2)
      expect(result?.available).toBe(true)
    })
  })

  describe('executeResupplyReduction', () => {
    it('should roll D3 when reduction amount is D3', () => {
      rollD3Spy.mockReturnValue(2)

      const mockResult = {
        available: true,
        usesRemaining: 3,
        reductionAmount: 'D3' as const,
        location: 'base' as const
      }

      const amount = executeResupplyReduction(mockResult)

      expect(amount).toBe(2)
      expect(rollD3Spy).toHaveBeenCalled()
    })

    it('should return fixed amount when not D3', () => {
      const mockResult = {
        available: true,
        usesRemaining: 1,
        reductionAmount: 1,
        location: 'other' as const
      }

      const amount = executeResupplyReduction(mockResult)

      expect(amount).toBe(1)
      expect(rollD3Spy).not.toHaveBeenCalled()
    })
  })

  describe('isTrophyHall', () => {
    it('should return true for TL24', () => {
      const trophyHallHex: Hex = {
        id: 'hex1',
        row: 0,
        col: 0,
        type: 'tomb',
        location: 24,  // TL24 = location 24
        condition: 1,
        explored: true,
        exploredBy: []
      }

      expect(isTrophyHall(trophyHallHex)).toBe(true)
    })

    it('should return false for other locations', () => {
      const otherHex: Hex = {
        id: 'hex1',
        row: 0,
        col: 0,
        type: 'tomb',
        location: 1,  // TL01 = location 1
        condition: 1,
        explored: true,
        exploredBy: []
      }

      expect(isTrophyHall(otherHex)).toBe(false)
    })
  })

  describe('isVoidShieldGenerator', () => {
    it('should return true for TL35', () => {
      const voidShieldHex: Hex = {
        id: 'hex1',
        row: 0,
        col: 0,
        type: 'tomb',
        location: 35,  // TL35 = location 35
        condition: 1,
        explored: true,
        exploredBy: []
      }

      expect(isVoidShieldGenerator(voidShieldHex)).toBe(true)
    })

    it('should return false for other locations', () => {
      const otherHex: Hex = {
        id: 'hex1',
        row: 0,
        col: 0,
        type: 'tomb',
        location: 24,  // TL24 = location 24
        condition: 1,
        explored: true,
        exploredBy: []
      }

      expect(isVoidShieldGenerator(otherHex)).toBe(false)
    })
  })
})
