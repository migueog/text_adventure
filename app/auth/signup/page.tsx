'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'

/**
 * Sign Up Page
 * WHY: Allows new users to create accounts
 *
 * Features:
 * - Email/username/password registration
 * - Password confirmation validation
 * - Form validation with error display
 * - Loading states during API calls
 * - Link to signin for existing users
 * - Auto-redirect to home on successful registration
 */
export default function SignUpPage() {
  const router = useRouter()
  const { register, isAuthenticated, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // WHY: Redirect after showing success message
  useEffect(() => {
    if (isAuthenticated && successMessage) {
      // WHY: Give user 1.5 seconds to see success message before redirect
      const timer = setTimeout(() => {
        // WHY: Use replace() instead of push() to prevent flash during navigation
        router.replace('/')
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, successMessage, router])

  // WHY: Clear errors when user starts typing
  useEffect(() => {
    setValidationError('')
    clearError()
  }, [email, username, password, confirmPassword, clearError])

  /**
   * Validate form inputs before submission
   * WHY: Provide immediate feedback to users
   */
  const validateForm = (): boolean => {
    if (!email.trim()) {
      setValidationError('Email is required')
      return false
    }

    if (!email.includes('@')) {
      setValidationError('Please enter a valid email')
      return false
    }

    if (!username.trim()) {
      setValidationError('Username is required')
      return false
    }

    if (username.length < 3) {
      setValidationError('Username must be at least 3 characters')
      return false
    }

    if (username.length > 20) {
      setValidationError('Username cannot exceed 20 characters')
      return false
    }

    if (!password) {
      setValidationError('Password is required')
      return false
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters')
      return false
    }

    // WHY: Match server-side validation for password strength
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      setValidationError('Password must contain uppercase, lowercase, and a number')
      return false
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match')
      return false
    }

    return true
  }

  /**
   * Handle form submission
   * WHY: Call auth store register method with validated credentials
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      await register(email, username, password)
      // WHY: Show success message before redirect
      setSuccessMessage(`Welcome, ${username}! Redirecting to dashboard...`)
    } catch (err) {
      // Error already set in auth store
    }
  }

  const displayError = validationError || error

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Ctesiphus Expedition</h1>
          <h2>Create Account</h2>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username (3-20 characters)"
              disabled={isLoading}
              autoComplete="username"
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ chars with uppercase, lowercase, number"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          {displayError && (
            <div className="auth-error">
              {displayError}
            </div>
          )}

          {successMessage && (
            <div className="auth-success">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading || !!successMessage}
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link href="/auth/signin">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: var(--bg-primary);
        }

        .auth-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 2rem;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-header h1 {
          font-size: 1.75rem;
          color: var(--accent-yellow);
          margin-bottom: 0.5rem;
        }

        .auth-header h2 {
          font-size: 1.25rem;
          color: var(--text-secondary);
          font-weight: normal;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .form-group input {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 0.75rem;
          color: var(--text-primary);
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--accent-blue);
        }

        .form-group input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-group input::placeholder {
          color: var(--text-muted);
        }

        .auth-error {
          background: rgba(231, 76, 60, 0.1);
          border: 1px solid var(--accent-red);
          border-radius: 4px;
          padding: 0.75rem;
          color: var(--accent-red);
          font-size: 0.875rem;
        }

        .auth-success {
          background: rgba(46, 204, 113, 0.1);
          border: 1px solid var(--accent-green);
          border-radius: 4px;
          padding: 0.75rem;
          color: var(--accent-green);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .auth-button {
          background: var(--accent-green);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.875rem;
          font-size: 1rem;
          font-weight: 500;
          transition: background 0.2s;
        }

        .auth-button:hover:not(:disabled) {
          background: #27ae60;
        }

        .auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .auth-footer p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .auth-footer a {
          color: var(--accent-blue);
          text-decoration: none;
          font-weight: 500;
        }

        .auth-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .auth-card {
            padding: 1.5rem;
          }

          .auth-header h1 {
            font-size: 1.5rem;
          }

          .auth-header h2 {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  )
}
