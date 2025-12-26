import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permissions/middleware'
import { db } from '@/lib/db/client'
import { invitations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * POST /api/invitations/[token]/decline
 * Decline campaign invitation
 *
 * WHY: Allows user to reject invitation
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  // WHY: User must be authenticated to decline
  const authResult = await requireAuth()
  if (authResult) return authResult

  try {
    const { token } = params

    // WHY: Find invitation
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1)

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // WHY: Mark as declined
    await db
      .update(invitations)
      .set({ status: 'declined' })
      .where(eq(invitations.id, invitation.id))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Decline invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
