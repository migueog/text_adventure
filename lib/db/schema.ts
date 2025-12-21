import { pgTable, serial, varchar, timestamp, jsonb, integer } from 'drizzle-orm/pg-core'

/**
 * Users table
 * Stores user account information for authentication and identification
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

/**
 * Campaigns table
 * Stores campaign metadata and full game state
 * Each campaign is owned by a user and can have multiple players
 */
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerId: integer('owner_id').references(() => users.id).notNull(),
  settings: jsonb('settings').notNull(), // Map size, player count, target threat level, game mode
  gameState: jsonb('game_state').notNull(), // Full game state including hex map, threat level, current phase
  status: varchar('status', { length: 50 }).notNull(), // 'setup', 'active', 'completed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

/**
 * Campaign Players table
 * Links users to campaigns and stores per-player game state
 * Each player has their own position, resources, and statistics
 */
export const campaignPlayers = pgTable('campaign_players', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').references(() => campaigns.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  playerName: varchar('player_name', { length: 100 }).notNull(),
  playerState: jsonb('player_state').notNull(), // SP, CP, position, explored hexes, bases, camps, statistics
  joinedAt: timestamp('joined_at').defaultNow().notNull()
})

/**
 * Invitations table
 * Tracks invitations sent to users to join campaigns
 * Uses token-based system with expiration
 */
export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').references(() => campaigns.id).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull(), // 'pending', 'accepted', 'declined'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull()
})

/**
 * Type exports for use in application code
 */
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Campaign = typeof campaigns.$inferSelect
export type NewCampaign = typeof campaigns.$inferInsert

export type CampaignPlayer = typeof campaignPlayers.$inferSelect
export type NewCampaignPlayer = typeof campaignPlayers.$inferInsert

export type Invitation = typeof invitations.$inferSelect
export type NewInvitation = typeof invitations.$inferInsert
