import { auth } from './auth'
import { NextResponse } from 'next/server'

/**
 * Middleware to protect routes requiring authentication
 * Redirects to /auth/signin if user is not authenticated
 *
 * Usage in app router:
 * ```typescript
 * import { requireAuth } from '@/lib/auth/middleware'
 *
 * export default async function ProtectedPage() {
 *   await requireAuth()
 *   // Page content
 * }
 * ```
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.redirect(
      new URL('/auth/signin', process.env.NEXTAUTH_URL)
    )
  }

  return null
}

/**
 * Get current session user
 * Returns user object or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth()
  return session?.user || null
}
