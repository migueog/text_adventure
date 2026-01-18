import { describe, it, expect } from 'vitest'
import { getAvailableActions } from './hexActionValidation'
import type { Player, Hex } from '@/types/campaign'
import { hexId } from './hexUtils'

/**
 * WHY: Test suite for hex action validation utility
 * Verifies action availability based on phase, distance, SP, and hex state
 */

// WHY: Helper to create test player
const createTestPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 0,
  name: 'Test Player',
  killTeamName: 'Test Team',
  color: '#ff0000',
  position: { row: 0, col: 0 },
  supplyPoints: 5,
  campaignPoints: 0,
  bases: [{ row: 0, col: 0 }],
  camps: [],
  exploredHexes: 0,
  operativesKilled: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  history: [],
  battleResult: null,
  searchedHexes: [],
  battleHistory: [],
  supplyPointsSpent: 0,
  operativeKillDetails: [],
  ...overrides,
})

// WHY: Helper to create test hex
const createTestHex = (row: number, col: number, overrides: Partial<Hex> = {}): Hex => ({
  id: hexId(row, col),
  row,
  col,
  type: 'surface',
  explored: false,
  location: 0,
  condition: 0,
  exploredBy: [],
  ...overrides,
})

describe('getAvailableActions', () => {
  describe('Movement Phase', () => {
    describe('when player has enough SP', () => {
      it('should allow move to adjacent hex (1 SP)', () => {
        const player = createTestPlayer({ position: { row: 0, col: 0 }, supplyPoints: 5 })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0),
          [hexId(0, 1)]: createTestHex(0, 1),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 1),
          player,
          hexes,
          players,
          'Movement'
        )

        const moveAction = actions.find(a => a.type === 'move')
        expect(moveAction).toBeDefined()
        expect(moveAction?.valid).toBe(true)
        expect(moveAction?.cost).toBe(1)
        expect(moveAction?.label).toContain('Move here')
        expect(moveAction?.label).toContain('1 SP')
      })

      it('should allow move to distant hex (2 SP)', () => {
        const player = createTestPlayer({ position: { row: 0, col: 0 }, supplyPoints: 5 })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0),
          [hexId(0, 2)]: createTestHex(0, 2),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 2),
          player,
          hexes,
          players,
          'Movement'
        )

        const moveAction = actions.find(a => a.type === 'move')
        expect(moveAction?.valid).toBe(true)
        expect(moveAction?.cost).toBe(2)
      })
    })

    describe('when player has insufficient SP', () => {
      it('should show move as invalid with reason', () => {
        const player = createTestPlayer({ position: { row: 0, col: 0 }, supplyPoints: 1 })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0),
          [hexId(0, 2)]: createTestHex(0, 2),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 2),
          player,
          hexes,
          players,
          'Movement'
        )

        const moveAction = actions.find(a => a.type === 'move')
        expect(moveAction?.valid).toBe(false)
        expect(moveAction?.reason).toContain('Not enough SP')
      })
    })

    describe('when hex is too far away', () => {
      it('should show move as invalid (max 3 hexes)', () => {
        const player = createTestPlayer({ position: { row: 0, col: 0 }, supplyPoints: 10 })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0),
          [hexId(0, 4)]: createTestHex(0, 4),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 4),
          player,
          hexes,
          players,
          'Movement'
        )

        const moveAction = actions.find(a => a.type === 'move')
        expect(moveAction?.valid).toBe(false)
        expect(moveAction?.reason).toContain('Too far')
      })
    })

    describe('when target hex is blocked', () => {
      it('should show move as invalid', () => {
        const player = createTestPlayer({ position: { row: 0, col: 0 }, supplyPoints: 10 })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0),
          [hexId(0, 1)]: createTestHex(0, 1, { type: 'blocked' }),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 1),
          player,
          hexes,
          players,
          'Movement'
        )

        const moveAction = actions.find(a => a.type === 'move')
        expect(moveAction?.valid).toBe(false)
        expect(moveAction?.reason).toContain('blocked')
      })
    })

    describe('when target hex has 2 players', () => {
      it('should show move as invalid', () => {
        const player = createTestPlayer({ id: 0, position: { row: 0, col: 0 }, supplyPoints: 10 })
        const otherPlayer1 = createTestPlayer({ id: 1, position: { row: 0, col: 1 } })
        const otherPlayer2 = createTestPlayer({ id: 2, position: { row: 0, col: 1 } })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0),
          [hexId(0, 1)]: createTestHex(0, 1),
        }
        const players = [player, otherPlayer1, otherPlayer2]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 1),
          player,
          hexes,
          players,
          'Movement'
        )

        const moveAction = actions.find(a => a.type === 'move')
        expect(moveAction?.valid).toBe(false)
        expect(moveAction?.reason).toContain('already has 2')
      })
    })

    describe('when same hex selected (source = target)', () => {
      it('should show hold position action', () => {
        const player = createTestPlayer({ position: { row: 0, col: 0 }, supplyPoints: 5 })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 0),
          player,
          hexes,
          players,
          'Movement'
        )

        const holdAction = actions.find(a => a.type === 'hold')
        expect(holdAction).toBeDefined()
        expect(holdAction?.valid).toBe(true)
        expect(holdAction?.cost).toBe(0)
      })
    })
  })

  describe('Action Phase', () => {
    describe('scout action', () => {
      it('should allow scout to unexplored hex within range', () => {
        const player = createTestPlayer({ position: { row: 0, col: 0 }, supplyPoints: 5 })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0),
          [hexId(0, 2)]: createTestHex(0, 2, { explored: false }),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 2),
          player,
          hexes,
          players,
          'Action'
        )

        const scoutAction = actions.find(a => a.type === 'scout')
        expect(scoutAction).toBeDefined()
        expect(scoutAction?.valid).toBe(true)
        expect(scoutAction?.cost).toBe(2)
        expect(scoutAction?.label).toContain('Scout')
      })

      it('should reject scout to explored hex', () => {
        const player = createTestPlayer({ position: { row: 0, col: 0 }, supplyPoints: 5 })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0),
          [hexId(0, 1)]: createTestHex(0, 1, { explored: true }),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 1),
          player,
          hexes,
          players,
          'Action'
        )

        const scoutAction = actions.find(a => a.type === 'scout')
        expect(scoutAction?.valid).toBe(false)
        expect(scoutAction?.reason).toContain('already explored')
      })

      it('should reject scout to blocked hex', () => {
        const player = createTestPlayer({ position: { row: 0, col: 0 }, supplyPoints: 5 })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0),
          [hexId(0, 1)]: createTestHex(0, 1, { type: 'blocked', explored: false }),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 1),
          player,
          hexes,
          players,
          'Action'
        )

        const scoutAction = actions.find(a => a.type === 'scout')
        expect(scoutAction?.valid).toBe(false)
        expect(scoutAction?.reason).toContain('blocked')
      })
    })

    describe('search action (same hex)', () => {
      it('should allow search when player has not searched this hex', () => {
        const player = createTestPlayer({
          position: { row: 0, col: 0 },
          supplyPoints: 5,
          searchedHexes: [],
        })
        const hexes = {
          // WHY: location: 24 is "Relay Station" with searchRule: { type: 'cp', amount: 1 }
          [hexId(0, 0)]: createTestHex(0, 0, { explored: true, location: 24 }),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 0),
          player,
          hexes,
          players,
          'Action'
        )

        const searchAction = actions.find(a => a.type === 'search')
        expect(searchAction).toBeDefined()
        expect(searchAction?.valid).toBe(true)
        expect(searchAction?.cost).toBe(0)
      })

      it('should reject search when player already searched this hex', () => {
        const player = createTestPlayer({
          position: { row: 0, col: 0 },
          supplyPoints: 5,
          searchedHexes: [hexId(0, 0)],
        })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0, { explored: true }),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 0),
          player,
          hexes,
          players,
          'Action'
        )

        const searchAction = actions.find(a => a.type === 'search')
        expect(searchAction?.valid).toBe(false)
        expect(searchAction?.reason).toContain('Already searched')
      })

      it('should reject search when hex is unexplored', () => {
        const player = createTestPlayer({
          position: { row: 0, col: 0 },
          supplyPoints: 5,
          searchedHexes: [],
        })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0, { explored: false }),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 0),
          player,
          hexes,
          players,
          'Action'
        )

        const searchAction = actions.find(a => a.type === 'search')
        expect(searchAction?.valid).toBe(false)
        expect(searchAction?.reason).toContain('Nothing to search')
      })
    })

    describe('encamp action (same hex)', () => {
      it('should allow encamp when player has < 2 camps', () => {
        const player = createTestPlayer({
          position: { row: 0, col: 0 },
          supplyPoints: 10,
          camps: [],
        })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0, { explored: true }),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 0),
          player,
          hexes,
          players,
          'Action'
        )

        const encampAction = actions.find(a => a.type === 'encamp')
        expect(encampAction).toBeDefined()
        expect(encampAction?.valid).toBe(true)
        expect(encampAction?.cost).toBe(3)
      })

      it('should reject encamp when player has insufficient SP', () => {
        const player = createTestPlayer({
          position: { row: 0, col: 0 },
          supplyPoints: 2,
          camps: [],
        })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0, { explored: true }),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 0),
          player,
          hexes,
          players,
          'Action'
        )

        const encampAction = actions.find(a => a.type === 'encamp')
        expect(encampAction?.valid).toBe(false)
        expect(encampAction?.reason).toContain('Not enough SP')
      })
    })

    describe('resupply action (same hex)', () => {
      it('should allow resupply at base when player has < 10 SP', () => {
        const player = createTestPlayer({
          position: { row: 0, col: 0 },
          supplyPoints: 5,
          bases: [{ row: 0, col: 0 }],
        })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 0),
          player,
          hexes,
          players,
          'Action'
        )

        const resupplyAction = actions.find(a => a.type === 'resupply')
        expect(resupplyAction).toBeDefined()
        expect(resupplyAction?.valid).toBe(true)
        expect(resupplyAction?.cost).toBe(0)
      })

      it('should reject resupply when not at base or camp', () => {
        const player = createTestPlayer({
          position: { row: 0, col: 0 },
          supplyPoints: 5,
          bases: [{ row: 1, col: 1 }],
          camps: [],
        })
        const hexes = {
          [hexId(0, 0)]: createTestHex(0, 0),
        }
        const players = [player]

        const actions = getAvailableActions(
          hexId(0, 0),
          hexId(0, 0),
          player,
          hexes,
          players,
          'Action'
        )

        const resupplyAction = actions.find(a => a.type === 'resupply')
        expect(resupplyAction?.valid).toBe(false)
        expect(resupplyAction?.reason).toContain('Must be at base or camp')
      })
    })
  })

  describe('wrong phase', () => {
    it('should return empty array for Battle phase', () => {
      const player = createTestPlayer({ position: { row: 0, col: 0 }, supplyPoints: 5 })
      const hexes = {
        [hexId(0, 0)]: createTestHex(0, 0),
        [hexId(0, 1)]: createTestHex(0, 1),
      }
      const players = [player]

      const actions = getAvailableActions(
        hexId(0, 0),
        hexId(0, 1),
        player,
        hexes,
        players,
        'Battle'
      )

      expect(actions).toEqual([])
    })

    it('should return empty array for Threat phase', () => {
      const player = createTestPlayer({ position: { row: 0, col: 0 }, supplyPoints: 5 })
      const hexes = {
        [hexId(0, 0)]: createTestHex(0, 0),
        [hexId(0, 1)]: createTestHex(0, 1),
      }
      const players = [player]

      const actions = getAvailableActions(
        hexId(0, 0),
        hexId(0, 1),
        player,
        hexes,
        players,
        'Threat'
      )

      expect(actions).toEqual([])
    })
  })
})
