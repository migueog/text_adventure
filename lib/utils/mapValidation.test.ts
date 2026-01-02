import { describe, it, expect } from 'vitest'
import { validateMapState } from './mapValidation'
import type { Hex, Player, HexPosition } from '@/types/campaign'

/**
 * WHY: Test suite for map state validation (Issue #23 - Phase 1)
 * Ensures validation detects all integrity violations
 */

// WHY: Helper to create a minimal valid hex for testing
function createHex(id: string, row: number, col: number, overrides: Partial<Hex> = {}): Hex {
  return {
    id,
    row,
    col,
    type: 'surface',
    location: 11,
    condition: 11,
    explored: false,
    exploredBy: [],
    ...overrides
  }
}

// WHY: Helper to create a minimal valid player for testing
function createPlayer(id: number, name: string, overrides: Partial<Player> = {}): Player {
  const defaultPosition: HexPosition = { row: 0, col: 0 }
  return {
    id,
    name,
    killTeamName: `Team ${id}`,
    color: '#000000',
    position: defaultPosition,
    supplyPoints: 10,
    campaignPoints: 0,
    exploredHexes: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    operativesKilled: 0,
    bases: [defaultPosition],
    camps: [],
    history: [],
    battleResult: null,
    searchedHexes: [],
    battleHistory: [],
    supplyPointsSpent: 0,
    operativeKillDetails: [],
    ...overrides
  }
}

