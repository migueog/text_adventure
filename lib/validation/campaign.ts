import { z } from 'zod'

/**
 * Validation schema for campaign creation
 * WHY: Ensures all required fields are present and valid before database insert
 */
export const campaignCreationSchema = z.object({
  name: z
    .string()
    .min(3, 'Campaign name must be at least 3 characters')
    .max(100, 'Campaign name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Campaign name can only contain letters, numbers, spaces, hyphens, and underscores'),

  settings: z.object({
    playerCount: z
      .number()
      .int()
      .min(2, 'Campaign requires at least 2 players')
      .max(6, 'Campaign supports maximum 6 players'),

    targetThreatLevel: z
      .number()
      .int()
      .min(1, 'Target threat level must be at least 1')
      .max(10, 'Target threat level cannot exceed 10'),

    soloMode: z.boolean()
  })
})

/**
 * Validation schema for campaign updates
 * WHY: Allows partial updates while maintaining data integrity
 */
export const campaignUpdateSchema = z.object({
  name: z
    .string()
    .min(3, 'Campaign name must be at least 3 characters')
    .max(100, 'Campaign name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Campaign name can only contain letters, numbers, spaces, hyphens, and underscores')
    .optional(),

  settings: z.object({
    targetThreatLevel: z
      .number()
      .int()
      .min(1, 'Target threat level must be at least 1')
      .max(10, 'Target threat level cannot exceed 10')
      .optional()
  }).optional()
})

/**
 * Type exports for use in API routes
 * WHY: Provides type safety when working with validated data
 */
export type CampaignCreationInput = z.infer<typeof campaignCreationSchema>
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>
