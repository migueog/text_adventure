'use client'

import type { HexPosition, Hex } from '@/types/campaign'
import { hexId } from '@/lib/utils/hexUtils'
import { SURFACE_LOCATIONS, TOMB_LOCATIONS } from '@/lib/data/campaignData'

interface CampSelectionModalProps {
  camps: HexPosition[]
  hexes: Record<string, Hex>
  onSelectCamp: (camp: HexPosition) => void
  onCancel: () => void
}

/**
 * WHY: Modal for selecting which camp to remove when at 2-camp limit
 * Shows camp locations with hex details for informed decision
 */
export default function CampSelectionModal({
  camps,
  hexes,
  onSelectCamp,
  onCancel
}: CampSelectionModalProps) {
  return (
    <div className="camp-selection-overlay" onClick={onCancel}>
      <div className="camp-selection-modal" onClick={e => e.stopPropagation()}>
        <h3>Select Camp to Remove</h3>
        <p className="camp-selection-hint">
          You have 2 camps (maximum). Choose one to remove before building a new camp.
        </p>

        <div className="camp-list">
          {camps.map((camp, idx) => {
            const campHexId = hexId(camp.row, camp.col)
            const campHex = hexes[campHexId]

            return (
              <button
                key={idx}
                className="camp-item"
                onClick={() => onSelectCamp(camp)}
              >
                <div className="camp-item-header">
                  <span className="camp-emoji">⛺</span>
                  <strong>Camp {idx + 1}</strong>
                </div>
                <div className="camp-item-details">
                  <div>Hex: {campHexId}</div>
                  {campHex?.location !== undefined && (
                    <div>Location: {
                      campHex.type === 'surface'
                        ? SURFACE_LOCATIONS[campHex.location]?.name
                        : TOMB_LOCATIONS[campHex.location]?.name
                    }</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="camp-selection-actions">
          <button className="camp-btn cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
