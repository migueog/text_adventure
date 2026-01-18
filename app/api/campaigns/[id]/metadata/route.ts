import { NextRequest, NextResponse } from 'next/server'
import { requireCampaignAccess } from '@/lib/permissions/middleware'
import { db } from '@/lib/db/client'
import { campaignPlayers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * WHY: Metadata endpoint provides campaign info and user role
 * Returns campaign details, user role, and list of players
 * Used by frontend to determine what UI to show
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
  const campaignId = parseInt(id, 10)

  // WHY: Validate campaign ID is a valid number
  if (isNaN(campaignId)) {
    return NextResponse.json(
      { error: 'Invalid campaign ID' },
      { status: 400 }
    )
  }

  // WHY: Check user has access to this campaign (owner or player)
  const access = await requireCampaignAccess(request, campaignId)
  if (access instanceof NextResponse) {
    return access // Return error response (401/403/404)
  }

  // WHY: Fetch all players in this campaign for lobby display
  const players = await db
    .select({
      id: campaignPlayers.id,
      userId: campaignPlayers.userId,
      playerName: campaignPlayers.playerName,
      joinedAt: campaignPlayers.joinedAt
    })
    .from(campaignPlayers)
    .where(eq(campaignPlayers.campaignId, campaignId))

  // WHY: Return campaign metadata, role information, and players list
  return NextResponse.json({
    campaign: {
      id: access.campaign.id,
      name: access.campaign.name,
      ownerId: access.campaign.ownerId,
      status: access.campaign.status,
      settings: access.campaign.settings,
      createdAt: access.campaign.createdAt,
      updatedAt: access.campaign.updatedAt
    },
    role: {
      isOwner: access.isOwner,
      isPlayer: access.isPlayer
    },
    userId: access.session.userId,
    players
  })
}
