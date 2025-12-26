import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db/client'
import { campaigns, campaignPlayers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Session } from 'next-auth'

/**
 * Permission check result for successful authentication
 * WHY: Provides complete context about user's relationship to campaign
 */
export interface CampaignAccessResult {
  session: Session
  campaign: typeof campaigns.$inferSelect
  isOwner: boolean
  isPlayer: boolean
}

/**
 * Simplified result for owner-only checks
 * WHY: Owner operations don't need isOwner/isPlayer flags
 */
export interface CampaignOwnerResult {
  session: Session
  campaign: typeof campaigns.$inferSelect
}

/**
 * Check if user is authenticated
 * WHY: Reusable auth check prevents code duplication across routes
 *
 * @returns null if authenticated, 401 NextResponse if not
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    )
  }

  return null
}

/**
 * Require user to have access to campaign (owner OR player)
 * WHY: Most campaign routes allow both owners and players to access/update
 *
 * @param _request - Next.js request object (unused, for future use)
 * @param campaignId - Campaign ID to check access for
 * @param requireOwner - If true, only owner can access (for destructive operations)
 * @returns Permission result or error response
 */
export async function requireCampaignAccess(
  _request: NextRequest,
  campaignId: number,
  requireOwner = false
): Promise<CampaignAccessResult | NextResponse> {
  // WHY: All campaign operations require authentication
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    )
  }

  // WHY: Check campaign exists before checking permissions
  // This prevents information leakage about campaign existence
  const campaign = await getCampaign(campaignId)
  if (!campaign) {
    return NextResponse.json(
      { error: 'Campaign not found' },
      { status: 404 }
    )
  }

  const userId = parseInt(session.user.id)
  const isOwner = campaign.ownerId === userId

  // WHY: Check player membership only if not owner
  // Owners automatically have access without being listed as players
  const isPlayer = isOwner ? false : await checkPlayerMembership(campaignId, userId)

  // WHY: Owner-required operations (delete, settings) need explicit ownership
  if (requireOwner && !isOwner) {
    return NextResponse.json(
      { error: 'Forbidden - Owner access required' },
      { status: 403 }
    )
  }

  // WHY: Both owners and players can view/update campaign state
  if (!isOwner && !isPlayer) {
    return NextResponse.json(
      { error: 'Forbidden - No access to this campaign' },
      { status: 403 }
    )
  }

  return { session, campaign, isOwner, isPlayer }
}

/**
 * Require user to be campaign owner
 * WHY: Dedicated function for owner-only operations (delete, invite, settings)
 *
 * @param _request - Next.js request object (unused, for future use)
 * @param campaignId - Campaign ID to check ownership for
 * @returns Owner result or error response
 */
export async function requireCampaignOwner(
  _request: NextRequest,
  campaignId: number
): Promise<CampaignOwnerResult | NextResponse> {
  // WHY: Reuse requireCampaignAccess with requireOwner flag
  // Avoids duplicating auth and campaign lookup logic
  const result = await requireCampaignAccess(_request, campaignId, true)

  // WHY: Type guard to handle both success and error cases
  if (result instanceof NextResponse) {
    return result
  }

  return { session: result.session, campaign: result.campaign }
}

/**
 * Get campaign by ID
 * WHY: Centralized campaign lookup with consistent error handling
 *
 * @param campaignId - Campaign ID to fetch
 * @returns Campaign or null if not found
 */
async function getCampaign(campaignId: number) {
  return await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId)
  })
}

/**
 * Check if user is a player in campaign
 * WHY: Separate function keeps requireCampaignAccess under 20 lines
 *
 * @param campaignId - Campaign ID to check
 * @param userId - User ID to check
 * @returns true if user is a player
 */
async function checkPlayerMembership(
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
