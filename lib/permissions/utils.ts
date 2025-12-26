import { db } from '@/lib/db/client'
import { campaigns, campaignPlayers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Campaign role enum
 * WHY: Type-safe role representation for permission checks
 */
export type CampaignRole = 'owner' | 'player' | 'none'

/**
 * Check if user is campaign owner
 * WHY: Simple boolean check for UI conditional rendering
 *
 * @param campaignId - Campaign ID to check
 * @param userId - User ID to check
 * @returns true if user owns the campaign
 */
export async function isCampaignOwner(
  campaignId: number,
  userId: number
): Promise<boolean> {
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId),
    columns: { ownerId: true }
  })

  return campaign?.ownerId === userId
}

/**
 * Check if user is campaign player
 * WHY: Simple boolean check for UI conditional rendering
 *
 * @param campaignId - Campaign ID to check
 * @param userId - User ID to check
 * @returns true if user is a player (not including owner)
 */
export async function isCampaignPlayer(
  campaignId: number,
  userId: number
): Promise<boolean> {
  const player = await db.query.campaignPlayers.findFirst({
    where: and(
      eq(campaignPlayers.campaignId, campaignId),
      eq(campaignPlayers.userId, userId)
    )
  })

  return !!player
}

/**
 * Check if user has any access to campaign (owner or player)
 * WHY: Convenient check for "can view campaign" permission
 *
 * @param campaignId - Campaign ID to check
 * @param userId - User ID to check
 * @returns true if user is owner OR player
 */
export async function hasCampaignAccess(
  campaignId: number,
  userId: number
): Promise<boolean> {
  // WHY: Check owner first (faster query, only 1 row)
  const isOwner = await isCampaignOwner(campaignId, userId)
  if (isOwner) return true

  // WHY: Only check player if not owner
  return await isCampaignPlayer(campaignId, userId)
}

/**
 * Get user's role in campaign
 * WHY: Provides detailed role information for UI display
 *
 * @param campaignId - Campaign ID to check
 * @param userId - User ID to check
 * @returns 'owner', 'player', or 'none'
 */
export async function getCampaignRole(
  campaignId: number,
  userId: number
): Promise<CampaignRole> {
  // WHY: Check owner first (most privileged role)
  const isOwner = await isCampaignOwner(campaignId, userId)
  if (isOwner) return 'owner'

  // WHY: Check player second
  const isPlayer = await isCampaignPlayer(campaignId, userId)
  if (isPlayer) return 'player'

  // WHY: No access
  return 'none'
}
