'use client'

import { useEffect, useRef } from 'react'
import type { RoundStatistics, Player } from '@/types/campaign'

/**
 * WHY: Round Summary Modal component (Issue #31 - Phase 2)
 * Displays statistics at end of each round with option to disable
 * Follows ExplorationResultModal pattern for accessibility
 */

interface RoundSummaryModalProps {
  roundNumber: number
  statistics: RoundStatistics
  players: Player[]
  onContinue: () => void
  onDisable: () => void
}

export default function RoundSummaryModal({
  roundNumber,
  statistics,
  players,
  onContinue,
  onDisable
}: RoundSummaryModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const continueButtonRef = useRef<HTMLButtonElement>(null)

  /**
   * WHY: Focus trap and keyboard handling for accessibility
   * Keeps focus within modal and handles ESC key
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
     * WHY: Handle Tab key for focus trapping
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
     * WHY: Handle Escape key to close modal
     */
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onContinue()
      }
    }

    dialog.addEventListener('keydown', handleTab)
    dialog.addEventListener('keydown', handleEscape)

    // WHY: Auto-focus Continue button when modal opens
    continueButtonRef.current?.focus()

    return () => {
      dialog.removeEventListener('keydown', handleTab)
      dialog.removeEventListener('keydown', handleEscape)
    }
  }, [onContinue])

  /**
   * WHY: Get player by ID for displaying changes
   */
  const getPlayerName = (playerId: number): string => {
    const player = players.find(p => p.id === playerId)
    return player?.name || `Player ${playerId}`
  }

  return (
    <div className="exploration-modal-overlay">
      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby="round-summary-title"
        aria-modal="true"
        className="exploration-modal round-summary-modal"
      >
        <div className="exploration-modal-header">
          <h2 id="round-summary-title" className="exploration-modal-title">
            🏁 Round {roundNumber} Complete!
          </h2>
          <p className="exploration-modal-subtitle">
            Threat Level: {statistics.threatChange.from} → {statistics.threatChange.to}
          </p>
        </div>

        <div className="exploration-modal-body">
          {/* Exploration Stats */}
          <div className="exploration-section">
            <h3 className="exploration-section-title">
              🗺️ Exploration
            </h3>
            <p className="stat-line">
              <strong>{statistics.hexesExplored}</strong> hexes explored
            </p>
          </div>

          {/* Battle Stats */}
          {(statistics.battles.wins > 0 || statistics.battles.losses > 0 ||
            statistics.battles.draws > 0 || statistics.battles.byes > 0) && (
            <div className="exploration-section">
              <h3 className="exploration-section-title">
                ⚔️ Battles
              </h3>
              <div className="battle-stats">
                {statistics.battles.wins > 0 && (
                  <p className="stat-line">
                    <span className="stat-label">Wins:</span> {statistics.battles.wins}
                  </p>
                )}
                {statistics.battles.losses > 0 && (
                  <p className="stat-line">
                    <span className="stat-label">Losses:</span> {statistics.battles.losses}
                  </p>
                )}
                {statistics.battles.draws > 0 && (
                  <p className="stat-line">
                    <span className="stat-label">Draws:</span> {statistics.battles.draws}
                  </p>
                )}
                {statistics.battles.byes > 0 && (
                  <p className="stat-line">
                    <span className="stat-label">Byes:</span> {statistics.battles.byes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Player Changes */}
          {Object.keys(statistics.spChanges).length > 0 && (
            <div className="exploration-section">
              <h3 className="exploration-section-title">
                📊 Player Changes
              </h3>
              <div className="player-changes">
                {Object.entries(statistics.spChanges).map(([playerId, spChange]) => {
                  const cpChange = statistics.cpChanges[parseInt(playerId)] || 0
                  const playerName = getPlayerName(parseInt(playerId))

                  // WHY: Only show players with changes
                  if (spChange === 0 && cpChange === 0) return null

                  return (
                    <div key={playerId} className="player-change-row">
                      <span className="player-name">{playerName}:</span>
                      {spChange !== 0 && (
                        <span className={`change-badge ${spChange > 0 ? 'positive' : 'negative'}`}>
                          SP {spChange > 0 ? '+' : ''}{spChange}
                        </span>
                      )}
                      {cpChange !== 0 && (
                        <span className={`change-badge ${cpChange > 0 ? 'positive' : 'negative'}`}>
                          CP {cpChange > 0 ? '+' : ''}{cpChange}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Major Events */}
          {statistics.majorEvents.length > 0 && (
            <div className="exploration-section">
              <h3 className="exploration-section-title">
                ⭐ Major Events
              </h3>
              <div className="major-events-list">
                {statistics.majorEvents.slice(0, 5).map((event, idx) => (
                  <p key={idx} className="event-line">
                    {event.icon} {event.message}
                  </p>
                ))}
                {statistics.majorEvents.length > 5 && (
                  <p className="event-line more-events">
                    +{statistics.majorEvents.length - 5} more events
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="exploration-modal-footer">
          <button
            type="button"
            onClick={onDisable}
            className="btn btn-secondary"
          >
            Don&apos;t show again
          </button>
          <button
            ref={continueButtonRef}
            type="button"
            onClick={onContinue}
            className="btn btn-primary"
          >
            Continue to Round {roundNumber + 1}
          </button>
        </div>
      </div>
    </div>
  )
}
