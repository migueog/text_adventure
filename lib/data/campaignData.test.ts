import { describe, it, expect } from 'vitest'
import { SURFACE_LOCATIONS, TOMB_LOCATIONS, SURFACE_CONDITIONS, TOMB_CONDITIONS } from './campaignData'
import { validateLocationCoverage, validateConditionCoverage } from '@/lib/utils/dataValidation'
import type { Location, Condition } from '@/types/campaign'

/**
 * WHY: Tests for campaign data integrity (Issue #58)
 * Validates all D36 numbers covered, repeatable entries structured correctly
 */

describe('Campaign Data - Surface Locations', () => {
  it('should cover all D36 numbers (11-16, 21-26, 31-36)', () => {
    const locations = Object.values(SURFACE_LOCATIONS)
    const result = validateLocationCoverage(locations)

    expect(result.valid).toBe(true)
    expect(result.missingNumbers).toEqual([])
  })

  it('should have exactly one unique repeatable entry for 11-16', () => {
    const uniqueEntries = new Set(Object.values(SURFACE_LOCATIONS))
    const repeatableEntries = Array.from(uniqueEntries).filter(loc => loc.repeatable)

    expect(repeatableEntries).toHaveLength(1)
    expect(repeatableEntries[0]?.id).toBe('SL11-16')
    expect(repeatableEntries[0]?.number).toBe('11-16')
  })

  it('should have all 6 numbers (11-16) reference the same repeatable entry', () => {
    const entry11 = SURFACE_LOCATIONS[11]

    expect(SURFACE_LOCATIONS[12]).toBe(entry11)
    expect(SURFACE_LOCATIONS[13]).toBe(entry11)
    expect(SURFACE_LOCATIONS[14]).toBe(entry11)
    expect(SURFACE_LOCATIONS[15]).toBe(entry11)
    expect(SURFACE_LOCATIONS[16]).toBe(entry11)
  })

  it('should have 12 unique entries for 21-36', () => {
    const uniqueNumbers = [21, 22, 23, 24, 25, 26, 31, 32, 33, 34, 35, 36]
    const uniqueEntries = uniqueNumbers.map(n => SURFACE_LOCATIONS[n])

    // All should be non-repeatable
    uniqueEntries.forEach(entry => {
      expect(entry?.repeatable).toBe(false)
      expect(entry?.type).toMatch(/UNIQUE|SPECIAL/)
    })

    // All should have different IDs
    const ids = uniqueEntries.map(e => e?.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(12)
  })

  it('should have proper ID format for all entries', () => {
    const allEntries = Object.values(SURFACE_LOCATIONS)
    const uniqueEntries = Array.from(new Set(allEntries))

    uniqueEntries.forEach(entry => {
      expect(entry.id).toMatch(/^SL\d{2}(-\d{2})?$/)
    })
  })

  it('should have initialState for depleting locations', () => {
    // Abandoned Camp should have initialState for supplyCount
    const abandonedCamp = Object.values(SURFACE_LOCATIONS)
      .find(loc => loc.name === 'Abandoned Camp')

    if (abandonedCamp?.specialRules?.includes('DEPLETING_SUPPLY')) {
      expect(abandonedCamp.initialState).toBeDefined()
      expect(abandonedCamp.initialState?.supplyCount).toBeDefined()
    }
  })

  it('should have specialRules for special mechanics', () => {
    const allEntries = Object.values(SURFACE_LOCATIONS)
    const uniqueEntries = Array.from(new Set(allEntries))

    // Check that special locations have specialRules
    const specialEntries = uniqueEntries.filter(e => e.type === 'SPECIAL')

    specialEntries.forEach(entry => {
      expect(entry.specialRules).toBeDefined()
      expect(entry.specialRules!.length).toBeGreaterThan(0)
    })
  })

  it('should have campRule for locations with camping restrictions', () => {
    const allEntries = Object.values(SURFACE_LOCATIONS)
    const uniqueEntries = Array.from(new Set(allEntries))

    // Beast Lair should forbid camping
    const beastLair = uniqueEntries.find(e => e.name === 'Beast Lair')
    if (beastLair) {
      expect(beastLair.campRule).toBe('FORBIDDEN')
    }
  })
})

describe('Campaign Data - Tomb Locations', () => {
  it('should cover all D36 numbers (11-16, 21-26, 31-36)', () => {
    const locations = Object.values(TOMB_LOCATIONS)
    const result = validateLocationCoverage(locations)

    expect(result.valid).toBe(true)
    expect(result.missingNumbers).toEqual([])
  })

  it('should have exactly one unique repeatable entry for 11-16', () => {
    const uniqueEntries = new Set(Object.values(TOMB_LOCATIONS))
    const repeatableEntries = Array.from(uniqueEntries).filter(loc => loc.repeatable)

    expect(repeatableEntries).toHaveLength(1)
    expect(repeatableEntries[0]?.id).toBe('TL11-16')
    expect(repeatableEntries[0]?.number).toBe('11-16')
  })

  it('should have proper ID format for all entries', () => {
    const allEntries = Object.values(TOMB_LOCATIONS)
    const uniqueEntries = Array.from(new Set(allEntries))

    uniqueEntries.forEach(entry => {
      expect(entry.id).toMatch(/^TL\d{2}(-\d{2})?$/)
    })
  })
})

describe('Campaign Data - Surface Conditions', () => {
  it('should cover all D36 numbers (11-16, 21-26, 31-36)', () => {
    const conditions = Object.values(SURFACE_CONDITIONS)
    const result = validateConditionCoverage(conditions)

    expect(result.valid).toBe(true)
    expect(result.missingNumbers).toEqual([])
  })

  it('should have exactly one unique repeatable entry for 11-16', () => {
    const uniqueEntries = new Set(Object.values(SURFACE_CONDITIONS))
    const repeatableEntries = Array.from(uniqueEntries).filter(cond => cond.repeatable)

    expect(repeatableEntries).toHaveLength(1)
    expect(repeatableEntries[0]?.id).toBe('SC11-16')
    expect(repeatableEntries[0]?.number).toBe('11-16')
  })

  it('should have all 6 numbers (11-16) reference the same repeatable entry', () => {
    const entry11 = SURFACE_CONDITIONS[11]

    expect(SURFACE_CONDITIONS[12]).toBe(entry11)
    expect(SURFACE_CONDITIONS[13]).toBe(entry11)
    expect(SURFACE_CONDITIONS[14]).toBe(entry11)
    expect(SURFACE_CONDITIONS[15]).toBe(entry11)
    expect(SURFACE_CONDITIONS[16]).toBe(entry11)
  })

  it('should have proper ID format for all entries', () => {
    const allEntries = Object.values(SURFACE_CONDITIONS)
    const uniqueEntries = Array.from(new Set(allEntries))

    uniqueEntries.forEach(entry => {
      expect(entry.id).toMatch(/^SC\d{2}(-\d{2})?$/)
    })
  })
})

describe('Campaign Data - Tomb Conditions', () => {
  it('should cover all D36 numbers (11-16, 21-26, 31-36)', () => {
    const conditions = Object.values(TOMB_CONDITIONS)
    const result = validateConditionCoverage(conditions)

    expect(result.valid).toBe(true)
    expect(result.missingNumbers).toEqual([])
  })

  it('should have exactly one unique repeatable entry for 11-16', () => {
    const uniqueEntries = new Set(Object.values(TOMB_CONDITIONS))
    const repeatableEntries = Array.from(uniqueEntries).filter(cond => cond.repeatable)

    expect(repeatableEntries).toHaveLength(1)
    expect(repeatableEntries[0]?.id).toBe('TC11-16')
    expect(repeatableEntries[0]?.number).toBe('11-16')
  })

  it('should have proper ID format for all entries', () => {
    const allEntries = Object.values(TOMB_CONDITIONS)
    const uniqueEntries = Array.from(new Set(allEntries))

    uniqueEntries.forEach(entry => {
      expect(entry.id).toMatch(/^TC\d{2}(-\d{2})?$/)
    })
  })
})
