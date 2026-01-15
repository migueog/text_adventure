'use client'

/**
 * WHY: Issue #57 - Legacy campaign setup component
 * Allows player to select new base hex on restored legacy map
 */

import { useState } from 'react'
import type { CampaignSnapshot } from '@/types/legacyCampaign'
import type { HexPosition } from '@/types/campaign'

interface LegacyCampaignSetupProps {
  snapshot: CampaignSnapshot
  onConfirm: (newBaseHex: HexPosition) => void
  onCancel: () => void
}

export default function LegacyCampaignSetup({
  snapshot,
  onConfirm,
  onCancel
}: LegacyCampaignSetupProps) {
  const [selectedHex, setSelectedHex] = useState<HexPosition | null>(null)
  const [validationError, setValidationError] = useState('')

  /**
   * WHY: Find old base hex (first explored hex that's not a camp)
   * This was the player's original base location
   */
  const oldBaseHex = snapshot.exploredHexes.find(hex => !hex.camped)

  /**
   * WHY: Handle hex selection with validation
   */
  const handleHexClick = (row: number, col: number) => {
    // WHY: Cannot select the old base hex
    if (oldBaseHex && oldBaseHex.row === row && oldBaseHex.col === col) {
      setValidationError('Cannot select the old base - it will become an Abandoned Camp')
      setSelectedHex(null)
      return
    }

    // WHY: Can only select surface hexes (first half of rows)
    const isSurface = row < snapshot.mapSize.rows / 2
    if (!isSurface) {
      setValidationError('Can only place base on surface hexes')
      setSelectedHex(null)
      return
    }

    setValidationError('')
    setSelectedHex({ row, col })
  }

  /**
   * WHY: Confirm selection and proceed to campaign creation
   */
  const handleConfirm = () => {
    if (selectedHex) {
      onConfirm(selectedHex)
    }
  }

  /**
   * WHY: Check if hex is explored in legacy campaign
   */
  const isExplored = (row: number, col: number): boolean => {
    return snapshot.exploredHexes.some(
      hex => hex.row === row && hex.col === col
    )
  }

  /**
   * WHY: Check if hex is the old base
   */
  const isOldBase = (row: number, col: number): boolean => {
    return oldBaseHex?.row === row && oldBaseHex?.col === col
  }

  return (
    <div className="legacy-campaign-setup">
      <div className="setup-header">
        <h2>Continue Expedition: {snapshot.campaignName}</h2>
        <p className="subtitle">Select your new base location</p>
      </div>

      <div className="setup-content">
        {/* Campaign Summary */}
        <div className="campaign-summary">
          <h3>Previous Campaign Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Kill Team:</span>
              <span className="value">{snapshot.killTeamName}</span>
            </div>
            {snapshot.faction && (
              <div className="summary-item">
                <span className="label">Faction:</span>
                <span className="value">{snapshot.faction}</span>
              </div>
            )}
            <div className="summary-item">
              <span className="label">Final CP:</span>
              <span className="value">{snapshot.finalCP} CP</span>
            </div>
            <div className="summary-item">
              <span className="label">Threat:</span>
              <span className="value">
                {snapshot.finalThreat} / {snapshot.targetThreatLevel}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Hexes Explored:</span>
              <span className="value">{snapshot.exploredHexes.length} explored</span>
            </div>
          </div>
        </div>

        {/* Hex Map Grid */}
        <div className="hex-map-container">
          <h3>Select New Base Location</h3>
          <div className="instructions">
            <p>Click any unexplored or explored surface hex to place your new base.</p>
            {oldBaseHex && (
              <p className="old-base-notice">
                ⚠️ Old base at Row {oldBaseHex.row}, Col {oldBaseHex.col} will become Abandoned Camp (SL25)
              </p>
            )}
          </div>

          <div className="hex-grid" style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${snapshot.mapSize.cols}, 1fr)`,
            gap: '0.5rem',
            maxWidth: '600px',
            margin: '1rem auto'
          }}>
            {Array.from({ length: snapshot.mapSize.rows }).map((_, row) =>
              Array.from({ length: snapshot.mapSize.cols }).map((_, col) => {
                const explored = isExplored(row, col)
                const oldBase = isOldBase(row, col)
                const selected = selectedHex?.row === row && selectedHex?.col === col
                const isSurface = row < snapshot.mapSize.rows / 2

                return (
                  <button
                    key={`${row},${col}`}
                    data-testid={`hex-${row},${col}`}
                    className={`hex-button ${explored ? 'explored' : ''} ${oldBase ? 'old-base' : ''} ${selected ? 'selected' : ''} ${!isSurface ? 'tomb' : ''}`}
                    onClick={() => handleHexClick(row, col)}
                    style={{
                      padding: '1rem',
                      border: '2px solid',
                      borderColor: oldBase ? '#ef4444' : explored ? '#3b82f6' : '#d1d5db',
                      backgroundColor: oldBase ? '#fee2e2' : selected ? '#dbeafe' : explored ? '#eff6ff' : 'white',
                      borderRadius: '4px',
                      cursor: oldBase ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {row},{col}
                    {oldBase && <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>Old Base</div>}
                    {explored && !oldBase && <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>Explored</div>}
                  </button>
                )
              })
            )}
          </div>

          {/* Selection Info */}
          {selectedHex && (
            <div className="selection-info">
              <p className="selected-hex">
                Selected: Row {selectedHex.row}, Col {selectedHex.col}
              </p>
            </div>
          )}

          {validationError && (
            <div className="validation-error">
              <p>{validationError}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={!selectedHex}
          >
            Confirm New Base
          </button>
        </div>
      </div>
    </div>
  )
}
