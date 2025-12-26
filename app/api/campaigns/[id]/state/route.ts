import { NextRequest, NextResponse } from 'next/server'
import { requireCampaignAccess } from '@/lib/permissions/middleware'
import { db } from '@/lib/db/client'
import { campaigns } from '@/lib/db/schema'
import { validateGameState } from '@/lib/game-state/validation'
import { eq } from 'drizzle-orm'

/**
 * GET /api/campaigns/[id]/state
 * Load campaign game state
 *
 * WHY: Allows players and owner to retrieve current game state
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const campaignId = parseInt(params.id)

  // WHY: Both owners and players can view game state
  const access = await requireCampaignAccess(request, campaignId)
  if (access instanceof NextResponse) return access

  return NextResponse.json({
    gameState: access.campaign.gameState
  })
}

/**
 * PATCH /api/campaigns/[id]/state
 * Save campaign game state
 *
 * WHY: Allows players to update game state during their turn
 * Both owners and players can update (for making moves)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const campaignId = parseInt(params.id)

  // WHY: Both owners and players can update state (for game actions)
  const access = await requireCampaignAccess(request, campaignId)
  if (access instanceof NextResponse) return access

  try {
    const body = await request.json()
    const { gameState } = body

    if (!gameState) {
      return NextResponse.json(
        { error: 'gameState is required' },
        { status: 400 }
      )
    }

    // WHY: Validate state structure
    const validation = validateGameState(gameState)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid game state',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // WHY: Update campaign game state in database
    const [updated] = await db
      .update(campaigns)
      .set({
        gameState,
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId))
      .returning()

    if (!updated) {
      throw new Error('Failed to update campaign state')
    }

    return NextResponse.json({
      gameState: updated.gameState
    })
  } catch (error: any) {
    console.error('State update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
