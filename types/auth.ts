/**
 * User type for authentication
 */
export interface AuthUser {
  id: string
  email: string
  username: string
}

/**
 * Auth state interface
 */
export interface AuthState {
  // State
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  updateProfile: (data: { username?: string; email?: string }) => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}
