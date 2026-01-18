'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { useAuthStore } from '@/lib/stores/auth'

/**
 * Auth Provider Component
 * Wraps app with NextAuth SessionProvider and handles route protection
 *
 * WHY: Centralizes authentication checks and redirects
 * - Public routes: /auth/signin, /auth/signup
 * - Protected routes: All others (redirects to /auth/signin if not authenticated)
 *
 * Usage in app/layout.tsx:
 * ```tsx
 * <AuthProvider>
 *   {children}
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { checkAuth, isLoading, isAuthenticated } = useAuthStore()

  // WHY: Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // WHY: Redirect to signin if not authenticated on protected routes
  useEffect(() => {
    // Don't redirect during initial load
    if (isLoading) return

    // Define public routes that don't require authentication
    const publicRoutes = ['/auth/signin', '/auth/signup']
    const isPublicRoute = publicRoutes.includes(pathname)

    // WHY: Redirect to signin if not authenticated and not on a public route
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/auth/signin')
    }

    // WHY: Redirect to home if authenticated and on auth page
    if (isAuthenticated && isPublicRoute) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, pathname, router])

  // WHY: Show loading spinner during initial auth check
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid var(--border-color)',
            borderTop: '3px solid var(--accent-blue)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
            Loading...
          </p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return <SessionProvider>{children}</SessionProvider>
}
