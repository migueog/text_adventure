import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permissions/middleware'
import { db } from '@/lib/db/client'
import { campaigns, campaignPlayers } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

/**
 * POST /api/campaigns/[id]/join
 * Join an existing campaign
 *
 * WHY: Allows users to join campaigns in 'setup' status
 * Validations:
 * - Campaign must exist
 * - Campaign must be in 'setup' status
 * - Campaign must not be full
 * - User must not already be a member
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const campaignId = parseInt(id, 10)

  if (isNaN(campaignId)) {
    return NextResponse.json(
      { error: 'Invalid campaign ID' },
      { status: 400 }
    )
  }

  // WHY: Only authenticated users can join campaigns
  const authResult = await requireAuth()
  if (authResult) return authResult

  try {
    const session = await import('@/lib/auth/auth').then(m => m.auth())
    const userId = parseInt(session!.user!.id)

    // WHY: Check if campaign exists and get its status
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1)

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // WHY: Only allow joining campaigns in 'setup' status
    if (campaign.status !== 'setup') {
      return NextResponse.json(
        { error: 'Campaign has already started or ended' },
        { status: 400 }
      )
    }

    // WHY: Check if user is already a member
    const existingMembership = await db
      .select()
      .from(campaignPlayers)
      .where(
        sql`${campaignPlayers.campaignId} = ${campaignId} AND ${campaignPlayers.userId} = ${userId}`
      )
      .limit(1)

    if (existingMembership.length > 0) {
      return NextResponse.json(
        { error: 'You are already a member of this campaign' },
        { status: 400 }
      )
    }

    // WHY: Check if campaign is full
    const playerCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(campaignPlayers)
      .where(eq(campaignPlayers.campaignId, campaignId))

    const maxPlayers = campaign.settings.playerCount
    const currentPlayers = Number(playerCount[0]?.count || 0)

    if (currentPlayers >= maxPlayers) {
      return NextResponse.json(
        { error: 'Campaign is full' },
        { status: 400 }
      )
    }

    // WHY: Add user as campaign player
    const [player] = await db
      .insert(campaignPlayers)
      .values({
        campaignId,
        userId,
        playerName: session!.user!.name || `Player ${currentPlayers + 1}`,
        playerState: {
          sp: 5,
          cp: 0,
          currentHex: null,
          baseHex: null,
          camps: [],
          lastBattleResult: null,
          victoryCategories: {
            warlord: 0,
            pioneer: 0,
            explorer: 0,
            trooper: 0,
            warrior: 0,
            headhunter: 0
          }
        }
      })
      .returning()

    return NextResponse.json(
      {
        message: 'Successfully joined campaign',
        player
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Join campaign error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
