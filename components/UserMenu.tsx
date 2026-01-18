'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

/**
 * User Menu Component
 * WHY: Displays current user info and provides logout functionality
 *
 * Features:
 * - Shows username
 * - Dropdown menu with logout option
 * - Click outside to close dropdown
 * - Future: Profile and settings links
 */
export default function UserMenu() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  /**
   * Close dropdown when clicking outside
   * WHY: Standard dropdown UX pattern
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /**
   * Handle logout action
   * WHY: Logs user out and redirects to signin page
   *
   * Implementation: Immediate logout without confirmation
   * - Campaign state auto-saves via Zustand, so data is safe
   * - Fast logout provides better UX for this game context
   * - User can always sign back in to resume
   */
  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
    router.push('/auth/signin')
  }

  if (!user) {
    return null
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        <div className="user-avatar">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <span className="user-name">{user.username}</span>
        <svg
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="menu-section">
            <div className="menu-item-header">
              <p className="menu-user-email">{user.email}</p>
            </div>
          </div>

          <div className="menu-divider"></div>

          <div className="menu-section">
            {/* Future: Profile link */}
            {/* <button className="menu-item" disabled>
              <span>Profile</span>
              <span className="menu-badge">Coming Soon</span>
            </button> */}

            {/* Future: Settings link */}
            {/* <button className="menu-item" disabled>
              <span>Settings</span>
              <span className="menu-badge">Coming Soon</span>
            </button> */}

            <button className="menu-item logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .user-menu {
          position: relative;
        }

        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .user-menu-trigger:hover {
          border-color: var(--accent-blue);
          background: var(--bg-tertiary);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent-blue);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .dropdown-arrow {
          transition: transform 0.2s;
          color: var(--text-secondary);
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .user-menu-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          min-width: 200px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 1000;
        }

        .menu-section {
          padding: 0.5rem;
        }

        .menu-item-header {
          padding: 0.75rem;
        }

        .menu-user-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          word-break: break-word;
        }

        .menu-divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.25rem 0;
        }

        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          background: none;
          border: none;
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
        }

        .menu-item:hover:not(:disabled) {
          background: var(--bg-tertiary);
        }

        .menu-item:disabled {
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .menu-item.logout {
          color: var(--accent-red);
        }

        .menu-item.logout:hover {
          background: rgba(231, 76, 60, 0.1);
        }

        .menu-badge {
          font-size: 0.625rem;
          padding: 0.125rem 0.5rem;
          background: var(--bg-tertiary);
          border-radius: 12px;
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .user-name {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
