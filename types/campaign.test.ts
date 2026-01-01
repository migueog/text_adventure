import { describe, it, expect } from 'vitest'
import type { Location, Condition, Hex, HexState } from './campaign'

/**
 * WHY: Tests for enhanced type system supporting repeatable locations,
 * hex state tracking, and special location mechanics (Issue #58)
 */

describe('Location Type', () => {
  describe('repeatable locations', () => {
    it('should support repeatable location with number range', () => {
      const location: Location = {
        id: 'SL11-16',
        number: '11-16',
        type: 'REPEATABLE',
        repeatable: true,
        name: 'Unexplored Wilderness',
        description: 'Empty wasteland',
        effect: 'none',
        searchRule: null
      }

      expect(location.repeatable).toBe(true)
      expect(location.type).toBe('REPEATABLE')
      expect(location.number).toBe('11-16')
      expect(location.id).toBe('SL11-16')
    })

    it('should support unique location with single number', () => {
      const location: Location = {
        id: 'SL21',
        number: 21,
        type: 'UNIQUE',
        repeatable: false,
        name: 'Abandoned Camp',
        description: 'Previous explorers left supplies',
        effect: 'gainSP',
        value: 2,
        searchRule: { type: 'sp', amount: 2 }
      }

      expect(location.repeatable).toBe(false)
      expect(location.type).toBe('UNIQUE')
      expect(location.number).toBe(21)
    })

    it('should support special location with special rules', () => {
      const location: Location = {
        id: 'SL23',
        number: 23,
        type: 'SPECIAL',
        repeatable: false,
        name: 'Beast Lair',
        description: 'Dangerous predator den',
        effect: 'none',
        searchRule: null,
        specialRules: ['BEAST_LAIR'],
        campRule: 'FORBIDDEN'
      }

      expect(location.type).toBe('SPECIAL')
      expect(location.specialRules).toContain('BEAST_LAIR')
      expect(location.campRule).toBe('FORBIDDEN')
    })
  })

  describe('optional properties', () => {
    it('should support initialState for depleting resources', () => {
      const location: Location = {
        id: 'SL21',
        number: 21,
        type: 'UNIQUE',
        repeatable: false,
        name: 'Abandoned Camp',
        description: 'Supplies available',
        effect: 'none',
        searchRule: null,
        initialState: { supplyCount: 0 }
      }

      expect(location.initialState).toBeDefined()
      expect(location.initialState?.supplyCount).toBe(0)
    })

    it('should support multiple special rules', () => {
      const location: Location = {
        id: 'SL33',
        number: 33,
        type: 'SPECIAL',
        repeatable: false,
        name: 'Portal',
        description: 'Dimensional gateway',
        effect: 'portal',
        searchRule: null,
        specialRules: ['PORTAL', 'TELEPORT']
      }

      expect(location.specialRules).toHaveLength(2)
      expect(location.specialRules).toContain('PORTAL')
      expect(location.specialRules).toContain('TELEPORT')
    })

    it('should support all camp rule types', () => {
      const allowed: Location = {
        id: 'SL21',
        number: 21,
        type: 'UNIQUE',
        repeatable: false,
        name: 'Safe Location',
        description: 'Safe for camping',
        effect: 'none',
        searchRule: null,
        campRule: 'ALLOWED'
      }

      const dangerous: Location = {
        id: 'SL22',
        number: 22,
        type: 'UNIQUE',
        repeatable: false,
        name: 'Risky Location',
        description: 'Dangerous but possible',
        effect: 'none',
        searchRule: null,
        campRule: 'DANGEROUS'
      }

      const forbidden: Location = {
        id: 'SL23',
        number: 23,
        type: 'UNIQUE',
        repeatable: false,
        name: 'Beast Lair',
        description: 'Cannot camp here',
        effect: 'none',
        searchRule: null,
        campRule: 'FORBIDDEN'
      }

      expect(allowed.campRule).toBe('ALLOWED')
      expect(dangerous.campRule).toBe('DANGEROUS')
      expect(forbidden.campRule).toBe('FORBIDDEN')
    })
  })
})

