'use client'

/**
 * WHY: Confirmation dialog for REGROUP action (Issue #38)
 * Shows destination preview with distance and FREE indicator
 */

import type { HexPosition } from '@/types/campaign'
import { hexId } from '@/lib/utils/hexUtils'

interface RegroupConfirmDialogProps {
  destination: HexPosition | null
  distance: number
  onConfirm: () => void
  onCancel: () => void
}

export default function RegroupConfirmDialog({
  destination,
  distance,
  onConfirm,
  onCancel
}: RegroupConfirmDialogProps) {
  if (!destination) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content regroup-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Regroup to Base/Camp</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="regroup-preview">
            <div className="preview-item">
              <span className="preview-label">Destination:</span>
              <span className="preview-value">{hexId(destination.row, destination.col)}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Distance:</span>
              <span className="preview-value">{distance} hex{distance !== 1 ? 'es' : ''}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Cost:</span>
              <span className="preview-value free">FREE</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="action-btn secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="action-btn primary" onClick={onConfirm}>
            Regroup
          </button>
        </div>
      </div>
    </div>
  )
}
