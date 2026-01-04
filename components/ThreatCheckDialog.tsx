/**
 * WHY: Display dice roll results for solo mode threat checks (Issue #54)
 *
 * Shows:
 * - Trigger name
 * - Dice roll with simple animation
 * - Roll vs threshold comparison
 * - Threat level change (before → after)
 * - Campaign end warning if threat → 10
 */

'use client'

import type { ThreatCheckResult } from '@/types/campaign'

interface ThreatCheckDialogProps {
  isOpen: boolean
  result: ThreatCheckResult
  currentThreat: number
  onConfirm: () => void
}

/**
 * WHY: Modal dialog for displaying threat check results in solo mode
 *
 * Displays the dice roll, threshold comparison, and resulting threat change.
 * Shows warning if threat level will reach 10 (campaign end).
 */
export default function ThreatCheckDialog({
  isOpen,
  result,
  currentThreat,
  onConfirm
}: ThreatCheckDialogProps) {
  if (!isOpen) return null

  const newThreat = currentThreat + result.increase

  return (
    <div className="threat-check-overlay" onClick={onConfirm}>
      <div
        className="threat-check-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="threat-check-header">
          <h2>Threat Check: {result.triggerName}</h2>
        </div>

        {/* Dice Roll */}
        <div className="threat-dice-roll">
          <div className="dice-icon">🎲</div>
          <div className="dice-result">
            <span className="roll-value">{result.roll}</span>
            {result.threshold !== undefined && (
              <span className="threshold-value">
                (need {result.threshold}+)
              </span>
            )}
          </div>
        </div>

        {/* Result */}
        <div className="threat-result">
          {result.success ? (
            <>
              <div className="result-success">✓ Threat Increases</div>
              <div className="threat-change">
                <span className="old-threat">{currentThreat}</span>
                <span className="arrow">→</span>
                <span className="new-threat">{newThreat}</span>
              </div>
              {newThreat >= 10 && (
                <div className="threat-warning-10">
                  ⚠️ Campaign End - Threat Level 10 Reached!
                </div>
              )}
            </>
          ) : (
            <div className="result-failure">✗ No Threat Increase</div>
          )}
        </div>

        {/* Description */}
        <div className="threat-description">
          {result.description}
        </div>

        {/* Confirm Button */}
        <button
          className="threat-confirm-btn"
          onClick={onConfirm}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
