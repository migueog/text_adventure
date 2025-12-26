import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/permissions/middleware'
import { db } from '@/lib/db/client'
import { invitations, campaignPlayers } from '@/lib/db/schema'
import { isTokenExpired } from '@/lib/utils/invitation'
import { eq } from 'drizzle-orm'

/**
 * POST /api/invitations/[token]/accept
 * Accept campaign invitation
 *
 * WHY: Allows invited user to join campaign
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  // WHY: User must be authenticated to accept invitation
  const authResult = await requireAuth()
  if (authResult) return authResult

  try {
    const { token } = params

    // WHY: Find invitation by token
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

    // WHY: Check invitation status
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation already processed' },
        { status: 400 }
      )
    }

    // WHY: Check expiration
    if (isTokenExpired(invitation.expiresAt)) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    const session = await import('@/lib/auth/auth').then(m => m.auth())
    const userId = parseInt(session!.user!.id)

    // WHY: Verify email matches
    if (invitation.email !== session!.user!.email) {
      return NextResponse.json(
        { error: 'Invitation was sent to a different email' },
        { status: 403 }
      )
    }

    // WHY: Add user as campaign player
    await db.insert(campaignPlayers).values({
      campaignId: invitation.campaignId,
      userId,
      playerName: session!.user!.name || 'Player',
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

    // WHY: Mark invitation as accepted
    await db
      .update(invitations)
      .set({ status: 'accepted' })
      .where(eq(invitations.id, invitation.id))

    return NextResponse.json({
      success: true,
      campaignId: invitation.campaignId
    })
  } catch (error: any) {
    console.error('Accept invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
