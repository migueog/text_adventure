'use client'

import { useAuthStore } from '@/lib/stores/auth'

/**
 * Hook for accessing authentication state and actions
 *
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth()
 * ```
 */
export function useAuth() {
  return useAuthStore()
}
