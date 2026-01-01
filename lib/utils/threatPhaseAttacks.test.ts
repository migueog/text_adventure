import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { Player, Hex } from '@/types/campaign'
import * as dice from '@/lib/utils/dice'
import {
  findPlayersInBeastRange,
  resolveBeastAttack,
  getValidPrisonerMoves,
  resolvePrisonerAttack
} from './threatPhaseAttacks'

/**
 * WHY: Test threat phase attack mechanics for Beast Lair and Released Prisoner (Issue #59)
 * Tests written FIRST following TDD approach
 */

describe('findPlayersInBeastRange', () => {
  let hexes: Record<string, Hex>
  let players: Player[]

  beforeEach(() => {
    // WHY: Create test hex grid (3x3 surface, 2x2 tomb)
    hexes = {
      '0,0': { id: '0,0', row: 0, col: 0, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '0,1': { id: '0,1', row: 0, col: 1, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '0,2': { id: '0,2', row: 0, col: 2, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '1,0': { id: '1,0', row: 1, col: 0, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '1,1': { id: '1,1', row: 1, col: 1, type: 'surface', explored: true, exploredBy: [], location: 23, condition: 0 }, // Beast Lair
      '1,2': { id: '1,2', row: 1, col: 2, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '2,0': { id: '2,0', row: 2, col: 0, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '2,1': { id: '2,1', row: 2, col: 1, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '2,2': { id: '2,2', row: 2, col: 2, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '3,0': { id: '3,0', row: 3, col: 0, type: 'tomb', explored: true, exploredBy: [], location: 0, condition: 0 },
      '3,1': { id: '3,1', row: 3, col: 1, type: 'tomb', explored: true, exploredBy: [], location: 0, condition: 0 },
    }

    // WHY: Create test players at various positions
    players = [
      {
        id: 0,
        name: 'Player 1',
        killTeamName: 'Team 1',
        color: 'red',
        position: { row: 0, col: 0 }, // Distance 1 from Beast Lair
        supplyPoints: 5,
        campaignPoints: 10,
        exploredHexes: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        operativesKilled: 0,
        bases: [{ row: 0, col: 0 }],
        camps: [],
        history: [],
        battleResult: null,
        searchedHexes: [],
        battleHistory: []
      },
      {
        id: 1,
        name: 'Player 2',
        killTeamName: 'Team 2',
        color: 'blue',
        position: { row: 0, col: 2 }, // Distance 2 from Beast Lair
        supplyPoints: 5,
        campaignPoints: 10,
        exploredHexes: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        operativesKilled: 0,
        bases: [{ row: 0, col: 2 }],
        camps: [],
        history: [],
        battleResult: null,
        searchedHexes: [],
        battleHistory: []
      },
      {
        id: 2,
        name: 'Player 3',
        killTeamName: 'Team 3',
        color: 'green',
        position: { row: 3, col: 0 }, // Tomb hex, should be excluded
        supplyPoints: 5,
        campaignPoints: 10,
        exploredHexes: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        operativesKilled: 0,
        bases: [{ row: 3, col: 0 }],
        camps: [],
        history: [],
        battleResult: null,
        searchedHexes: [],
        battleHistory: []
      }
    ]
  })

  describe('when no players in range', () => {
    it('should return empty array', () => {
      // WHY: All players beyond 2 hex range from Beast Lair at (1,1)
      // Distance >2 or on tomb hexes
      players[0]!.position = { row: 3, col: 0 } // Tomb hex
      players[1]!.position = { row: 3, col: 1 } // Tomb hex
      players[2]!.position = { row: 3, col: 0 } // Tomb hex

      const result = findPlayersInBeastRange('1,1', players, hexes)

      expect(result).toEqual([])
    })
  })

  describe('when single player in range', () => {
    it('should return that player', () => {
      // WHY: Only Player 1 within 2 hexes, others out of range or on tomb
      players[1]!.position = { row: 3, col: 1 } // Tomb hex
      players[2]!.position = { row: 3, col: 0 } // Tomb hex

      const result = findPlayersInBeastRange('1,1', players, hexes)

      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe(0)
    })
  })

  describe('when multiple players in range', () => {
    it('should return all players within 2 hexes', () => {
      // WHY: Both surface players within range
      const result = findPlayersInBeastRange('1,1', players, hexes)

      expect(result).toHaveLength(2)
      expect(result.map(p => p.id)).toContain(0)
      expect(result.map(p => p.id)).toContain(1)
    })
  })

  describe('when players on tomb hexes', () => {
    it('should exclude tomb players (surface only)', () => {
      // WHY: Beast only attacks surface players
      const result = findPlayersInBeastRange('1,1', players, hexes)

      expect(result).toHaveLength(2)
      expect(result.map(p => p.id)).not.toContain(2) // Player 3 on tomb
    })
  })
})

describe('resolveBeastAttack', () => {
  let hexes: Record<string, Hex>
  let players: Player[]

  beforeEach(() => {
    hexes = {
      '0,0': { id: '0,0', row: 0, col: 0, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '1,1': { id: '1,1', row: 1, col: 1, type: 'surface', explored: true, exploredBy: [], location: 23, condition: 0 }, // Beast Lair
      '0,2': { id: '0,2', row: 0, col: 2, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
    }

    players = [
      {
        id: 0,
        name: 'Player 1',
        killTeamName: 'Team 1',
        color: 'red',
        position: { row: 0, col: 0 },
        supplyPoints: 5,
        campaignPoints: 10,
        exploredHexes: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        operativesKilled: 0,
        bases: [{ row: 0, col: 0 }],
        camps: [],
        history: [],
        battleResult: null,
        searchedHexes: [],
        battleHistory: []
      },
      {
        id: 1,
        name: 'Player 2',
        killTeamName: 'Team 2',
        color: 'blue',
        position: { row: 0, col: 2 },
        supplyPoints: 5,
        campaignPoints: 10,
        exploredHexes: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        operativesKilled: 0,
        bases: [{ row: 0, col: 2 }],
        camps: [],
        history: [],
        battleResult: null,
        searchedHexes: [],
        battleHistory: []
      }
    ]
  })

  describe('single target', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should roll D6+distance and attack if roll < 5', () => {
      // WHY: Mock dice to return low roll (1 + 1 distance = 2 < 5, attacked)
      const rollD6Spy = vi.spyOn(dice, 'rollD6')
        .mockReturnValueOnce(1) // Attack roll
        .mockReturnValueOnce(3) // Damage roll

      const playersInRange = [players[0]!]
      const result = resolveBeastAttack(playersInRange, '1,1', hexes)

      expect(result.targetPlayerId).toBe(0)
      expect(result.damage).toBe(3)
      expect(result.roll).toBeLessThan(5)

      rollD6Spy.mockRestore()
    })

    it('should not attack if roll >= 5', () => {
      // WHY: Mock dice to return high roll (5 + 1 distance = 6 >= 5, no attack)
      const rollD6Spy = vi.spyOn(dice, 'rollD6').mockReturnValue(5)

      const playersInRange = [players[0]!]
      const result = resolveBeastAttack(playersInRange, '1,1', hexes)

      expect(result.targetPlayerId).toBe(-1) // No attack
      expect(result.damage).toBe(0)

      rollD6Spy.mockRestore()
    })
  })

  describe('multiple targets', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should perform roll-off with distance bonuses', () => {
      // WHY: Both players roll, distance matters
      const rollD6Spy = vi.spyOn(dice, 'rollD6')
        .mockReturnValueOnce(2) // Player 1 roll
        .mockReturnValueOnce(3) // Player 2 roll
        .mockReturnValueOnce(4) // Damage

      const playersInRange = [players[0]!, players[1]!]
      const result = resolveBeastAttack(playersInRange, '1,1', hexes)

      // WHY: Player 1 (distance 1): 2+1=3, Player 2 (distance 2): 3+2=5
      // Player 1 has lowest roll, gets attacked
      expect(result.targetPlayerId).toBe(0)
      expect(result.damage).toBe(4)

      rollD6Spy.mockRestore()
    })

    it('should attack lowest roller', () => {
      // WHY: Test that lowest total roll gets attacked
      const rollD6Spy = vi.spyOn(dice, 'rollD6')
        .mockReturnValueOnce(5) // Player 1 roll (5+1=6)
        .mockReturnValueOnce(1) // Player 2 roll (1+2=3) <- lowest
        .mockReturnValueOnce(2) // Damage

      const playersInRange = [players[0]!, players[1]!]
      const result = resolveBeastAttack(playersInRange, '1,1', hexes)

      expect(result.targetPlayerId).toBe(1)
      expect(result.damage).toBe(2)

      rollD6Spy.mockRestore()
    })
  })
})

describe('getValidPrisonerMoves', () => {
  let hexes: Record<string, Hex>

  beforeEach(() => {
    // WHY: 3x3 grid with one blocked hex
    hexes = {
      '0,0': { id: '0,0', row: 0, col: 0, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '0,1': { id: '0,1', row: 0, col: 1, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '0,2': { id: '0,2', row: 0, col: 2, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '1,0': { id: '1,0', row: 1, col: 0, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '1,1': { id: '1,1', row: 1, col: 1, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 }, // Prisoner here
      '1,2': { id: '1,2', row: 1, col: 2, type: 'blocked', explored: false, exploredBy: [], location: 0, condition: 0 }, // Blocked
      '2,0': { id: '2,0', row: 2, col: 0, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '2,1': { id: '2,1', row: 2, col: 1, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
      '2,2': { id: '2,2', row: 2, col: 2, type: 'surface', explored: true, exploredBy: [], location: 0, condition: 0 },
    }
  })

  it('should find all hexes within distance', () => {
    // WHY: Distance 1 should find adjacent hexes
    const result = getValidPrisonerMoves('1,1', 1, hexes)

    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('0,1')
    expect(result).toContain('1,0')
    expect(result).toContain('2,1')
  })

  it('should exclude blocked hexes', () => {
    // WHY: Blocked hexes cannot be entered
    const result = getValidPrisonerMoves('1,1', 1, hexes)

    expect(result).not.toContain('1,2') // Blocked hex
  })

  it('should respect distance limit', () => {
    // WHY: Distance 2 allows farther moves
    const result = getValidPrisonerMoves('1,1', 2, hexes)

    expect(result).toContain('0,0') // Distance 2
    expect(result).toContain('0,2') // Distance 2
  })
})

describe('resolvePrisonerAttack', () => {
  let hexes: Record<string, Hex>
  let players: Player[]

  beforeEach(() => {
    hexes = {
      '1,1': { id: '1,1', row: 1, col: 1, type: 'tomb', explored: true, exploredBy: [], location: 0, condition: 0 },
      '2,2': { id: '2,2', row: 2, col: 2, type: 'tomb', explored: true, exploredBy: [], location: 22, condition: 0 }, // Transeptum Maze
    }

    players = [
      {
        id: 0,
        name: 'Controller',
        killTeamName: 'Team 1',
        color: 'red',
        position: { row: 0, col: 0 },
        supplyPoints: 5,
        campaignPoints: 10,
        exploredHexes: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        operativesKilled: 0,
        bases: [{ row: 0, col: 0 }],
        camps: [],
        history: [],
        battleResult: null,
        searchedHexes: [],
        battleHistory: []
      },
      {
        id: 1,
        name: 'Victim',
        killTeamName: 'Team 2',
        color: 'blue',
        position: { row: 1, col: 1 },
        supplyPoints: 5,
        campaignPoints: 10,
        exploredHexes: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        operativesKilled: 0,
        bases: [{ row: 0, col: 0 }],
        camps: [{ row: 1, col: 1 }],
        history: [],
        battleResult: null,
        searchedHexes: [],
        battleHistory: []
      }
    ]
  })

  describe('in Transeptum Maze', () => {
    it('should not attack (safe hex)', () => {
      // WHY: Transeptum Maze (TL22) is safe from prisoner attacks
      const result = resolvePrisonerAttack('2,2', 0, players, hexes)

      expect(result.playersAttacked).toHaveLength(0)
      expect(result.campsRemoved).toHaveLength(0)
      expect(result.prisonerRemoved).toBe(false)
    })
  })

  describe('in other hex with players', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should attack all players except controller', () => {
      // WHY: Prisoner attacks everyone except the controlling player
      const rollD6Spy = vi.spyOn(dice, 'rollD6')
        .mockReturnValueOnce(3) // Damage for victim
        .mockReturnValueOnce(2) // Removal roll (< 4, not removed)

      const result = resolvePrisonerAttack('1,1', 0, players, hexes)

      expect(result.playersAttacked).toHaveLength(1)
      expect(result.playersAttacked[0]?.playerId).toBe(1)
      expect(result.playersAttacked[0]?.damage).toBe(3)

      rollD6Spy.mockRestore()
    })

    it('should remove camps in hex', () => {
      // WHY: Prisoner destroys camps when attacking
      const rollD6Spy = vi.spyOn(dice, 'rollD6')
        .mockReturnValueOnce(2) // Damage
        .mockReturnValueOnce(3) // Removal roll

      const result = resolvePrisonerAttack('1,1', 0, players, hexes)

      expect(result.campsRemoved).toContain('1,1')

      rollD6Spy.mockRestore()
    })

    it('should roll for prisoner removal (4+ on D6)', () => {
      // WHY: After attacking, roll D6 - on 4+ prisoner is removed
      const rollD6Spy = vi.spyOn(dice, 'rollD6')
        .mockReturnValueOnce(2) // Damage
        .mockReturnValueOnce(5) // Removal roll (>= 4, removed!)

      const result = resolvePrisonerAttack('1,1', 0, players, hexes)

      expect(result.prisonerRemoved).toBe(true)

      rollD6Spy.mockRestore()
    })

    it('should not remove prisoner if roll < 4', () => {
      // WHY: Roll < 4 means prisoner stays active
      const rollD6Spy = vi.spyOn(dice, 'rollD6')
        .mockReturnValueOnce(2) // Damage
        .mockReturnValueOnce(2) // Removal roll (< 4, stays)

      const result = resolvePrisonerAttack('1,1', 0, players, hexes)

      expect(result.prisonerRemoved).toBe(false)

      rollD6Spy.mockRestore()
    })
  })
})