describe('validateMapState', () => {
  describe('when map is valid', () => {
    it('should return valid result with no errors', () => {
      const hexes: Record<string, Hex> = {
        '0,0': createHex('0,0', 0, 0),
        '0,1': createHex('0,1', 0, 1),
        '1,0': createHex('1,0', 1, 0)
      }
      const players: Player[] = [
        createPlayer(0, 'Player 1', { bases: [{ row: 0, col: 0 }] }),
        createPlayer(1, 'Player 2', { bases: [{ row: 0, col: 1 }] })
      ]

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
      expect(result.timestamp).toBeDefined()
    })

    it('should return valid result for empty map', () => {
      const hexes: Record<string, Hex> = {}
      const players: Player[] = []

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('when bases overlap', () => {
    it('should detect OVERLAPPING_BASE error for two players at same hex', () => {
      const hexes: Record<string, Hex> = {
        '2,3': createHex('2,3', 2, 3)
      }
      const players: Player[] = [
        createPlayer(0, 'Player 1', { bases: [{ row: 2, col: 3 }] }),
        createPlayer(1, 'Player 2', { bases: [{ row: 2, col: 3 }] })
      ]

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        type: 'OVERLAPPING_BASE',
        hexId: '2,3',
        severity: 'error',
        affectedPlayerIds: [0, 1]
      })
      expect(result.errors[0].message).toContain('Multiple bases')
    })

    it('should detect multiple overlapping bases at different hexes', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createHex('1,1', 1, 1),
        '2,2': createHex('2,2', 2, 2)
      }
      const players: Player[] = [
        createPlayer(0, 'P1', { bases: [{ row: 1, col: 1 }, { row: 2, col: 2 }] }),
        createPlayer(1, 'P2', { bases: [{ row: 1, col: 1 }] }),
        createPlayer(2, 'P3', { bases: [{ row: 2, col: 2 }] })
      ]

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors.map(e => e.hexId).sort()).toEqual(['1,1', '2,2'])
    })
  })

  describe('when camps overlap', () => {
    it('should detect OVERLAPPING_CAMP error for two players at same hex', () => {
      const hexes: Record<string, Hex> = {
        '3,4': createHex('3,4', 3, 4)
      }
      const players: Player[] = [
        createPlayer(0, 'Player 1', {
          bases: [{ row: 0, col: 0 }],
          camps: [{ row: 3, col: 4 }]
        }),
        createPlayer(1, 'Player 2', {
          bases: [{ row: 1, col: 1 }],
          camps: [{ row: 3, col: 4 }]
        })
      ]

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        type: 'OVERLAPPING_CAMP',
        hexId: '3,4',
        severity: 'error',
        affectedPlayerIds: [0, 1]
      })
      expect(result.errors[0].message).toContain('Multiple camps')
    })
  })

  describe('when exploredBy contains invalid player ID', () => {
    it('should detect INVALID_PLAYER_ID error', () => {
      const hexes: Record<string, Hex> = {
        '1,2': createHex('1,2', 1, 2, {
          explored: true,
          exploredBy: [0, 1, 999]  // 999 is invalid
        })
      }
      const players: Player[] = [
        createPlayer(0, 'Player 1', { bases: [{ row: 0, col: 0 }] }),
        createPlayer(1, 'Player 2', { bases: [{ row: 0, col: 1 }] })
      ]

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(false)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toMatchObject({
        type: 'INVALID_PLAYER_ID',
        hexId: '1,2',
        severity: 'warning'
      })
      expect(result.warnings[0].message).toContain('999')
      expect(result.warnings[0].message).toContain('exploredBy')
    })

    it('should detect multiple invalid player IDs in same hex', () => {
      const hexes: Record<string, Hex> = {
        '0,0': createHex('0,0', 0, 0, {
          explored: true,
          exploredBy: [0, 99, 100, 101]
        })
      }
      const players: Player[] = [
        createPlayer(0, 'Player 1', { bases: [{ row: 1, col: 1 }] })
      ]

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(false)
      const warning = result.warnings.find(e => e.type === 'INVALID_PLAYER_ID')
      expect(warning).toBeDefined()
      expect(warning?.message).toContain('99')
    })
  })

  describe('when portal destination does not exist', () => {
    it('should detect BROKEN_PORTAL error', () => {
      const hexes: Record<string, Hex> = {
        '2,2': createHex('2,2', 2, 2, {
          state: {
            portalDestination: '99,99'  // Hex doesn't exist
          }
        })
      }
      const players: Player[] = []

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        type: 'BROKEN_PORTAL',
        hexId: '2,2',
        severity: 'error'
      })
      expect(result.errors[0].message).toContain('99,99')
      expect(result.errors[0].message.toLowerCase()).toContain('portal')
    })

    it('should pass when portal destination exists', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createHex('1,1', 1, 1, {
          state: {
            portalDestination: '2,2'
          }
        }),
        '2,2': createHex('2,2', 2, 2)
      }
      const players: Player[] = []

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('when Beast Lair at wrong location', () => {
    it('should detect BEAST_LAIR_VIOLATION error when location is not 23', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createHex('1,1', 1, 1, {
          location: 15,  // Not TL23
          state: {
            beastLairActive: true
          }
        })
      }
      const players: Player[] = []

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        type: 'BEAST_LAIR_VIOLATION',
        hexId: '1,1',
        severity: 'error'
      })
      expect(result.errors[0].message).toContain('Beast Lair')
      expect(result.errors[0].message).toContain('23')
    })

    it('should pass when Beast Lair is at location 23', () => {
      const hexes: Record<string, Hex> = {
        '3,3': createHex('3,3', 3, 3, {
          location: 23,  // TL23 - correct
          state: {
            beastLairActive: true
          }
        })
      }
      const players: Player[] = []

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should pass when Beast Lair is not active', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createHex('1,1', 1, 1, {
          location: 15,
          state: {
            beastLairActive: false
          }
        })
      }
      const players: Player[] = []

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(true)
    })
  })

  describe('when Intel Cache exceeds D6 maximum', () => {
    it('should detect INTEL_OVERFLOW error when intelRemaining > 6', () => {
      const hexes: Record<string, Hex> = {
        '4,4': createHex('4,4', 4, 4, {
          state: {
            intelRemaining: 10  // Max is 6 (D6)
          }
        })
      }
      const players: Player[] = []

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(false)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toMatchObject({
        type: 'INTEL_OVERFLOW',
        hexId: '4,4',
        severity: 'warning'
      })
      expect(result.warnings[0].message.toLowerCase()).toContain('intel')
      expect(result.warnings[0].message).toContain('6')
    })

    it('should pass when intelRemaining is within D6 range', () => {
      const hexes: Record<string, Hex> = {
        '4,4': createHex('4,4', 4, 4, {
          state: {
            intelRemaining: 6  // Max allowed
          }
        }),
        '5,5': createHex('5,5', 5, 5, {
          state: {
            intelRemaining: 1  // Min allowed
          }
        })
      }
      const players: Player[] = []

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('multiple validation errors', () => {
    it('should detect all error types simultaneously', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createHex('1,1', 1, 1, {
          explored: true,
          exploredBy: [0, 999],  // Invalid player ID
          state: {
            portalDestination: '99,99',  // Broken portal
            intelRemaining: 12  // Intel overflow
          }
        }),
        '2,2': createHex('2,2', 2, 2, {
          location: 15,  // Wrong location for Beast Lair
          state: {
            beastLairActive: true
          }
        }),
        '3,3': createHex('3,3', 3, 3)
      }
      const players: Player[] = [
        createPlayer(0, 'P1', { bases: [{ row: 3, col: 3 }] }),
        createPlayer(1, 'P2', { bases: [{ row: 3, col: 3 }] })  // Overlapping base
      ]

      const result = validateMapState(hexes, players)

      expect(result.valid).toBe(false)
      // WHY: We have 3 errors (base overlap, broken portal, beast lair) + 2 warnings (invalid player, intel)
      expect(result.errors.length + result.warnings.length).toBeGreaterThan(3)

      // Check all error types are present (in either errors or warnings)
      const allIssues = [...result.errors, ...result.warnings]
      const issueTypes = allIssues.map(e => e.type)
      expect(issueTypes).toContain('INVALID_PLAYER_ID')
      expect(issueTypes).toContain('BROKEN_PORTAL')
      expect(issueTypes).toContain('INTEL_OVERFLOW')
      expect(issueTypes).toContain('BEAST_LAIR_VIOLATION')
      expect(issueTypes).toContain('OVERLAPPING_BASE')
    })
  })

  describe('suggested fixes', () => {
    it('should provide suggested fix for overlapping bases', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createHex('1,1', 1, 1)
      }
      const players: Player[] = [
        createPlayer(0, 'P1', { bases: [{ row: 1, col: 1 }] }),
        createPlayer(1, 'P2', { bases: [{ row: 1, col: 1 }] })
      ]

      const result = validateMapState(hexes, players)

      expect(result.errors[0].suggestedFix).toBeDefined()
      expect(result.errors[0].suggestedFix).toContain('move')
    })
  })
})
