import { describe, it, expect, vi, afterEach } from 'vitest'
import { initializeIntelHex, gainIntel, canUseIntelScout } from './intel'
import type { Hex, Player } from '@/types/campaign'
import * as dice from '@/lib/utils/dice'

// Helper to create test hex
function createTestHex(
  id: string,
  type: Hex['type'],
  location: number,
  intelRemaining?: number
): Hex {
  return {
    id,
    row: 0,
    col: 0,
    type,
    location,
    condition: 0,
    explored: true,
    exploredBy: [],
    state: intelRemaining !== undefined ? { intelRemaining } : undefined
  }
}

// Helper to create test player
function createTestPlayer(id: number, intelCount: number = 0): Player {
  return {
    id,
    name: `Player ${id + 1}`,
    killTeamName: `Kill Team ${id + 1}`,
    color: '#ffffff',
    position: { row: 0, col: 0 },
    supplyPoints: 5,
    campaignPoints: 0,
    exploredHexes: 0,
    operativesKilled: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    bases: [{ row: 0, col: 0 }],
    camps: [],
    history: [],
    priority: 0,
    battleResult: null,
    searchedHexes: [],
    battleHistory: [],
    intelCount
  }
}

describe('Intel System (Issue #59)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initializeIntelHex', () => {
    it('should add D6 intel to hex state', () => {
      const rollD6Spy = vi.spyOn(dice, 'rollD6').mockReturnValue(4)
      const hex = createTestHex('0,0', 'surface', 31)

      const result = initializeIntelHex(hex)

      expect(result.state?.intelRemaining).toBe(4)
      expect(rollD6Spy).toHaveBeenCalledOnce()
      rollD6Spy.mockRestore()
    })

    it('should return intel between 1-6', () => {
      const hex = createTestHex('0,0', 'surface', 31)

      // Run multiple times to test randomness
      for (let i = 0; i < 20; i++) {
        const result = initializeIntelHex(hex)
        expect(result.state?.intelRemaining).toBeGreaterThanOrEqual(1)
        expect(result.state?.intelRemaining).toBeLessThanOrEqual(6)
      }
    })

    it('should preserve existing hex properties', () => {
      const hex = createTestHex('1,2', 'tomb', 31)
      hex.explored = true
      hex.exploredBy = [0, 1]

      const result = initializeIntelHex(hex)

      expect(result.id).toBe('1,2')
      expect(result.type).toBe('tomb')
      expect(result.location).toBe(31)
      expect(result.explored).toBe(true)
      expect(result.exploredBy).toEqual([0, 1])
    })

    it('should create state object if it does not exist', () => {
      const hex = createTestHex('0,0', 'surface', 31)
      expect(hex.state).toBeUndefined()

      const result = initializeIntelHex(hex)

      expect(result.state).toBeDefined()
      expect(result.state?.intelRemaining).toBeGreaterThanOrEqual(1)
    })

    it('should preserve other state properties', () => {
      const hex = createTestHex('0,0', 'surface', 31)
      hex.state = { supplyCount: 5, portalDestination: '2,3' }

      const result = initializeIntelHex(hex)

      expect(result.state?.supplyCount).toBe(5)
      expect(result.state?.portalDestination).toBe('2,3')
      expect(result.state?.intelRemaining).toBeGreaterThanOrEqual(1)
    })
  })

  describe('gainIntel', () => {
    it('should gain D3 intel when hex has enough', () => {
      const rollD3Spy = vi.spyOn(dice, 'rollD3').mockReturnValue(2)
      const hex = createTestHex('0,0', 'surface', 31, 5)
      const player = createTestPlayer(0, 0)

      const result = gainIntel(hex, player)

      expect(result.intelGained).toBe(2)
      expect(result.remaining).toBe(3)
      expect(result.playerIntelCount).toBe(2)
      expect(rollD3Spy).toHaveBeenCalledOnce()
      rollD3Spy.mockRestore()
    })

    it('should cap gain by remaining intel', () => {
      const rollD3Spy = vi.spyOn(dice, 'rollD3').mockReturnValue(3)
      const hex = createTestHex('0,0', 'surface', 31, 2)  // Only 2 intel left
      const player = createTestPlayer(0, 1)

      const result = gainIntel(hex, player)

      expect(result.intelGained).toBe(2)  // Capped at remaining
      expect(result.remaining).toBe(0)
      expect(result.playerIntelCount).toBe(3)  // 1 + 2
      rollD3Spy.mockRestore()
    })

    it('should gain 0 intel when hex is depleted', () => {
      const hex = createTestHex('0,0', 'surface', 31, 0)
      const player = createTestPlayer(0, 5)

      const result = gainIntel(hex, player)

      expect(result.intelGained).toBe(0)
      expect(result.remaining).toBe(0)
      expect(result.playerIntelCount).toBe(5)  // Unchanged
    })

    it('should add to existing player intel count', () => {
      const rollD3Spy = vi.spyOn(dice, 'rollD3').mockReturnValue(1)
      const hex = createTestHex('0,0', 'surface', 31, 4)
      const player = createTestPlayer(0, 3)

      const result = gainIntel(hex, player)

      expect(result.intelGained).toBe(1)
      expect(result.playerIntelCount).toBe(4)  // 3 + 1
      rollD3Spy.mockRestore()
    })

    it('should handle player with undefined intelCount', () => {
      const rollD3Spy = vi.spyOn(dice, 'rollD3').mockReturnValue(2)
      const hex = createTestHex('0,0', 'surface', 31, 5)
      const player = createTestPlayer(0, 0)
      delete player.intelCount  // Simulate undefined

      const result = gainIntel(hex, player)

      expect(result.intelGained).toBe(2)
      expect(result.playerIntelCount).toBe(2)  // 0 + 2
      rollD3Spy.mockRestore()
    })

    it('should return 0 when hex has no state', () => {
      const hex = createTestHex('0,0', 'surface', 31)
      const player = createTestPlayer(0, 2)

      const result = gainIntel(hex, player)

      expect(result.intelGained).toBe(0)
      expect(result.remaining).toBe(0)
      expect(result.playerIntelCount).toBe(2)
    })

    it('should return D3 values between 1-3 when not capped', () => {
      const hex = createTestHex('0,0', 'surface', 31, 10)  // Plenty of intel
      const player = createTestPlayer(0, 0)

      // Run multiple times to test randomness
      for (let i = 0; i < 20; i++) {
        const result = gainIntel(hex, player)
        expect(result.intelGained).toBeGreaterThanOrEqual(0)
        expect(result.intelGained).toBeLessThanOrEqual(3)
      }
    })
  })

  describe('canUseIntelScout', () => {
    it('should allow intel scout to surface hex', () => {
      const player = createTestPlayer(0, 3)
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'surface', 14)
      }

      const result = canUseIntelScout(player, '1,1', hexes)

      expect(result.canScout).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should prevent intel scout when player has no intel', () => {
      const player = createTestPlayer(0, 0)
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'surface', 14)
      }

      const result = canUseIntelScout(player, '1,1', hexes)

      expect(result.canScout).toBe(false)
      expect(result.reason).toBe('No intel available (need 1)')
    })

    it('should prevent intel scout to tomb hex', () => {
      const player = createTestPlayer(0, 5)
      const hexes: Record<string, Hex> = {
        '2,2': createTestHex('2,2', 'tomb', 25)
      }

      const result = canUseIntelScout(player, '2,2', hexes)

      expect(result.canScout).toBe(false)
      expect(result.reason).toBe('Intel scouts can only target surface hexes')
    })

    it('should prevent intel scout to blocked hex', () => {
      const player = createTestPlayer(0, 3)
      const hexes: Record<string, Hex> = {
        '3,3': createTestHex('3,3', 'blocked', 0)
      }

      const result = canUseIntelScout(player, '3,3', hexes)

      expect(result.canScout).toBe(false)
      expect(result.reason).toBe('Intel scouts can only target surface hexes')
    })

    it('should prevent intel scout when hex does not exist', () => {
      const player = createTestPlayer(0, 2)
      const hexes: Record<string, Hex> = {}

      const result = canUseIntelScout(player, '9,9', hexes)

      expect(result.canScout).toBe(false)
      expect(result.reason).toBe('Invalid target hex')
    })

    it('should handle player with undefined intelCount as 0', () => {
      const player = createTestPlayer(0, 0)
      delete player.intelCount  // Simulate undefined
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'surface', 14)
      }

      const result = canUseIntelScout(player, '1,1', hexes)

      expect(result.canScout).toBe(false)
      expect(result.reason).toBe('No intel available (need 1)')
    })
  })
})
