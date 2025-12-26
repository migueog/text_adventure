import { handlers } from '@/lib/auth/auth'

/**
 * NextAuth API route handler
 * Handles all auth routes: /api/auth/signin, /api/auth/signout, etc.
 */
export const { GET, POST } = handlers
