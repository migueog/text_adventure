'use client'

import { useEffect, useRef } from 'react'

interface ExplorationResultModalProps {
  result: {
    hexId: string
    hexNumber: number
    location: { name: string; description: string; effect: string }
    condition: { name: string; description: string; effect: string }
    locationRoll: number
    conditionRoll: number
    playerName: string
  }
  onClose: () => void
}

/**
 * Exploration Result Modal - Display location and condition discovered when exploring a hex
 * WHY: Provides immediate visual feedback and allows player to review exploration results
 */
export default function ExplorationResultModal({
  result,
  onClose
}: ExplorationResultModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const continueButtonRef = useRef<HTMLButtonElement>(null)

  /**
   * Focus trap and keyboard handling
   * WHY: Keeps focus within modal for accessibility
   */
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    /**
     * Handle Tab key for focus trapping
     * WHY: Prevents focus from leaving the modal
     */
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

    /**
     * Handle Escape key to close modal
     * WHY: Standard keyboard interaction for modal dismissal
     */
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    dialog.addEventListener('keydown', handleTab)
    dialog.addEventListener('keydown', handleEscape)

    // Auto-focus Continue button when modal opens
    continueButtonRef.current?.focus()

    return () => {
      dialog.removeEventListener('keydown', handleTab)
      dialog.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div className="exploration-modal-overlay">
      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby="exploration-modal-title"
        aria-modal="true"
        className="exploration-modal"
      >
        <div className="exploration-modal-header">
          <h2 id="exploration-modal-title" className="exploration-modal-title">
            🗺️ Hex Explored!
          </h2>
          <p className="exploration-modal-subtitle">
            Hex #{result.hexNumber}
          </p>
          <p className="exploration-modal-player">
            {result.playerName} discovered:
          </p>
        </div>

        <div className="exploration-modal-body">
          {/* Location Section */}
          <div className="exploration-section location">
            <h3 className="exploration-section-title">
              📍 Location
            </h3>
            <h4 className="exploration-section-name">
              {result.location.name}
            </h4>
            <p className="exploration-section-description">
              {result.location.description}
            </p>
            {result.location.effect && (
              <div className="effect-badge">
                {result.location.effect}
              </div>
            )}
            <p className="exploration-roll-result">
              Location Roll: {result.locationRoll}
            </p>
          </div>

          {/* Condition Section */}
          <div className="exploration-section condition">
            <h3 className="exploration-section-title">
              🌤️ Condition
            </h3>
            <h4 className="exploration-section-name">
              {result.condition.name}
            </h4>
            <p className="exploration-section-description">
              {result.condition.description}
            </p>
            {result.condition.effect && (
              <div className="effect-badge">
                {result.condition.effect}
              </div>
            )}
            <p className="exploration-roll-result">
              Condition Roll: {result.conditionRoll}
            </p>
          </div>
        </div>

        <div className="exploration-modal-footer">
          <button
            ref={continueButtonRef}
            type="button"
            onClick={onClose}
            className="btn btn-primary"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
