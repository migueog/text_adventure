'use client'

import { useEffect, useRef } from 'react'

interface CampaignEndModalProps {
  threatLevel: number
  targetThreatLevel: number
  currentRound: number
  onViewScores: () => void
  onContinue: () => void
}

/**
 * Campaign End Modal - Celebration screen when campaign reaches target threat
 * Why: Provides clear transition and player choice before victory screen
 */
export default function CampaignEndModal({
  threatLevel,
  targetThreatLevel,
  currentRound,
  onViewScores,
  onContinue
}: CampaignEndModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus trap: keep focus within modal
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    dialog.addEventListener('keydown', handleTab)
    firstElement?.focus()

    return () => dialog.removeEventListener('keydown', handleTab)
  }, [])

  return (
    <div className="modal-overlay">
      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby="campaign-end-title"
        aria-modal="true"
        className="campaign-end-modal"
      >
        <div className="modal-header">
          <h1 id="campaign-end-title" className="modal-title">
            🏆 Campaign Complete! 🏆
          </h1>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">
            The Ctesiphus Expedition has reached its climax
          </p>

          <div className="campaign-stats">
            <div className="stat-item">
              <span className="stat-label">Final Threat Level:</span>
              <span className="stat-value">{threatLevel} / {targetThreatLevel}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Rounds Completed:</span>
              <span className="stat-value">{currentRound}</span>
            </div>
          </div>

          <p className="modal-message">
            The Necron threat has fully awakened. What would you like to do?
          </p>
        </div>

        <div className="modal-actions">
          <button
            className="btn btn-primary"
            onClick={onViewScores}
            autoFocus
          >
            View Final Scores
          </button>
          <button
            className="btn btn-secondary"
            onClick={onContinue}
          >
            Continue Campaign
          </button>
        </div>
      </div>
    </div>
  )
}
