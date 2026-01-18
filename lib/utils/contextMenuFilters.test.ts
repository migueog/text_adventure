import { describe, it, expect } from 'vitest'
import { filterActionsByPhase, filterActionsByOwnership, filterActionsByState } from './contextMenuFilters'
import type { ActionOption, Player, Hex } from '@/types/campaign'

describe('filterActionsByPhase', () => {
  // WHY: Define test action options
  const allActions: ActionOption[] = [
    { type: 'move', label: 'Move', cost: 2, valid: true },
    { type: 'hold', label: 'Hold', cost: 0, valid: true },
    { type: 'scout', label: 'Scout', cost: 1, valid: true },
    { type: 'search', label: 'Search', cost: 0, valid: true },
    { type: 'encamp', label: 'Encamp', cost: 3, valid: true },
    { type: 'resupply', label: 'Resupply', cost: 1, valid: true },
  ]

  describe('when in Movement phase', () => {
    it('should only allow Move and Hold actions', () => {
      const result = filterActionsByPhase(allActions, 'Movement')

      expect(result).toHaveLength(2)
      expect(result.map(a => a.type)).toEqual(['move', 'hold'])
    })

    it('should preserve action properties', () => {
      const result = filterActionsByPhase(allActions, 'Movement')

      const moveAction = result.find(a => a.type === 'move')
      expect(moveAction).toMatchObject({
        type: 'move',
        label: 'Move',
        cost: 2,
        valid: true
      })
    })
  })

  describe('when in Action phase', () => {
    it('should only allow Scout, Search, Encamp, and Resupply actions', () => {
      const result = filterActionsByPhase(allActions, 'Action')

      expect(result).toHaveLength(4)
      expect(result.map(a => a.type)).toEqual(['scout', 'search', 'encamp', 'resupply'])
    })

    it('should not allow movement actions', () => {
      const result = filterActionsByPhase(allActions, 'Action')

      expect(result.find(a => a.type === 'move')).toBeUndefined()
      expect(result.find(a => a.type === 'hold')).toBeUndefined()
    })
  })

  describe('when in Battle phase', () => {
    it('should return empty array (no hex actions during Battle)', () => {
      const result = filterActionsByPhase(allActions, 'Battle')

      expect(result).toHaveLength(0)
    })
  })

  describe('when in Threat phase', () => {
    it('should return empty array (no hex actions during Threat)', () => {
      const result = filterActionsByPhase(allActions, 'Threat')

      expect(result).toHaveLength(0)
    })
  })
})

describe('filterActionsByOwnership', () => {
  const mockPlayer: Player = {
    id: 1,
    name: 'Alice',
    killTeamName: 'Red Squadron',
    color: '#FF0000',
    supplyPoints: 5,
    campaignPoints: 10,
    position: { row: 2, col: 3 },
    bases: [{ row: 0, col: 0 }],
    camps: [{ row: 2, col: 3 }],
    exploredHexes: 3,
    gamesPlayed: 2,
    gamesWon: 1,
    gamesLost: 1,
    operativesKilled: 5,
    history: [],
    battleResult: null,
    searchedHexes: [],
    battleHistory: []
  }

  const baseHex: Hex = {
    id: '0,0',
    row: 0,
    col: 0,
    type: 'surface',
    location: 15,
    condition: 20,
    explored: true,
    exploredBy: [1]
  }

  const campHex: Hex = {
    id: '2,3',
    row: 2,
    col: 3,
    type: 'surface',
    location: 15,
    condition: 20,
    explored: true,
    exploredBy: [1]
  }

  const otherHex: Hex = {
    id: '5,5',
    row: 5,
    col: 5,
    type: 'surface',
    location: 15,
    condition: 20,
    explored: true,
    exploredBy: [1]
  }

  describe('when filtering Resupply action', () => {
    it('should mark Resupply as valid at player base', () => {
      const actions: ActionOption[] = [
        { type: 'resupply', label: 'Resupply', cost: 1, valid: true }
      ]

      const result = filterActionsByOwnership(actions, mockPlayer, baseHex, {})

      expect(result[0]?.valid).toBe(true)
      expect(result[0]?.reason).toBeUndefined()
    })

    it('should mark Resupply as valid at player camp', () => {
      const actions: ActionOption[] = [
        { type: 'resupply', label: 'Resupply', cost: 1, valid: true }
      ]

      const result = filterActionsByOwnership(actions, mockPlayer, campHex, {})

      expect(result[0]?.valid).toBe(true)
      expect(result[0]?.reason).toBeUndefined()
    })

    it('should mark Resupply as invalid at other hex', () => {
      const actions: ActionOption[] = [
        { type: 'resupply', label: 'Resupply', cost: 1, valid: true }
      ]

      const result = filterActionsByOwnership(actions, mockPlayer, otherHex, {})

      expect(result[0]?.valid).toBe(false)
      expect(result[0]?.reason).toBe('Must be at your base or camp')
    })
  })

  describe('when filtering non-Resupply actions', () => {
    it('should not modify other action types', () => {
      const actions: ActionOption[] = [
        { type: 'scout', label: 'Scout', cost: 1, valid: true },
        { type: 'move', label: 'Move', cost: 2, valid: true }
      ]

      const result = filterActionsByOwnership(actions, mockPlayer, otherHex, {})

      expect(result[0]).toBeDefined()
      expect(result[0]).toMatchObject(actions[0] as object)
      expect(result[1]).toBeDefined()
      expect(result[1]).toMatchObject(actions[1] as object)
    })
  })
})

