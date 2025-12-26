import { NextRequest, NextResponse } from 'next/server'
import { requireCampaignAccess, requireCampaignOwner } from '@/lib/permissions/middleware'
import { db } from '@/lib/db/client'
import { campaigns, campaignPlayers, invitations } from '@/lib/db/schema'
import { campaignUpdateSchema } from '@/lib/validation/campaign'
import { eq } from 'drizzle-orm'

/**
 * GET /api/campaigns/[id]
 * Get campaign details
 *
 * WHY: Allows owners and players to view campaign information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const campaignId = parseInt(params.id)

  // WHY: Check user has access (owner or player)
  const access = await requireCampaignAccess(request, campaignId)
  if (access instanceof NextResponse) return access

  return NextResponse.json({ campaign: access.campaign })
}

/**
 * PATCH /api/campaigns/[id]
 * Update campaign settings
 *
 * WHY: Allows owner to modify campaign configuration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const campaignId = parseInt(params.id)

  // WHY: Only owner can update campaign settings
  const access = await requireCampaignOwner(request, campaignId)
  if (access instanceof NextResponse) return access

  try {
    const body = await request.json()

    // WHY: Validate update payload
    const validation = campaignUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const updates = validation.data

    // WHY: Build update object conditionally
    const updateData: any = { updatedAt: new Date() }
    if (updates.name) updateData.name = updates.name
    if (updates.settings) {
      // WHY: Merge settings carefully (settings is JSONB)
      const currentSettings = access.campaign.settings as any
      updateData.settings = {
        ...currentSettings,
        ...updates.settings
      }
    }

    // WHY: Update campaign in database
    const [updated] = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, campaignId))
      .returning()

    return NextResponse.json({ campaign: updated })
  } catch (error: any) {
    console.error('Campaign update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Delete campaign and all related data
 *
 * WHY: Allows owner to permanently remove campaign
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const campaignId = parseInt(params.id)

  // WHY: Only owner can delete campaign
  const access = await requireCampaignOwner(request, campaignId)
  if (access instanceof NextResponse) return access

  try {
    // WHY: Delete related records first (foreign key constraints)
    await db.delete(invitations).where(eq(invitations.campaignId, campaignId))
    await db.delete(campaignPlayers).where(eq(campaignPlayers.campaignId, campaignId))

    // WHY: Delete campaign last
    await db.delete(campaigns).where(eq(campaigns.id, campaignId))

    return NextResponse.json(
      { success: true, message: 'Campaign deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Campaign deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
