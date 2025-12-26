/**
 * Example usage of Drizzle ORM with the campaign database
 * This file demonstrates type-safe database operations
 * 
 * NOTE: This is for documentation purposes. To run these examples:
 * 1. Set up a PostgreSQL database
 * 2. Add DATABASE_URL to .env file
 * 3. Run migrations: npm run db:push
 * 4. Uncomment and execute the desired examples
 */

import { db } from './client'
import { users, campaigns, campaignPlayers, invitations } from './schema'
import { eq, and } from 'drizzle-orm'

/**
 * User Management Examples
 */
export async function createUser(email: string, username: string, passwordHash: string) {
  const newUser = await db
    .insert(users)
    .values({
      email,
      username,
      passwordHash
    })
    .returning()
  
  return newUser[0]
}

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
  
  return result[0]
}

export async function getAllUsers() {
  return await db.select().from(users)
}

/**
 * Campaign Management Examples
 */
export async function createCampaign(
  ownerId: number,
  name: string,
  playerCount: number
) {
  const newCampaign = await db
    .insert(campaigns)
    .values({
      name,
      ownerId,
      settings: {
        playerCount,
        mapSize: { rows: 6, cols: 6, surfaceRows: 3, tombRows: 3 },
        targetThreatLevel: 7,
        gameMode: 'competitive'
      },
      gameState: {
        currentRound: 1,
        currentPhase: 'Movement',
        threatLevel: 1,
        hexMap: {}
      },
      status: 'setup'
    })
    .returning()
  
  return newCampaign[0]
}

export async function getCampaignsByOwner(ownerId: number) {
  return await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.ownerId, ownerId))
}

export async function updateCampaignStatus(campaignId: number, status: string) {
  await db
    .update(campaigns)
    .set({ 
      status,
      updatedAt: new Date()
    })
    .where(eq(campaigns.id, campaignId))
}

export async function updateCampaignGameState(campaignId: number, gameState: any) {
  await db
    .update(campaigns)
    .set({ 
      gameState,
      updatedAt: new Date()
    })
    .where(eq(campaigns.id, campaignId))
}

/**
 * Campaign Player Management Examples
 */
export async function addPlayerToCampaign(
  campaignId: number,
  userId: number,
  playerName: string,
  killTeamName: string,
  color: string
) {
  const newPlayer = await db
    .insert(campaignPlayers)
    .values({
      campaignId,
      userId,
      playerName,
      playerState: {
        supplyPoints: 10,
        campaignPoints: 0,
        position: { row: 0, col: 0 },
        killTeamName,
        color,
        bases: [],
        camps: [],
        exploredHexes: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        operativesKilled: 0,
        history: []
      }
    })
    .returning()
  
  return newPlayer[0]
}

export async function getPlayersInCampaign(campaignId: number) {
  return await db
    .select()
    .from(campaignPlayers)
    .where(eq(campaignPlayers.campaignId, campaignId))
}

export async function updatePlayerState(playerId: number, playerState: any) {
  await db
    .update(campaignPlayers)
    .set({ playerState })
    .where(eq(campaignPlayers.id, playerId))
}

/**
 * Invitation Management Examples
 */
export async function createInvitation(
  campaignId: number,
  email: string,
  token: string
) {
  // Set expiration to 7 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  
  const newInvitation = await db
    .insert(invitations)
    .values({
      campaignId,
      email,
      token,
      status: 'pending',
      expiresAt
    })
    .returning()
  
  return newInvitation[0]
}

export async function getInvitationByToken(token: string) {
  const result = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
  
  return result[0]
}

export async function acceptInvitation(invitationId: number) {
  await db
    .update(invitations)
    .set({ status: 'accepted' })
    .where(eq(invitations.id, invitationId))
}

export async function getPendingInvitationsForCampaign(campaignId: number) {
  return await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.campaignId, campaignId),
        eq(invitations.status, 'pending')
      )
    )
}

/**
 * Complex Query Examples
 */

// Get campaign with owner information (join example)
export async function getCampaignWithOwner(campaignId: number) {
  const result = await db
    .select({
      campaign: campaigns,
      owner: users
    })
    .from(campaigns)
    .leftJoin(users, eq(campaigns.ownerId, users.id))
    .where(eq(campaigns.id, campaignId))
  
  return result[0]
}

// Get all players with their user information for a campaign
export async function getCampaignPlayersWithUsers(campaignId: number) {
  return await db
    .select({
      player: campaignPlayers,
      user: users
    })
    .from(campaignPlayers)
    .leftJoin(users, eq(campaignPlayers.userId, users.id))
    .where(eq(campaignPlayers.campaignId, campaignId))
}
