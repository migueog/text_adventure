import { describe, it, expect } from 'vitest'
import { validateImportData, migrateCampaignData } from './campaignImport'
import type { CampaignExport } from './campaignExport'

/**
 * WHY: Test suite for campaign import functionality (Issue #23 - Phase 2)
 * Ensures import validation, migration, and error handling work correctly
 */

// WHY: Helper to create a minimal valid campaign export for testing
function createValidExport(overrides: Partial<CampaignExport> = {}): CampaignExport {
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    campaign: {
      threatLevel: 1,
      targetThreatLevel: 10,
      currentRound: 1,
      currentPhase: 'Movement',
      hexMap: {}
    },
    players: [],
    events: [],
    victoryData: {
      categories: {},
      champion: ''
    },
    ...overrides
  }
}

describe('validateImportData', () => {
  describe('when data is valid', () => {
    it('should accept valid 1.0.0 export', () => {
      const validData = createValidExport()

      const result = validateImportData(validData)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
      expect(result.versionMismatch).toBe(false)
      expect(result.currentVersion).toBe('1.0.0')
      expect(result.importVersion).toBe('1.0.0')
    })

    it('should accept valid export with all optional fields', () => {
      const validData = createValidExport({
        players: [{
          id: 0,
          name: 'Player 1',
          killTeamName: 'Team 1',
          color: '#ff0000',
          position: { row: 0, col: 0 },
          supplyPoints: 10,
          campaignPoints: 0,
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
          battleHistory: [],
          supplyPointsSpent: 0,
          operativeKillDetails: []
        }],
        events: [{
          type: 'system',
          icon: 'ℹ️',
          message: 'Test event',
          round: 1,
          phase: 'Movement',
          timestamp: new Date().toISOString()
        }]
      })

      const result = validateImportData(validData)

      expect(result.valid).toBe(true)
    })
  })

  describe('when data is malformed', () => {
    it('should reject non-object data', () => {
      const result = validateImportData('not an object')

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('must be an object')
    })

    it('should reject null data', () => {
      const result = validateImportData(null)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject array data', () => {
      const result = validateImportData([])

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('when required fields are missing', () => {
    it('should reject data missing version field', () => {
      const invalidData = { ...createValidExport() }
      delete (invalidData as any).version

      const result = validateImportData(invalidData)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('version'))).toBe(true)
    })

    it('should reject data missing campaign field', () => {
      const invalidData = { ...createValidExport() }
      delete (invalidData as any).campaign

      const result = validateImportData(invalidData)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('campaign'))).toBe(true)
    })

    it('should reject data missing players field', () => {
      const invalidData = { ...createValidExport() }
      delete (invalidData as any).players

      const result = validateImportData(invalidData)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('players'))).toBe(true)
    })

    it('should reject data missing events field', () => {
      const invalidData = { ...createValidExport() }
      delete (invalidData as any).events

      const result = validateImportData(invalidData)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('events'))).toBe(true)
    })
  })

  describe('when field types are incorrect', () => {
    it('should reject when version is not a string', () => {
      const invalidData = createValidExport({ version: 123 as any })

      const result = validateImportData(invalidData)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('version') && e.includes('string'))).toBe(true)
    })

    it('should reject when players is not an array', () => {
      const invalidData = createValidExport({ players: {} as any })

      const result = validateImportData(invalidData)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('players') && e.includes('array'))).toBe(true)
    })

    it('should reject when threatLevel is not a number', () => {
      const invalidData = createValidExport({
        campaign: {
          ...createValidExport().campaign,
          threatLevel: '5' as any
        }
      })

      const result = validateImportData(invalidData)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('threatLevel'))).toBe(true)
    })
  })

  describe('when version mismatches', () => {
    it('should warn on version mismatch (1.1.0 vs 1.0.0)', () => {
      const newerData = createValidExport({ version: '1.1.0' })

      const result = validateImportData(newerData)

      expect(result.versionMismatch).toBe(true)
      expect(result.currentVersion).toBe('1.0.0')
      expect(result.importVersion).toBe('1.1.0')
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('version')
    })

    it('should warn on older version (0.9.0 vs 1.0.0)', () => {
      const olderData = createValidExport({ version: '0.9.0' })

      const result = validateImportData(olderData)

      expect(result.versionMismatch).toBe(true)
      expect(result.importVersion).toBe('0.9.0')
    })
  })

  describe('validation messages', () => {
    it('should provide specific error messages', () => {
      const result = validateImportData({ version: 123 })

      expect(result.errors.length).toBeGreaterThan(0)
      result.errors.forEach(error => {
        expect(error).toBeTypeOf('string')
        expect(error.length).toBeGreaterThan(0)
      })
    })
  })
})

