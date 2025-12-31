'use client'

import type { HexPosition, Hex } from '@/types/campaign'
import { hexId } from '@/lib/utils/hexUtils'

interface DemolishConfirmationModalProps {
  targetPlayerName: string
  campPosition: HexPosition
  hexInfo?: Hex
  cost: number
  onConfirm: () => void
  onCancel: () => void
}

/**
 * WHY: Confirmation modal for Demolish action to prevent accidental destructive actions
 * Shows target player, camp location, cost, and warning message
 * Issue #47, Phase 4
 */
export default function DemolishConfirmationModal({
  targetPlayerName,
  campPosition,
  hexInfo,
  cost,
  onConfirm,
  onCancel
}: DemolishConfirmationModalProps) {
  const campHexId = hexId(campPosition.row, campPosition.col)

  return (
    <div className="demolish-modal-overlay" onClick={onCancel}>
      <div className="demolish-modal" onClick={e => e.stopPropagation()}>
        <div className="demolish-modal-header">
          <h3>⚠️ Confirm Demolish Action</h3>
        </div>

        <div className="demolish-modal-body">
          <div className="demolish-warning">
            <strong>Warning:</strong> This action cannot be undone.
          </div>

          <div className="demolish-details">
            <div className="demolish-detail-row">
              <span className="demolish-label">Target Player:</span>
              <span className="demolish-value">{targetPlayerName}</span>
            </div>

            <div className="demolish-detail-row">
              <span className="demolish-label">Camp Location:</span>
              <span className="demolish-value">{campHexId}</span>
            </div>

            <div className="demolish-detail-row">
              <span className="demolish-label">Cost:</span>
              <span className="demolish-value">{cost} SP</span>
            </div>
          </div>

          <div className="demolish-confirmation-text">
            You are about to demolish <strong>{targetPlayerName}'s</strong> camp at <strong>{campHexId}</strong>.
          </div>
        </div>

        <div className="demolish-modal-actions">
          <button
            className="demolish-btn cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="demolish-btn confirm"
            onClick={onConfirm}
          >
            Confirm Demolish
          </button>
        </div>
      </div>
    </div>
  )
}
