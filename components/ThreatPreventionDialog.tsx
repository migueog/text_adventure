/**
 * WHY: Display search action threat check with SP prevention option (Issue #54)
 *
 * Shows:
 * - Search action dice roll result
 * - Threat increase preview
 * - Option to spend 1 SP to prevent increase
 * - Player's current SP balance
 * - Accept threat increase (if player chooses not to prevent)
 */

'use client'

import type { ThreatCheckResult } from '@/types/campaign'

interface ThreatPreventionDialogProps {
  isOpen: boolean
  result: ThreatCheckResult
  currentThreat: number
  playerSP: number
  onPrevent: (spCost: number) => void
  onAccept: () => void
}

/**
 * WHY: Modal dialog for search action threat prevention in solo mode
 *
 * Displays the dice roll result and offers player choice:
 * - Spend 1 SP to prevent threat increase
 * - Accept threat increase (save SP)
 */
export default function ThreatPreventionDialog({
  isOpen,
  result,
  currentThreat,
  playerSP,
  onPrevent,
  onAccept
}: ThreatPreventionDialogProps) {
  if (!isOpen) return null

  const newThreat = currentThreat + result.increase
  const preventionCost = 1
  const canAfford = playerSP >= preventionCost

  return (
    <div className="threat-prevention-overlay">
      <div className="threat-prevention-dialog">
        {/* Header */}
        <div className="threat-prevention-header">
          <h2>Threat Check: {result.triggerName}</h2>
        </div>

        {/* Dice Roll Result */}
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

        {/* Threat Increase Warning */}
        <div className="threat-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-text">Threat will increase!</div>
        </div>

        {/* Threat Preview */}
        <div className="threat-preview">
          <div className="threat-change">
            <span className="old-threat">{currentThreat}</span>
            <span className="arrow">→</span>
            <span className="new-threat">{newThreat}</span>
          </div>
        </div>

        {/* Player SP Display */}
        <div className="player-sp-display">
          <span className="sp-label">Your Supply Points:</span>
          <span className="sp-value">{playerSP}</span>
        </div>

        {/* Description */}
        <div className="threat-description">
          {result.description}
        </div>

        {/* Action Buttons */}
        <div className="prevention-actions">
          <button
            className="prevent-btn"
            onClick={() => onPrevent(preventionCost)}
            disabled={!canAfford}
            title={!canAfford ? 'Insufficient Supply Points' : ''}
          >
            {canAfford ? (
              <>
                <span className="btn-icon">🛡️</span>
                Prevent (Spend {preventionCost} SP)
              </>
            ) : (
              <>
                <span className="btn-icon">❌</span>
                Insufficient SP
              </>
            )}
          </button>

          <button
            className="accept-btn"
            onClick={onAccept}
          >
            <span className="btn-icon">✓</span>
            Accept Threat Increase
          </button>
        </div>

        {/* Help Text */}
        {canAfford && (
          <div className="prevention-help">
            Spending 1 SP will prevent this threat increase
          </div>
        )}
      </div>
    </div>
  )
}
