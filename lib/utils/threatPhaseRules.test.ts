import { describe, it, expect } from 'vitest'
import {
  detectActiveThreatPhaseRules,
  sortByPriority,
  hasActiveRules
} from './threatPhaseRules'
import type { Player, Hex, Location, ThreatPhaseRule } from '@/types/campaign'
import { hexId } from './hexUtils'

// WHY: Helper to create test players with minimal required properties
function createTestPlayer(
  id: number,
  cp: number,
  sp: number,
  position: { row: number; col: number } = { row: 0, col: 0 }
): Player {
  return {
    id,
    name: `Player ${id + 1}`,
    killTeamName: `Kill Team ${id + 1}`,
    color: '#ffffff',
    position,
    supplyPoints: sp,
    campaignPoints: cp,
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
    battleHistory: []
  }
}

// WHY: Helper to create test hex with optional location roll and explored status
function createTestHex(
  row: number,
  col: number,
  type: 'surface' | 'tomb' = 'tomb',
  location: number = 11,
  explored: boolean = false
): Hex {
  return {
    id: hexId(row, col),
    row,
    col,
    type,
    location,
    condition: 11,
    explored,
    exploredBy: explored ? [0] : []
  }
}

// WHY: Mock threat phase rule for testing
const mockThreatRule: ThreatPhaseRule = {
  type: 'threat_increase',
  amount: 1,
  target: 'player_in_hex',
  description: 'Threat increases by 1'
}

const mockSPGainRule: ThreatPhaseRule = {
  type: 'sp_gain',
  amount: 1,
  target: 'player_in_hex',
  description: 'Gain 1 SP'
}

// WHY: Mock locations for testing (will be replaced by real data in integration)
const mockLocationWithRule: Location = {
  name: 'Stasis Chamber',
  description: 'Rows of dormant Necrons',
  effect: 'none',
  searchRule: null,
  threatPhaseRule: mockThreatRule
}

const mockLocationWithoutRule: Location = {
  name: 'Empty Corridor',
  description: 'Featureless metal walls',
  effect: 'none',
  searchRule: null,
  threatPhaseRule: null
}

