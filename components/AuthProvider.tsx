'use client'

import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { useAuthStore } from '@/lib/stores/auth'

/**
 * Auth Provider Component
 * Wraps app with NextAuth SessionProvider and initializes auth state
 *
 * Usage in app/layout.tsx:
 * ```tsx
 * <AuthProvider>
 *   {children}
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <SessionProvider>{children}</SessionProvider>
}
