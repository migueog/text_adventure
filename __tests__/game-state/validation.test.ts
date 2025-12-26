import { describe, it, expect } from 'vitest'
import {
  validateGameState,
  validatePhaseTransition,
  validatePlayerAction
} from '@/lib/game-state/validation'
import type { CampaignState } from '@/lib/game-state/schema'

/**
 * WHY: Test game state validation logic
 */

describe('Game State Validation', () => {
  // WHY: Create valid base state for tests
  const createValidState = (): CampaignState => ({
    gameStarted: true,
    gameEnded: false,
    soloMode: false,
    currentRound: 1,
    currentPhase: 'movement',
    currentPlayerIndex: 0,
    threatLevel: 3,
    targetThreatLevel: 7,
    players: [
      {
        userId: 1,
        username: 'Player 1',
        sp: 5,
        cp: 10,
        currentHex: '0,0',
        baseHex: '0,0',
        camps: [],
        lastBattleResult: null,
        victoryCategories: {
          warlord: 0,
          pioneer: 0,
          explorer: 0,
          trooper: 0,
          warrior: 0,
          headhunter: 0
        }
      }
    ],
    hexes: {
      '0,0': {
        type: 'surface',
        explored: true
      }
    },
    mapConfig: {
      rows: 5,
      cols: 5
    },
    eventLog: []
  })

  describe('validateGameState', () => {
    it('should accept valid game state', () => {
      // WHY: Complete valid state should pass
      const state = createValidState()
      const result = validateGameState(state)

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should reject state with SP above 10', () => {
      // WHY: Supply Points must be 0-10
      const state = createValidState()
      state.players[0].sp = 11

      const result = validateGameState(state)

      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should reject state with negative CP', () => {
      // WHY: Campaign Points cannot be negative
      const state = createValidState()
      state.players[0].cp = -1

      const result = validateGameState(state)

      expect(result.valid).toBe(false)
    })

    it('should reject threat level above 10', () => {
      // WHY: Threat level maximum is 10
      const state = createValidState()
      state.threatLevel = 11

      const result = validateGameState(state)

      expect(result.valid).toBe(false)
    })

    it('should reject threat level below 1', () => {
      // WHY: Threat level minimum is 1
      const state = createValidState()
      state.threatLevel = 0

      const result = validateGameState(state)

      expect(result.valid).toBe(false)
    })

    it('should reject invalid phase', () => {
      // WHY: Phase must be one of defined values
      const state = createValidState() as any
      state.currentPhase = 'invalid'

      const result = validateGameState(state)

      expect(result.valid).toBe(false)
    })
  })

  describe('validatePhaseTransition', () => {
    it('should allow setup to movement transition', () => {
      // WHY: Setup always transitions to movement
      expect(validatePhaseTransition('setup', 'movement')).toBe(true)
    })

    it('should allow movement to battle transition', () => {
      // WHY: Movement always transitions to battle
      expect(validatePhaseTransition('movement', 'battle')).toBe(true)
    })

    it('should allow battle to action transition', () => {
      // WHY: Battle always transitions to action
      expect(validatePhaseTransition('battle', 'action')).toBe(true)
    })

    it('should allow action to threat transition', () => {
      // WHY: Action always transitions to threat
      expect(validatePhaseTransition('action', 'threat')).toBe(true)
    })

    it('should allow threat to movement transition', () => {
      // WHY: Threat transitions back to movement for new round
      expect(validatePhaseTransition('threat', 'movement')).toBe(true)
    })

    it('should reject invalid transitions', () => {
      // WHY: Cannot skip phases
      expect(validatePhaseTransition('movement', 'action')).toBe(false)
      expect(validatePhaseTransition('battle', 'movement')).toBe(false)
      expect(validatePhaseTransition('setup', 'battle')).toBe(false)
    })
  })

  describe('validatePlayerAction', () => {
    it('should allow move action in movement phase', () => {
      // WHY: Movement actions only valid in movement phase
      const state = createValidState()
      state.currentPhase = 'movement'

      expect(validatePlayerAction(state, 1, 'move')).toBe(true)
    })

    it('should reject move action in other phases', () => {
      // WHY: Movement only allowed in movement phase
      const state = createValidState()
      state.currentPhase = 'battle'

      expect(validatePlayerAction(state, 1, 'move')).toBe(false)
    })

    it('should allow battle action in battle phase', () => {
      // WHY: Battle actions only valid in battle phase
      const state = createValidState()
      state.currentPhase = 'battle'

      expect(validatePlayerAction(state, 1, 'battle')).toBe(true)
    })

    it('should allow scout action in action phase', () => {
      // WHY: Scout is an action phase operation
      const state = createValidState()
      state.currentPhase = 'action'

      expect(validatePlayerAction(state, 1, 'scout')).toBe(true)
    })

    it('should reject action phase operations in other phases', () => {
      // WHY: Action phase operations only valid in action phase
      const state = createValidState()
      state.currentPhase = 'movement'

      expect(validatePlayerAction(state, 1, 'scout')).toBe(false)
      expect(validatePlayerAction(state, 1, 'resupply')).toBe(false)
      expect(validatePlayerAction(state, 1, 'search')).toBe(false)
    })

    it('should reject actions for non-existent player', () => {
      // WHY: Player must exist in state
      const state = createValidState()

      expect(validatePlayerAction(state, 999, 'move')).toBe(false)
    })
  })
})