describe('Condition Type', () => {
  describe('repeatable conditions', () => {
    it('should support repeatable condition with number range', () => {
      const condition: Condition = {
        id: 'SC11-16',
        number: '11-16',
        type: 'REPEATABLE',
        repeatable: true,
        name: 'Clear Conditions',
        description: 'No adverse effects',
        effect: 'none'
      }

      expect(condition.repeatable).toBe(true)
      expect(condition.type).toBe('REPEATABLE')
      expect(condition.number).toBe('11-16')
    })

    it('should support standard condition with single number', () => {
      const condition: Condition = {
        id: 'SC21',
        number: 21,
        type: 'STANDARD',
        repeatable: false,
        name: 'Dust Storm',
        description: 'Reduced visibility',
        effect: 'combat',
        modifier: -1
      }

      expect(condition.repeatable).toBe(false)
      expect(condition.type).toBe('STANDARD')
      expect(condition.number).toBe(21)
    })
  })

  describe('optional properties', () => {
    it('should support battleEffect string', () => {
      const condition: Condition = {
        id: 'SC21',
        number: 21,
        type: 'STANDARD',
        repeatable: false,
        name: 'Dust Storm',
        description: 'Swirling particles',
        effect: 'combat',
        battleEffect: 'All operatives have Conceal. Reduce shooting ranges by 2 inches.'
      }

      expect(condition.battleEffect).toBeDefined()
      expect(condition.battleEffect).toContain('Conceal')
    })

    it('should support special rules array', () => {
      const condition: Condition = {
        id: 'SC25',
        number: 25,
        type: 'STANDARD',
        repeatable: false,
        name: 'Complex Condition',
        description: 'Multiple effects',
        effect: 'combat',
        specialRules: ['EFFECT_1', 'EFFECT_2']
      }

      expect(condition.specialRules).toHaveLength(2)
    })
  })
})

describe('HexState Type', () => {
  it('should support supplyCount for depleting resources', () => {
    const hexState: HexState = {
      supplyCount: 4
    }

    expect(hexState.supplyCount).toBe(4)
  })

  it('should support intelGained flag', () => {
    const hexState: HexState = {
      intelGained: false
    }

    expect(hexState.intelGained).toBe(false)
  })

  it('should support portalDestination for portal linking', () => {
    const hexState: HexState = {
      portalDestination: 'hex_3_4'
    }

    expect(hexState.portalDestination).toBe('hex_3_4')
  })

  it('should support beastLairActive flag', () => {
    const hexState: HexState = {
      beastLairActive: true
    }

    expect(hexState.beastLairActive).toBe(true)
  })

  it('should support multiple state properties', () => {
    const hexState: HexState = {
      supplyCount: 3,
      intelGained: true,
      portalDestination: 'hex_2_5',
      beastLairActive: false
    }

    expect(hexState.supplyCount).toBe(3)
    expect(hexState.intelGained).toBe(true)
    expect(hexState.portalDestination).toBe('hex_2_5')
    expect(hexState.beastLairActive).toBe(false)
  })
})

describe('Hex Type with State', () => {
  it('should support optional state property', () => {
    const hex: Hex = {
      id: 'hex_1_2',
      row: 1,
      col: 2,
      type: 'surface',
      location: 21,
      condition: 11,
      explored: true,
      exploredBy: [0],
      state: {
        supplyCount: 5
      }
    }

    expect(hex.state).toBeDefined()
    expect(hex.state?.supplyCount).toBe(5)
  })

  it('should work without state property', () => {
    const hex: Hex = {
      id: 'hex_0_0',
      row: 0,
      col: 0,
      type: 'surface',
      location: 11,
      condition: 11,
      explored: false,
      exploredBy: []
    }

    expect(hex.state).toBeUndefined()
  })

  it('should support exploredLocation as string ID', () => {
    const hex: Hex = {
      id: 'hex_1_1',
      row: 1,
      col: 1,
      type: 'surface',
      location: 21,
      condition: 11,
      explored: true,
      exploredBy: [0],
      exploredLocation: 'SL21',
      exploredCondition: 'SC11-16'
    }

    expect(hex.exploredLocation).toBe('SL21')
    expect(hex.exploredCondition).toBe('SC11-16')
  })
})
