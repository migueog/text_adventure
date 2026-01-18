import { NextRequest, NextResponse } from 'next/server'
import { requireCampaignAccess } from '@/lib/permissions/middleware'

/**
 * GET /api/campaigns/[id]/state
 * Get campaign game state for loading into the game UI
 *
 * WHY: Separates game state loading from campaign metadata
 * Allows the frontend to hydrate Zustand store with saved game state
 *
 * Returns:
 * - gameState: Full game state (players, hexes, threat level, phase, etc.)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const campaignId = parseInt(id)

  // WHY: Check user has access (owner or player)
  const access = await requireCampaignAccess(request, campaignId)
  if (access instanceof NextResponse) return access

  // WHY: Return game state for frontend to load
  return NextResponse.json({
    gameState: access.campaign.gameState,
    campaignName: access.campaign.name
  })
}

/**
 * PATCH /api/campaigns/[id]/state
 * Update campaign game state (auto-save functionality)
 *
 * WHY: Allows game to periodically save state without full campaign update
 * Used by Zustand store's saveCampaign action
 *
 * Request body:
 * - gameState: Updated game state object
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const campaignId = parseInt(id)

  // WHY: Check user has access (owner or player)
  const access = await requireCampaignAccess(request, campaignId)
  if (access instanceof NextResponse) return access

  try {
    const { gameState } = await request.json()

    if (!gameState) {
      return NextResponse.json(
        { error: 'gameState is required' },
        { status: 400 }
      )
    }

    // WHY: Update campaign's gameState and timestamp
    const { db } = await import('@/lib/db/client')
    const { campaigns } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    const [updated] = await db
      .update(campaigns)
      .set({
        gameState,
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId))
      .returning()

    return NextResponse.json({
      success: true,
      updatedAt: updated.updatedAt
    })
  } catch (error: any) {
    console.error('State update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
