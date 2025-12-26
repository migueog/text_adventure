import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

/**
 * NextAuth instance for authentication
 * Exports handlers, signIn, signOut, and auth functions
 */
export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
