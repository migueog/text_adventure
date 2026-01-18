'use client'

import { useState, useEffect, type ReactNode } from 'react'

interface CollapsibleMenuProps {
  children: ReactNode
  defaultOpen?: boolean
}

const STORAGE_KEY = 'collapsible-menu-open'

/**
 * WHY: Collapsible sidebar menu that persists state to localStorage
 * Provides smooth CSS transitions and hamburger toggle button
 * Replaces fixed left sidebar with flexible collapsible menu
 */
export default function CollapsibleMenu({
  children,
  defaultOpen = true
}: CollapsibleMenuProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // WHY: Restore state from localStorage on mount
  useEffect(() => {
    restoreStateFromStorage(setIsOpen, defaultOpen)
  }, [defaultOpen])

  // WHY: Persist state to localStorage when changed
  const handleToggle = () => {
    setIsOpen((prev) => {
      const newState = !prev
      persistStateToStorage(newState)
      return newState
    })
  }

  const menuClass = isOpen ? 'open' : 'collapsed'
  const tooltip = isOpen ? 'Collapse Menu' : 'Expand Menu'

  return (
    <div className={`collapsible-menu ${menuClass}`}>
      {/* WHY: Hamburger toggle button visible in all states */}
      <button
        className="menu-toggle-button"
        onClick={handleToggle}
        aria-label="Toggle menu"
        title={tooltip}
      >
        ☰
      </button>

      {/* WHY: Menu content area with smooth transitions */}
      <div className="menu-content">
        {children}
      </div>
    </div>
  )
}

/**
 * WHY: Extract localStorage restore logic to keep main component under 20 lines
 * Handles missing localStorage gracefully (SSR compatibility)
 */
function restoreStateFromStorage(
  setIsOpen: (value: boolean) => void,
  defaultOpen: boolean
): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setIsOpen(stored === 'true')
    }
  } catch (error) {
    // WHY: localStorage not available (SSR or disabled), use default
    setIsOpen(defaultOpen)
  }
}

/**
 * WHY: Extract localStorage persist logic to keep main component clean
 * Handles localStorage errors gracefully
 */
function persistStateToStorage(isOpen: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(isOpen))
  } catch (error) {
    // WHY: localStorage not available or quota exceeded, silently fail
    console.warn('Failed to persist menu state:', error)
  }
}
