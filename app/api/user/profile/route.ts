import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { updateProfileSchema } from '@/lib/validation/auth'
import { eq } from 'drizzle-orm'

/**
 * GET /api/user/profile
 * Get current user's profile
 *
 * Response 200: { user: { id, email, username, createdAt, updatedAt } }
 * Response 401: Not authenticated
 * Response 404: User not found
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, parseInt(session.user.id)))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/profile
 * Update current user's profile
 *
 * Request body: { username?, email? }
 * Response 200: { user: { id, email, username, updatedAt } }
 * Response 400: Validation error
 * Response 401: Not authenticated
 * Response 409: Email/username already exists
 */
export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed' },
        { status: 400 }
      )
    }

    const [updatedUser] = await db
      .update(users)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(users.id, parseInt(session.user.id)))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        updatedAt: users.updatedAt
      })

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Email or username already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
