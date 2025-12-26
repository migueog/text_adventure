import { describe, it, expect } from 'vitest'
import { campaignCreationSchema, campaignUpdateSchema } from '@/lib/validation/campaign'

/**
 * WHY: Test campaign validation schemas
 * API route integration tests will use actual database in E2E tests
 */

describe('Campaign Validation', () => {
  describe('campaignCreationSchema', () => {
    it('should accept valid campaign creation data', () => {
      // WHY: Valid data should pass validation
      const validData = {
        name: 'Test Campaign',
        settings: {
          playerCount: 4,
          targetThreatLevel: 7,
          soloMode: false
        }
      }

      const result = campaignCreationSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject campaign name that is too short', () => {
      // WHY: Campaign names must be at least 3 characters
      const invalidData = {
        name: 'AB',
        settings: {
          playerCount: 4,
          targetThreatLevel: 7,
          soloMode: false
        }
      }

      const result = campaignCreationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject campaign name that is too long', () => {
      // WHY: Campaign names must be less than 100 characters
      const invalidData = {
        name: 'A'.repeat(101),
        settings: {
          playerCount: 4,
          targetThreatLevel: 7,
          soloMode: false
        }
      }

      const result = campaignCreationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject campaign name with invalid characters', () => {
      // WHY: Only alphanumeric, spaces, hyphens, and underscores allowed
      const invalidData = {
        name: 'Test Campaign!@#',
        settings: {
          playerCount: 4,
          targetThreatLevel: 7,
          soloMode: false
        }
      }

      const result = campaignCreationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject player count below 2', () => {
      // WHY: Campaigns require at least 2 players
      const invalidData = {
        name: 'Test Campaign',
        settings: {
          playerCount: 1,
          targetThreatLevel: 7,
          soloMode: false
        }
      }

      const result = campaignCreationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject player count above 6', () => {
      // WHY: Campaigns support maximum 6 players
      const invalidData = {
        name: 'Test Campaign',
        settings: {
          playerCount: 7,
          targetThreatLevel: 7,
          soloMode: false
        }
      }

      const result = campaignCreationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject threat level below 1', () => {
      // WHY: Threat level must be at least 1
      const invalidData = {
        name: 'Test Campaign',
        settings: {
          playerCount: 4,
          targetThreatLevel: 0,
          soloMode: false
        }
      }

      const result = campaignCreationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject threat level above 10', () => {
      // WHY: Threat level cannot exceed 10
      const invalidData = {
        name: 'Test Campaign',
        settings: {
          playerCount: 4,
          targetThreatLevel: 11,
          soloMode: false
        }
      }

      const result = campaignCreationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept solo mode campaigns', () => {
      // WHY: Solo mode is a valid campaign type
      const validData = {
        name: 'Solo Campaign',
        settings: {
          playerCount: 2,
          targetThreatLevel: 10,
          soloMode: true
        }
      }

      const result = campaignCreationSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('campaignUpdateSchema', () => {
    it('should accept valid campaign updates', () => {
      // WHY: Valid partial updates should pass
      const validData = {
        name: 'Updated Campaign Name'
      }

      const result = campaignUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept threat level updates', () => {
      // WHY: Threat level can be adjusted mid-campaign
      const validData = {
        settings: {
          targetThreatLevel: 8
        }
      }

      const result = campaignUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept empty updates', () => {
      // WHY: All fields are optional in updates
      const validData = {}

      const result = campaignUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid name in updates', () => {
      // WHY: Same name validation rules apply to updates
      const invalidData = {
        name: 'AB'
      }

      const result = campaignUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})

/**
 * WHY: Integration tests for actual API routes
 * These will be added when we have test database setup
 */
