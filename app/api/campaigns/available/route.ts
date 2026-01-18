import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permissions/middleware'
import { db } from '@/lib/db/client'
import { campaigns, campaignPlayers } from '@/lib/db/schema'
import { and, eq, ne, sql } from 'drizzle-orm'

/**
 * GET /api/campaigns/available
 * List campaigns available for joining
 *
 * WHY: Allow users to discover and join campaigns created by others
 * Filters:
 * - Campaign status must be 'setup' (not started yet)
 * - Campaign must not be full (current players < max players)
 * - User must not already be a member
 */
export async function GET(_request: NextRequest) {
  // WHY: Only authenticated users can browse campaigns
  const authResult = await requireAuth()
  if (authResult) return authResult

  try {
    const session = await import('@/lib/auth/auth').then(m => m.auth())
    const userId = parseInt(session!.user!.id)

    // WHY: Get all campaigns where user is already a member
    const userCampaignIds = await db
      .select({ campaignId: campaignPlayers.campaignId })
      .from(campaignPlayers)
      .where(eq(campaignPlayers.userId, userId))

    const excludedIds = userCampaignIds.map(record => record.campaignId)

    // WHY: Get campaigns in 'setup' status that user hasn't joined
    const setupCampaigns = await db.query.campaigns.findMany({
      where: and(
        eq(campaigns.status, 'setup'),
        excludedIds.length > 0
          ? sql`${campaigns.id} NOT IN ${excludedIds}`
          : undefined
      ),
      orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)]
    })

    // WHY: Filter out full campaigns (where player count >= max players)
    const availableCampaigns = await Promise.all(
      setupCampaigns.map(async (campaign) => {
        const playerCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(campaignPlayers)
          .where(eq(campaignPlayers.campaignId, campaign.id))

        const maxPlayers = campaign.settings.playerCount
        const currentPlayers = Number(playerCount[0]?.count || 0)

        return {
          campaign,
          currentPlayers,
          maxPlayers,
          isFull: currentPlayers >= maxPlayers
        }
      })
    )

    // WHY: Return only campaigns that aren't full
    const joinableCampaigns = availableCampaigns
      .filter(item => !item.isFull)
      .map(item => ({
        ...item.campaign,
        currentPlayers: item.currentPlayers,
        maxPlayers: item.maxPlayers
      }))

    return NextResponse.json({ campaigns: joinableCampaigns })
  } catch (error: any) {
    console.error('Available campaigns error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
