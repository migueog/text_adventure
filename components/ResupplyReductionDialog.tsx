/**
 * WHY: Display resupply threat reduction option (Issue #54)
 *
 * Shows:
 * - Uses remaining (max 3 per campaign)
 * - Reduction amount (1 or D3 depending on location)
 * - Current threat level
 * - Threat reduction preview
 * - Accept / Decline buttons
 */

'use client'

import type { ResupplyReductionResult } from '@/types/campaign'

interface ResupplyReductionDialogProps {
  isOpen: boolean
  result: ResupplyReductionResult
  currentThreat: number
  onAccept: () => void
  onDecline: () => void
}

/**
 * WHY: Modal dialog for resupply threat reduction in solo mode
 *
 * Displays the optional threat reduction when resupplying.
 * Max 3 uses per campaign. Reduction amount depends on location:
 * - Base/Camp: D3 reduction
 * - Other: 1 reduction
 */
export default function ResupplyReductionDialog({
  isOpen,
  result,
  currentThreat,
  onAccept,
  onDecline
}: ResupplyReductionDialogProps) {
  if (!isOpen || !result.available) return null

  // WHY: Calculate new threat level (with minimum of 1)
  const reductionAmount = result.roll ?? (typeof result.reductionAmount === 'number' ? result.reductionAmount : 0)
  const newThreat = Math.max(1, currentThreat - reductionAmount)

  return (
    <div className="resupply-reduction-overlay">
      <div className="resupply-reduction-dialog">
        {/* Header */}
        <div className="resupply-reduction-header">
          <h2>Resupply: Threat Reduction Available</h2>
        </div>

        {/* Uses Remaining */}
        <div className="reduction-uses">
          <div className="uses-icon">🔋</div>
          <div className="uses-text">
            <span className="uses-label">Reductions Remaining:</span>
            <span className="uses-value">{result.usesRemaining}/3</span>
          </div>
        </div>

        {/* Reduction Details */}
        <div className="reduction-details">
          <div className="reduction-icon">
            {result.location === 'base' || result.location === 'camp' ? '🎲' : '📉'}
          </div>
          <div className="reduction-info">
            {result.reductionAmount === 'D3' ? (
              <>
                <p className="reduction-type">Random Reduction (D3)</p>
                <p className="reduction-location">
                  At {result.location === 'base' ? 'Base' : 'Camp'}
                </p>
                {result.roll && (
                  <p className="reduction-roll">Rolled: {result.roll}</p>
                )}
              </>
            ) : (
              <>
                <p className="reduction-type">Fixed Reduction (-1)</p>
                <p className="reduction-location">At {result.location}</p>
              </>
            )}
          </div>
        </div>

        {/* Threat Preview */}
        <div className="threat-reduction-preview">
          <div className="reduction-label">Threat Level Will Decrease:</div>
          <div className="threat-change">
            <span className="old-threat">{currentThreat}</span>
            <span className="arrow">→</span>
            <span className="new-threat">{newThreat}</span>
          </div>
          <div className="reduction-amount-display">
            -{reductionAmount} Threat
          </div>
        </div>

        {/* Warning if last use */}
        {result.usesRemaining === 1 && (
          <div className="last-use-warning">
            ⚠️ This is your last reduction use!
          </div>
        )}

        {/* Action Buttons */}
        <div className="reduction-actions">
          <button
            className="accept-reduction-btn"
            onClick={onAccept}
          >
            <span className="btn-icon">✓</span>
            Reduce Threat
          </button>

          <button
            className="decline-reduction-btn"
            onClick={onDecline}
          >
            <span className="btn-icon">✗</span>
            Skip Reduction
          </button>
        </div>

        {/* Help Text */}
        <div className="reduction-help">
          You can use threat reduction {result.usesRemaining} more time{result.usesRemaining !== 1 ? 's' : ''} this campaign
        </div>
      </div>
    </div>
  )
}
