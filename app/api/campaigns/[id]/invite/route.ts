import { NextRequest, NextResponse } from 'next/server'
import { requireCampaignOwner } from '@/lib/permissions/middleware'
import { db } from '@/lib/db/client'
import { invitations, users } from '@/lib/db/schema'
import { generateInvitationToken, getExpirationDate } from '@/lib/utils/invitation'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

/**
 * Invitation schema
 * WHY: Validate email before creating invitation
 */
const inviteSchema = z.object({
  email: z.string().email('Invalid email address')
})

/**
 * POST /api/campaigns/[id]/invite
 * Send campaign invitation
 *
 * WHY: Allows owner to invite players by email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const campaignId = parseInt(params.id)

  // WHY: Only owner can invite players
  const access = await requireCampaignOwner(request, campaignId)
  if (access instanceof NextResponse) return access

  try {
    const body = await request.json()

    // WHY: Validate email format
    const validation = inviteSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // WHY: Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found. They must create an account first.' },
        { status: 404 }
      )
    }

    // WHY: Generate unique token
    const token = generateInvitationToken()
    const expiresAt = getExpirationDate()

    // WHY: Create invitation in database
    const [invitation] = await db
      .insert(invitations)
      .values({
        campaignId,
        email,
        token,
        status: 'pending',
        expiresAt
      })
      .returning()

    return NextResponse.json({ invitation }, { status: 201 })
  } catch (error: any) {
    console.error('Invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/campaigns/[id]/invite
 * List campaign invitations
 *
 * WHY: Owner can view pending invitations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const campaignId = parseInt(params.id)

  // WHY: Only owner can view invitations
  const access = await requireCampaignOwner(request, campaignId)
  if (access instanceof NextResponse) return access

  try {
    const campaignInvitations = await db.query.invitations.findMany({
      where: eq(invitations.campaignId, campaignId),
      orderBy: (invitations, { desc }) => [desc(invitations.createdAt)]
    })

    return NextResponse.json({ invitations: campaignInvitations })
  } catch (error: any) {
    console.error('List invitations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
