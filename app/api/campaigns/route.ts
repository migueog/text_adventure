import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permissions/middleware'
import { db } from '@/lib/db/client'
import { campaigns, campaignPlayers } from '@/lib/db/schema'
import { campaignCreationSchema } from '@/lib/validation/campaign'
import { eq } from 'drizzle-orm'
import { MAP_CONFIGS } from '@/lib/data/campaignData'

/**
 * POST /api/campaigns
 * Create a new campaign
 *
 * WHY: Allows authenticated users to create campaigns they own
 */
export async function POST(request: NextRequest) {
  // WHY: Only authenticated users can create campaigns
  const authResult = await requireAuth()
  if (authResult) return authResult

  try {
    const body = await request.json()

    // WHY: Validate input before database operations
    const validation = campaignCreationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { name, settings } = validation.data
    const session = await import('@/lib/auth/auth').then(m => m.auth())
    const userId = parseInt(session!.user!.id)

    // WHY: Create initial game state with proper structure
    const initialGameState = createInitialGameState(settings)

    // WHY: Insert campaign and owner as campaign player in transaction
    const [campaign] = await db.insert(campaigns).values({
      name,
      ownerId: userId,
      settings,
      gameState: initialGameState,
      status: 'setup'
    }).returning()

    // WHY: Add owner as first player (campaign guaranteed to exist from returning())
    if (!campaign) {
      throw new Error('Campaign creation failed')
    }

    await db.insert(campaignPlayers).values({
      campaignId: campaign.id,
      userId,
      playerName: session!.user!.name || 'Owner',
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

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error: any) {
    console.error('Campaign creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/campaigns
 * List all campaigns the user has access to
 *
 * WHY: Shows users their owned campaigns and campaigns they're playing in
 */
export async function GET(_request: NextRequest) {
  // WHY: Only authenticated users can view campaigns
  const authResult = await requireAuth()
  if (authResult) return authResult

  try {
    const session = await import('@/lib/auth/auth').then(m => m.auth())
    const userId = parseInt(session!.user!.id)

    // WHY: Get campaigns where user is owner
    const ownedCampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.ownerId, userId),
      orderBy: (campaigns, { desc }) => [desc(campaigns.updatedAt)]
    })

    // WHY: Get campaigns where user is a player
    const playerRecords = await db.query.campaignPlayers.findMany({
      where: eq(campaignPlayers.userId, userId)
    })

    // WHY: Fetch full campaign details for joined campaigns
    const joinedCampaignIds = playerRecords
      .map(record => record.campaignId)
      .filter(id => !ownedCampaigns.some(c => c.id === id))

    const joinedCampaigns = joinedCampaignIds.length > 0
      ? await db.query.campaigns.findMany({
          where: (campaigns, { inArray }) => inArray(campaigns.id, joinedCampaignIds)
        })
      : []

    return NextResponse.json({
      owned: ownedCampaigns,
      joined: joinedCampaigns
    })
  } catch (error: any) {
    console.error('Campaign list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Create initial game state for new campaign
 * WHY: Separated into helper function to keep POST handler under 20 lines
 *
 * @param settings - Campaign settings
 * @returns Initial game state object
 */
function createInitialGameState(settings: any) {
  return {
    gameStarted: false,
    gameEnded: false,
    soloMode: settings.soloMode,
    currentRound: 0,
    currentPhase: 'setup' as const,
    currentPlayerIndex: 0,
    threatLevel: 1,
    targetThreatLevel: settings.targetThreatLevel,
    players: [],
    hexes: {},
    mapConfig: MAP_CONFIGS[settings.playerCount as keyof typeof MAP_CONFIGS],
    eventLog: []
  }
}
