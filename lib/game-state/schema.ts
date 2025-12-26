import { z } from 'zod'

/**
 * Hex position schema
 * WHY: Validates hex coordinates in offset coordinate system
 */
export const HexPositionSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0)
})

/**
 * Player schema for game state
 * WHY: Ensures player data structure is valid
 */
export const PlayerSchema = z.object({
  userId: z.number().int(),
  username: z.string(),
  sp: z.number().int().min(0).max(10), // WHY: Supply Points must be 0-10
  cp: z.number().int().min(0), // WHY: Campaign Points cannot be negative
  currentHex: z.string().nullable(),
  baseHex: z.string().nullable(),
  camps: z.array(z.string()),
  lastBattleResult: z.enum(['win', 'draw', 'loss', 'bye']).nullable(),
  victoryCategories: z.object({
    warlord: z.number().int().min(0),
    pioneer: z.number().int().min(0),
    explorer: z.number().int().min(0),
    trooper: z.number().int().min(0),
    warrior: z.number().int().min(0),
    headhunter: z.number().int().min(0)
  })
})

/**
 * Hex schema for game state
 * WHY: Validates individual hex data
 */
export const HexSchema = z.object({
  type: z.enum(['surface', 'tomb', 'blocked']),
  explored: z.boolean(),
  location: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string()
  }).optional(),
  condition: z.object({
    id: z.string(),
    name: z.string()
  }).optional(),
  locationState: z.any().optional() // WHY: Flexible for location-specific data
})

/**
 * Game event schema
 * WHY: Validates event log entries
 */
export const GameEventSchema = z.object({
  timestamp: z.string(),
  playerId: z.number().int().nullable(),
  type: z.string(),
  description: z.string(),
  data: z.any().optional()
})

/**
 * Complete campaign state schema
 * WHY: Validates entire game state for database storage
 */
export const CampaignStateSchema = z.object({
  gameStarted: z.boolean(),
  gameEnded: z.boolean(),
  soloMode: z.boolean(),
  currentRound: z.number().int().min(0),
  currentPhase: z.enum(['setup', 'movement', 'battle', 'action', 'threat']),
  currentPlayerIndex: z.number().int().min(0),
  threatLevel: z.number().int().min(1).max(10),
  targetThreatLevel: z.number().int().min(1).max(10),
  players: z.array(PlayerSchema),
  hexes: z.record(z.string(), HexSchema), // WHY: Key is hex coordinate string
  mapConfig: z.object({
    rows: z.number().int().min(5).max(7),
    cols: z.number().int().min(5).max(7)
  }),
  eventLog: z.array(GameEventSchema)
})

/**
 * Type exports
 * WHY: Provides TypeScript types from schemas
 */
export type HexPosition = z.infer<typeof HexPositionSchema>
export type Player = z.infer<typeof PlayerSchema>
export type Hex = z.infer<typeof HexSchema>
export type GameEvent = z.infer<typeof GameEventSchema>
export type CampaignState = z.infer<typeof CampaignStateSchema>
