'use client'

import type { Hex } from '@/types/campaign'
import { hexId } from '@/lib/utils/hexUtils'

interface ScoutConfirmDialogProps {
  targetHex: Hex | null
  distance: number
  currentSP: number
  onConfirm: () => void
  onCancel: () => void
}

/**
 * WHY: Confirmation dialog for Scout action
 * Shows cost breakdown and warnings before executing scout
 */
export default function ScoutConfirmDialog({
  targetHex,
  distance,
  currentSP,
  onConfirm,
  onCancel
}: ScoutConfirmDialogProps) {
  if (!targetHex) return null

  const cost = distance
  const remainingSP = currentSP - cost
  const insufficient = currentSP < cost
  const lowSP = remainingSP > 0 && remainingSP < 2

  return (
    <div className="scout-confirm-overlay" onClick={onCancel}>
      <div className="scout-confirm-dialog" onClick={e => e.stopPropagation()}>
        <h3>Scout Action Preview</h3>

        <div className="scout-details">
          <div className="scout-detail-row">
            <span>Target Hex:</span>
            <strong>{hexId(targetHex.row, targetHex.col)}</strong>
          </div>

          <div className="scout-detail-row">
            <span>Distance:</span>
            <strong>{distance} hex{distance > 1 ? 'es' : ''}</strong>
          </div>

          <div className="scout-detail-row">
            <span>SP Cost:</span>
            <strong>{cost} SP</strong>
          </div>

          <div className="scout-detail-row">
            <span>Current SP:</span>
            <strong>{currentSP}</strong>
          </div>

          <div className="scout-detail-row">
            <span>Remaining SP:</span>
            <strong className={insufficient ? 'scout-error' : lowSP ? 'scout-warning' : ''}>
              {remainingSP}
            </strong>
          </div>
        </div>

        {insufficient && (
          <p className="scout-error">
            Insufficient SP! Need {cost} SP, have {currentSP} SP.
          </p>
        )}

        {lowSP && !insufficient && (
          <p className="scout-warning">
            Warning: You will have only {remainingSP} SP remaining.
          </p>
        )}

        <div className="scout-actions">
          <button className="scout-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="scout-btn confirm"
            onClick={onConfirm}
            disabled={insufficient}
          >
            Confirm Scout
          </button>
        </div>
      </div>
    </div>
  )
}
