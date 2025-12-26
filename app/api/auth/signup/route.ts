import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { signupSchema } from '@/lib/validation/auth'
import { hashPassword } from '@/lib/auth/utils'

/**
 * POST /api/auth/signup
 * Register a new user account
 *
 * Request body: { email, username, password }
 * Response 201: { user: { id, email, username, createdAt } }
 * Response 400: Validation error
 * Response 409: Email or username already exists
 * Response 500: Server error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { email, username, password } = parsed.data
    const passwordHash = await hashPassword(password)

    const [newUser] = await db
      .insert(users)
      .values({ email, username, passwordHash })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        createdAt: users.createdAt
      })

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error: any) {
    if (error.code === '23505') {
      const field = error.constraint?.includes('email') ? 'email' : 'username'
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
