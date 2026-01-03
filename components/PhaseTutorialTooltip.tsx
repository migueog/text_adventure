'use client'

/**
 * WHY: Tutorial tooltip component for phase guidance (Issue #33 - Phase 2)
 * Displays dismissible help tooltips when user enters a phase for the first time
 */

import { useState, useEffect } from 'react'

interface PhaseTutorialTooltipProps {
  phase: 'Movement' | 'Battle' | 'Action' | 'Threat'
  content: string
  onDismiss: () => void
  show: boolean
}

/**
 * WHY: Tutorial tooltip that appears on first visit to each phase
 * Shows helpful tip, can be dismissed with "Got it!" button
 * Includes delay for better UX (not overwhelming)
 */
export default function PhaseTutorialTooltip({
  phase,
  content,
  onDismiss,
  show
}: PhaseTutorialTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  // WHY: Delay appearance slightly for better UX
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setIsVisible(true), 500)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
      return undefined
    }
  }, [show])

  if (!isVisible) return null

  return (
    <div
      className="tutorial-tooltip-overlay"
      role="dialog"
      aria-labelledby="tutorial-tooltip-title"
      aria-modal="false"
    >
      <div className="tutorial-tooltip">
        <div className="tutorial-tooltip-header">
          <span className="tutorial-icon">💡</span>
          <h4 id="tutorial-tooltip-title">{phase} Phase Guide</h4>
        </div>
        <div className="tutorial-tooltip-content">
          <p>{content}</p>
        </div>
        <div className="tutorial-tooltip-footer">
          <button
            onClick={onDismiss}
            className="action-btn primary"
            autoFocus
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}
