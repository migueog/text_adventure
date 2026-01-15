'use client'

import { useState, useCallback, useMemo } from 'react'
import type { BattleConditionDisplayProps } from '@/types/battleCondition'
import {
  formatConditionExport,
  generatePrintableCondition,
  copyConditionToClipboard
} from '@/lib/utils/battleCondition'

/**
 * BattleConditionDisplay component for Issue #40
 * WHY: Displays the active condition during Battle Phase based on player positions
 *
 * Shows:
 * - Empty state before opponent is selected
 * - Condition banner with name, hex source, and reason
 * - Condition details and effects
 * - Killzone recommendation based on hex type
 * - Toggle to disable condition rules
 * - Copy button for tabletop reference
 */
export default function BattleConditionDisplay({
  activeCondition,
  killzoneRecommendation,
  conditionEnabled,
  onToggleCondition,
  round
}: BattleConditionDisplayProps) {
  const [copyFeedback, setCopyFeedback] = useState(false)

  /**
   * Format the reason string for display
   */
  const reasonText = useMemo(() => {
    if (!activeCondition) return ''

    switch (activeCondition.reason) {
      case 'same-hex':
        return 'Both players in same hex'
      case 'no-initiative':
        return activeCondition.conditionProviderName
          ? `${activeCondition.conditionProviderName}'s hex (without initiative)`
          : "Opponent's hex (without initiative)"
      case 'no-opponent':
        return 'No condition applies - BYE or external opponent'
      case 'disabled':
        return 'Condition rules disabled for this battle'
      default:
        return ''
    }
  }, [activeCondition])

  /**
   * Handle copy button click
   */
  const handleCopy = useCallback(async () => {
    if (!activeCondition || !activeCondition.condition) return

    try {
      const exportData = formatConditionExport(
        activeCondition,
        killzoneRecommendation,
        round
      )
      const text = generatePrintableCondition(exportData)
      await copyConditionToClipboard(text)

      // Show feedback
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    } catch (error) {
      console.error('Failed to copy condition:', error)
    }
  }, [activeCondition, killzoneRecommendation, round])

  /**
   * Handle toggle checkbox change
   */
  const handleToggle = useCallback(() => {
    onToggleCondition(!conditionEnabled)
  }, [conditionEnabled, onToggleCondition])

  // Empty state - no condition selected yet
  if (!activeCondition) {
    return (
      <div className="battle-condition-display empty-state">
        <p className="empty-message">
          Select an opponent to see battle condition
        </p>
      </div>
    )
  }

  // No opponent (BYE or external)
  if (activeCondition.reason === 'no-opponent') {
    return (
      <div className="battle-condition-display no-condition">
        <div className="no-condition-notice">
          <span className="no-condition-icon">ℹ️</span>
          <span>No condition applies to this battle</span>
        </div>
        <p className="no-condition-reason">{reasonText}</p>
      </div>
    )
  }

  // Disabled state
  if (!conditionEnabled) {
    return (
      <div className="battle-condition-display disabled-state">
        <div className="condition-disabled-notice">
          <span>Condition rules disabled for this battle</span>
        </div>
        <label className="condition-toggle">
          <input
            type="checkbox"
            checked={conditionEnabled}
            onChange={handleToggle}
            aria-label="Apply condition rules"
          />
          <span>Apply condition rules</span>
        </label>
      </div>
    )
  }

  const hexType = activeCondition.sourceHex?.type ?? 'surface'
  const hexId = activeCondition.sourceHex?.id ?? 'N/A'

  return (
    <div className="battle-condition-display">
      {/* Condition Banner */}
      <div
        className={`battle-condition-banner ${hexType}`}
        data-testid="condition-banner"
      >
        <div className="condition-header">
          <h3 className="condition-name">
            {activeCondition.condition?.name ?? 'Unknown Condition'}
          </h3>
          <span className="condition-source">
            Hex {hexId} ({hexType.charAt(0).toUpperCase() + hexType.slice(1)})
          </span>
        </div>
        <p className="condition-reason">{reasonText}</p>
      </div>

      {/* Condition Details */}
      {activeCondition.condition && (
        <div className="condition-details">
          <p className="condition-description">
            {activeCondition.condition.description}
          </p>
          {activeCondition.condition.effect !== 'none' && (
            <div className="condition-effect-info">
              <strong>Effect:</strong> {activeCondition.condition.effect}
              {activeCondition.condition.modifier !== undefined && (
                <span className="modifier">
                  {' '}({activeCondition.condition.modifier > 0 ? '+' : ''}
                  {activeCondition.condition.modifier})
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Killzone Recommendation */}
      {killzoneRecommendation && (
        <div className="killzone-recommendation">
          <h4 className="killzone-title">Killzone Recommendation</h4>
          <p className="killzone-name">{killzoneRecommendation.name}</p>
          <p className="killzone-examples">
            Examples: {killzoneRecommendation.examples.join(', ')}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="condition-actions">
        <label className="condition-toggle">
          <input
            type="checkbox"
            checked={conditionEnabled}
            onChange={handleToggle}
            aria-label="Apply condition rules"
          />
          <span>Apply condition rules</span>
        </label>

        <button
          type="button"
          className="condition-export-btn"
          onClick={handleCopy}
          disabled={!activeCondition.condition}
        >
          {copyFeedback ? '✓ Copied!' : '📋 Copy for Tabletop'}
        </button>
      </div>
    </div>
  )
}
