import { create } from 'zustand'
import { signIn, signOut } from 'next-auth/react'
import type { AuthState } from '@/types/auth'

/**
 * Zustand auth store for global authentication state
 * Syncs with NextAuth session
 */
export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (!result?.ok) throw new Error('Invalid credentials')

      const response = await fetch('/api/user/profile')
      const { user } = await response.json()

      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
    }
  },

  logout: async () => {
    await signOut({ redirect: false })
    set({ user: null, isAuthenticated: false })
  },

  register: async (email: string, username: string, password: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error)
      }

      await signIn('credentials', { email, password, redirect: false })
      const profileRes = await fetch('/api/user/profile')
      const { user } = await profileRes.json()

      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const { user } = await response.json()
      set({ user, isLoading: false })
    } catch (error: any) {
      set({ isLoading: false, error: error.message })
    }
  },

  checkAuth: async () => {
    set({ isLoading: true })

    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const { user } = await response.json()
        set({ user, isAuthenticated: true, isLoading: false })
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  clearError: () => set({ error: null })
}))