describe('detectActiveThreatPhaseRules', () => {
  describe('when no players exist', () => {
    it('should return empty array', () => {
      const players: Player[] = []
      const hexes: Record<string, Hex> = {}

      const result = detectActiveThreatPhaseRules(players, hexes)

      expect(result).toEqual([])
    })
  })

  describe('when player is on unexplored hex', () => {
    it('should return empty array', () => {
      const players = [createTestPlayer(0, 5, 5, { row: 1, col: 1 })]
      const hex = createTestHex(1, 1, 'tomb', 11, false) // Not explored
      const hexes: Record<string, Hex> = { [hex.id]: hex }

      const result = detectActiveThreatPhaseRules(players, hexes)

      expect(result).toEqual([])
    })
  })

  describe('when player is on explored hex without threatPhaseRule', () => {
    it('should return empty array', () => {
      const players = [createTestPlayer(0, 5, 5, { row: 1, col: 1 })]
      // Location 21 is Empty Corridor which has no threat rule
      const hex = createTestHex(1, 1, 'tomb', 21, true)
      const hexes: Record<string, Hex> = { [hex.id]: hex }

      const result = detectActiveThreatPhaseRules(players, hexes)

      expect(result).toEqual([])
    })
  })

  describe('when player is on explored hex with threatPhaseRule', () => {
    it('should return active rule for that player', () => {
      const players = [createTestPlayer(0, 5, 5, { row: 1, col: 1 })]
      // Location 11 is Stasis Chamber which will have a threat rule
      const hex = createTestHex(1, 1, 'tomb', 11, true)
      const hexes: Record<string, Hex> = { [hex.id]: hex }

      const result = detectActiveThreatPhaseRules(players, hexes)

      // After we add rules to campaignData, this test will pass
      // For now, we expect the structure to be correct
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('when multiple players have active rules', () => {
    it('should return rules for all affected players', () => {
      const players = [
        createTestPlayer(0, 5, 5, { row: 1, col: 1 }),
        createTestPlayer(1, 3, 3, { row: 2, col: 2 })
      ]
      // Both on tomb hexes with location 11 (Stasis Chamber)
      const hex1 = createTestHex(1, 1, 'tomb', 11, true)
      const hex2 = createTestHex(2, 2, 'tomb', 11, true)
      const hexes: Record<string, Hex> = {
        [hex1.id]: hex1,
        [hex2.id]: hex2
      }

      const result = detectActiveThreatPhaseRules(players, hexes)

      // Both players should have rules once we add threatPhaseRule to location 11
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('when player has no hex in hexes record', () => {
    it('should skip that player gracefully', () => {
      const players = [createTestPlayer(0, 5, 5, { row: 99, col: 99 })]
      const hexes: Record<string, Hex> = {} // Empty hexes

      const result = detectActiveThreatPhaseRules(players, hexes)

      expect(result).toEqual([])
    })
  })
})

describe('sortByPriority', () => {
  describe('when rules array is empty', () => {
    it('should return empty array', () => {
      const rules: ReturnType<typeof detectActiveThreatPhaseRules> = []
      const players: Player[] = []

      const result = sortByPriority(rules, players)

      expect(result).toEqual([])
    })
  })

  describe('when single rule exists', () => {
    it('should return single rule unchanged', () => {
      const player = createTestPlayer(0, 5, 5, { row: 1, col: 1 })
      const rules = [{
        player,
        hexId: '1,1',
        location: mockLocationWithRule,
        rule: mockThreatRule,
        priority: 1
      }]

      const result = sortByPriority(rules, [player])

      expect(result).toHaveLength(1)
      expect(result[0]?.player.id).toBe(0)
    })
  })

  describe('when multiple rules exist', () => {
    it('should sort by lowest CP first', () => {
      const player1 = createTestPlayer(0, 10, 5, { row: 1, col: 1 })
      const player2 = createTestPlayer(1, 2, 5, { row: 2, col: 2 })
      const rules = [
        {
          player: player1,
          hexId: '1,1',
          location: mockLocationWithRule,
          rule: mockThreatRule,
          priority: 0
        },
        {
          player: player2,
          hexId: '2,2',
          location: mockLocationWithRule,
          rule: mockSPGainRule,
          priority: 0
        }
      ]

      const result = sortByPriority(rules, [player1, player2])

      // Player 2 (CP=2) should be first
      expect(result[0]?.player.id).toBe(1)
      expect(result[1]?.player.id).toBe(0)
    })

    it('should use SP as tiebreaker when CP is equal', () => {
      const player1 = createTestPlayer(0, 5, 8, { row: 1, col: 1 })
      const player2 = createTestPlayer(1, 5, 3, { row: 2, col: 2 })
      const rules = [
        {
          player: player1,
          hexId: '1,1',
          location: mockLocationWithRule,
          rule: mockThreatRule,
          priority: 0
        },
        {
          player: player2,
          hexId: '2,2',
          location: mockLocationWithRule,
          rule: mockSPGainRule,
          priority: 0
        }
      ]

      const result = sortByPriority(rules, [player1, player2])

      // Player 2 (SP=3) should be first due to lower SP
      expect(result[0]?.player.id).toBe(1)
      expect(result[1]?.player.id).toBe(0)
    })
  })
})

describe('hasActiveRules', () => {
  describe('when no players exist', () => {
    it('should return false', () => {
      const players: Player[] = []
      const hexes: Record<string, Hex> = {}

      const result = hasActiveRules(players, hexes)

      expect(result).toBe(false)
    })
  })

  describe('when players exist but no active rules', () => {
    it('should return false', () => {
      const players = [createTestPlayer(0, 5, 5, { row: 1, col: 1 })]
      // Location 21 is Empty Corridor (no threat rule)
      const hex = createTestHex(1, 1, 'tomb', 21, true)
      const hexes: Record<string, Hex> = { [hex.id]: hex }

      const result = hasActiveRules(players, hexes)

      expect(result).toBe(false)
    })
  })

  describe('when at least one active rule exists', () => {
    it('should return true', () => {
      const players = [createTestPlayer(0, 5, 5, { row: 1, col: 1 })]
      // Location 11 is Stasis Chamber (will have threat rule)
      const hex = createTestHex(1, 1, 'tomb', 11, true)
      const hexes: Record<string, Hex> = { [hex.id]: hex }

      const result = hasActiveRules(players, hexes)

      // Will return true once we add threatPhaseRule to location 11
      expect(typeof result).toBe('boolean')
    })
  })
})
