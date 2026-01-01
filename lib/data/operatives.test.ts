import { describe, it, expect } from 'vitest'
import {
  getOperativeById,
  getOperativesByFaction,
  getCommonOperatives,
  getAllFactions,
  OPERATIVE_DATABASE,
  FACTIONS
} from './operatives'
import { calculateOperativeWoundValue } from '../utils/operativeKills'

describe('Operative Database', () => {
  describe('getOperativeById', () => {
    it('should return operative when valid id provided', () => {
      const operative = getOperativeById('fire-warrior')

      expect(operative).toBeDefined()
      expect(operative?.name).toBe('Fire Warrior')
      expect(operative?.faction).toBe('T\'au Empire')
      expect(operative?.wounds).toBe(7)
    })

    it('should return undefined when invalid id provided', () => {
      const operative = getOperativeById('non-existent-operative')

      expect(operative).toBeUndefined()
    })
  })

  describe('getOperativesByFaction', () => {
    it('should return operatives for valid faction', () => {
      const operatives = getOperativesByFaction('space-marines')

      expect(operatives.length).toBeGreaterThan(0)
      operatives.forEach(op => {
        expect(op.faction).toBe('Space Marines')
      })
    })

    it('should return empty array for invalid faction', () => {
      const operatives = getOperativesByFaction('non-existent-faction')

      expect(operatives).toEqual([])
    })

    it('should return all operatives from faction list', () => {
      const orkIds = FACTIONS['orks']
      const operatives = getOperativesByFaction('orks')

      expect(operatives.length).toBe(orkIds?.length || 0)
    })
  })

  describe('getCommonOperatives', () => {
    it('should return 8-10 common operatives', () => {
      const common = getCommonOperatives()

      expect(common.length).toBeGreaterThanOrEqual(8)
      expect(common.length).toBeLessThanOrEqual(10)
    })

    it('should return only valid operatives', () => {
      const common = getCommonOperatives()

      common.forEach(op => {
        expect(op).toBeDefined()
        expect(op.id).toBeDefined()
        expect(op.name).toBeDefined()
        expect(op.wounds).toBeGreaterThan(0)
      })
    })

    it('should include fire-warrior in common operatives', () => {
      const common = getCommonOperatives()
      const hasFireWarrior = common.some(op => op.id === 'fire-warrior')

      expect(hasFireWarrior).toBe(true)
    })
  })

  describe('getAllFactions', () => {
    it('should return all faction keys sorted', () => {
      const factions = getAllFactions()

      expect(factions.length).toBeGreaterThan(0)

      // Check if sorted
      const sorted = [...factions].sort()
      expect(factions).toEqual(sorted)
    })

    it('should return unique faction names', () => {
      const factions = getAllFactions()
      const uniqueFactions = [...new Set(factions)]

      expect(factions.length).toBe(uniqueFactions.length)
    })
  })

  describe('OPERATIVE_DATABASE validation', () => {
    it('should have correctly pre-calculated wound values', () => {
      Object.values(OPERATIVE_DATABASE).forEach(operative => {
        const expectedValue = calculateOperativeWoundValue(operative.wounds)

        expect(operative.woundValue).toBe(expectedValue)
      })
    })

    it('should have operatives with wounds between 1-20', () => {
      Object.values(OPERATIVE_DATABASE).forEach(operative => {
        expect(operative.wounds).toBeGreaterThanOrEqual(1)
        expect(operative.wounds).toBeLessThanOrEqual(20)
      })
    })

    it('should have at least 20 operatives', () => {
      const operativeCount = Object.keys(OPERATIVE_DATABASE).length

      expect(operativeCount).toBeGreaterThanOrEqual(20)
    })

    it('should include required factions', () => {
      const requiredFactions = [
        'space-marines',
        'tau',
        'orks',
        'necrons',
        'astra-militarum'
      ]

      requiredFactions.forEach(faction => {
        expect(FACTIONS[faction]).toBeDefined()
        expect(FACTIONS[faction]?.length).toBeGreaterThan(0)
      })
    })

    it('should have unique operative ids', () => {
      const ids = Object.keys(OPERATIVE_DATABASE)
      const uniqueIds = [...new Set(ids)]

      expect(ids.length).toBe(uniqueIds.length)
    })

    it('should have operatives with all required fields', () => {
      Object.values(OPERATIVE_DATABASE).forEach(operative => {
        expect(operative.id).toBeDefined()
        expect(operative.name).toBeDefined()
        expect(operative.faction).toBeDefined()
        expect(operative.wounds).toBeDefined()
        expect(operative.woundValue).toBeDefined()
      })
    })
  })
})