describe('filterActionsByState', () => {
  const mockPlayer: Player = {
    id: 1,
    name: 'Alice',
    killTeamName: 'Red Squadron',
    color: '#FF0000',
    supplyPoints: 5,
    campaignPoints: 10,
    position: { row: 2, col: 3 },
    bases: [{ row: 0, col: 0 }],
    camps: [{ row: 2, col: 3 }],
    exploredHexes: 3,
    gamesPlayed: 2,
    gamesWon: 1,
    gamesLost: 1,
    operativesKilled: 5,
    history: [],
    battleResult: null,
    searchedHexes: [],
    battleHistory: []
  }

  const mockHex: Hex = {
    id: '5,5',
    row: 5,
    col: 5,
    type: 'surface',
    location: 15,
    condition: 20,
    explored: true,
    exploredBy: [1]
  }

  describe('when checking SP costs', () => {
    it('should mark action as invalid if player has insufficient SP', () => {
      const actions: ActionOption[] = [
        { type: 'scout', label: 'Scout (1 SP)', cost: 1, valid: true },
        { type: 'encamp', label: 'Encamp (3 SP)', cost: 3, valid: true }
      ]

      const poorPlayer = { ...mockPlayer, supplyPoints: 0 }
      const result = filterActionsByState(actions, poorPlayer, mockHex, {})

      expect(result[0]?.valid).toBe(false)
      expect(result[0]?.reason).toContain('Insufficient SP')
      expect(result[1]?.valid).toBe(false)
      expect(result[1]?.reason).toContain('Insufficient SP')
    })

    it('should mark action as valid if player has sufficient SP', () => {
      const actions: ActionOption[] = [
        { type: 'scout', label: 'Scout (1 SP)', cost: 1, valid: true }
      ]

      const result = filterActionsByState(actions, mockPlayer, mockHex, {})

      expect(result[0]?.valid).toBe(true)
    })

    it('should allow zero-cost actions regardless of SP', () => {
      const actions: ActionOption[] = [
        { type: 'hold', label: 'Hold', cost: 0, valid: true }
      ]

      const poorPlayer = { ...mockPlayer, supplyPoints: 0 }
      const result = filterActionsByState(actions, poorPlayer, mockHex, {})

      expect(result[0]?.valid).toBe(true)
    })
  })

  describe('when checking camp limits', () => {
    it('should mark Encamp as invalid if player has 2 camps (at limit)', () => {
      const actions: ActionOption[] = [
        { type: 'encamp', label: 'Encamp', cost: 3, valid: true }
      ]

      const playerWithTwoCamps = {
        ...mockPlayer,
        camps: [{ row: 1, col: 1 }, { row: 2, col: 2 }]
      }

      const result = filterActionsByState(actions, playerWithTwoCamps, mockHex, {})

      expect(result[0]?.valid).toBe(false)
      expect(result[0]?.reason).toContain('Maximum 2 camps')
    })

    it('should mark Encamp as valid if player has fewer than 2 camps', () => {
      const actions: ActionOption[] = [
        { type: 'encamp', label: 'Encamp', cost: 3, valid: true }
      ]

      const playerWithOneCamp = {
        ...mockPlayer,
        camps: [{ row: 1, col: 1 }]
      }

      const result = filterActionsByState(actions, playerWithOneCamp, mockHex, {})

      // WHY: Should be valid (assuming sufficient SP)
      expect(result[0]?.valid).toBe(true)
    })
  })

  describe('when checking hex occupancy', () => {
    it('should mark Encamp as invalid if hex already has a camp', () => {
      const actions: ActionOption[] = [
        { type: 'encamp', label: 'Encamp', cost: 3, valid: true }
      ]

      const hexes = {
        '5,5': mockHex
      }

      const playerWithCampHere = {
        ...mockPlayer,
        camps: [{ row: 5, col: 5 }]
      }

      const result = filterActionsByState(actions, playerWithCampHere, mockHex, hexes)

      expect(result[0]?.valid).toBe(false)
      expect(result[0]?.reason).toContain('already has a camp')
    })
  })
})
