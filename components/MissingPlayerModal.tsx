'use client'

/**
 * Missing Player Modal Component (Issue #41)
 *
 * WHY: Handles recording of automatic win/loss when an opponent
 * doesn't show up for their scheduled game. Applies sporting rules:
 * - Present player gets WIN (+1 CP)
 * - Absent player gets LOSS (+1 SP)
 */

import { useState, useCallback } from 'react'
import type { Player } from '@/types/campaign'

interface MissingPlayerModalProps {
  /** WHY: Controls modal visibility */
  isOpen: boolean
  /** WHY: Current player who will receive the win */
  currentPlayer: Pick<Player, 'id' | 'name' | 'color'>
  /** WHY: Other players who could be the missing opponent */
  otherPlayers: Array<Pick<Player, 'id' | 'name' | 'color'>>
  /** WHY: Called with absent player ID when confirmed */
  onConfirm: (absentPlayerId: number) => void
  /** WHY: Called when modal is cancelled */
  onCancel: () => void
}

/**
 * WHY: Modal for recording missing opponent with sporting rule application
 */
export default function MissingPlayerModal({
  isOpen,
  currentPlayer,
  otherPlayers,
  onConfirm,
  onCancel
}: MissingPlayerModalProps) {
  const [selectedOpponentId, setSelectedOpponentId] = useState<number | null>(null)

  // WHY: Find selected opponent for display
  const selectedOpponent = selectedOpponentId !== null
    ? otherPlayers.find(p => p.id === selectedOpponentId)
    : null

  const handleConfirm = useCallback(() => {
    if (selectedOpponentId !== null) {
      onConfirm(selectedOpponentId)
      setSelectedOpponentId(null) // Reset for next use
    }
  }, [selectedOpponentId, onConfirm])

  const handleCancel = useCallback(() => {
    setSelectedOpponentId(null)
    onCancel()
  }, [onCancel])

  const handleOpponentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedOpponentId(value ? parseInt(value, 10) : null)
  }, [])

  // WHY: Don't render anything when closed
  if (!isOpen) {
    return null
  }

  return (
    <div className="missing-player-modal-overlay">
      <div className="missing-player-modal">
        <h3>Record Missing Opponent</h3>

        <div className="modal-content">
          {/* WHY: Opponent selection */}
          <div className="form-group">
            <label htmlFor="absent-opponent">
              Select the opponent who couldn&apos;t attend:
            </label>
            <select
              id="absent-opponent"
              value={selectedOpponentId ?? ''}
              onChange={handleOpponentChange}
            >
              <option value="">-- Select Opponent --</option>
              {otherPlayers.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          {/* WHY: Explanation of what will happen */}
          <div className="reward-explanation">
            {selectedOpponent ? (
              <>
                <p className="reward-line present">
                  <strong>{currentPlayer.name}</strong> receives: <span className="reward">WIN (+1 CP)</span>
                </p>
                <p className="reward-line absent">
                  <strong>{selectedOpponent.name}</strong> receives: <span className="reward">LOSS (+1 SP)</span>
                </p>
              </>
            ) : (
              <p className="placeholder">
                Select an opponent to see the rewards that will be applied.
              </p>
            )}
          </div>

          {/* WHY: Sporting rule reminder */}
          <div className="sporting-rule-notice">
            <p>
              <strong>Sporting Rule:</strong> When an opponent misses a scheduled game,
              the present player receives a win and the absent player receives a loss
              with consolation supply points.
            </p>
          </div>
        </div>

        {/* WHY: Action buttons */}
        <div className="modal-actions">
          <button
            type="button"
            className="action-btn secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="action-btn primary"
            onClick={handleConfirm}
            disabled={selectedOpponentId === null}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