describe('migrateCampaignData', () => {
  describe('when data is current version', () => {
    it('should not migrate 1.0.0 data', () => {
      const data = createValidExport()

      const result = migrateCampaignData(data)

      expect(result.migration.migrated).toBe(false)
      expect(result.migration.fromVersion).toBe('1.0.0')
      expect(result.migration.toVersion).toBe('1.0.0')
      expect(result.migration.changes).toHaveLength(0)
      expect(result.data).toEqual(data)
    })
  })

  describe('when data needs migration', () => {
    it('should migrate 0.9.0 to 1.0.0', () => {
      const oldData = createValidExport({ version: '0.9.0' })

      const result = migrateCampaignData(oldData)

      expect(result.migration.migrated).toBe(true)
      expect(result.migration.fromVersion).toBe('0.9.0')
      expect(result.migration.toVersion).toBe('1.0.0')
      expect(result.migration.changes.length).toBeGreaterThan(0)
      expect(result.data.version).toBe('1.0.0')
    })

    it('should preserve all existing data during migration', () => {
      const oldData = createValidExport({
        version: '0.9.0',
        players: [{
          id: 0,
          name: 'Test Player',
          killTeamName: 'Test Team',
          color: '#ff0000',
          position: { row: 1, col: 1 },
          supplyPoints: 5,
          campaignPoints: 10,
          exploredHexes: 3,
          gamesPlayed: 2,
          gamesWon: 1,
          gamesLost: 1,
          operativesKilled: 5,
          bases: [{ row: 0, col: 0 }],
          camps: [{ row: 1, col: 1 }],
          history: [],
          battleResult: null,
          searchedHexes: [],
          battleHistory: [],
          supplyPointsSpent: 15,
          operativeKillDetails: []
        }]
      })

      const result = migrateCampaignData(oldData)

      expect(result.data.players[0].name).toBe('Test Player')
      expect(result.data.players[0].supplyPoints).toBe(5)
      expect(result.data.players[0].campaignPoints).toBe(10)
    })

    it('should document migration changes', () => {
      const oldData = createValidExport({ version: '0.9.0' })

      const result = migrateCampaignData(oldData)

      expect(result.migration.changes).toBeInstanceOf(Array)
      result.migration.changes.forEach(change => {
        expect(change).toBeTypeOf('string')
        expect(change.length).toBeGreaterThan(0)
      })
    })
  })

  describe('when version is unknown', () => {
    it('should handle unknown version gracefully', () => {
      const unknownData = createValidExport({ version: '99.99.99' })

      const result = migrateCampaignData(unknownData)

      expect(result.migration.migrated).toBe(false)
      expect(result.data.version).toBe('99.99.99')
    })
  })

  describe('chained migrations', () => {
    it('should chain multiple migration steps if needed', () => {
      // WHY: If we add version 1.1.0 in future, should migrate 0.9.0 → 1.0.0 → 1.1.0
      const oldData = createValidExport({ version: '0.9.0' })

      const result = migrateCampaignData(oldData)

      expect(result.migration.fromVersion).toBe('0.9.0')
      expect(result.data.version).toBe('1.0.0')
    })
  })
})
