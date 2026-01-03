'use client'

/**
 * WHY: Modal for choosing between multiple equidistant REGROUP destinations (Issue #38)
 * Appears when player has multiple bases/camps at the same distance
 */

import { useState } from 'react'
import type { HexPosition } from '@/types/campaign'
import { hexId } from '@/lib/utils/hexUtils'

interface RegroupDestinationModalProps {
  isOpen: boolean
  destinations: HexPosition[]
  distance: number
  onConfirm: (destination: HexPosition) => void
  onCancel: () => void
}

export default function RegroupDestinationModal({
  isOpen,
  destinations,
  distance,
  onConfirm,
  onCancel
}: RegroupDestinationModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  if (!isOpen) return null

  // WHY: Handler for confirming selected destination
  const handleConfirm = () => {
    const selected = destinations[selectedIndex]
    if (selected) {
      onConfirm(selected)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content regroup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Choose Regroup Destination</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Multiple bases/camps are {distance} hex{distance !== 1 ? 'es' : ''} away.
            Choose your destination:
          </p>

          <div className="destination-options">
            {destinations.map((dest, index) => (
              <button
                key={hexId(dest.row, dest.col)}
                className={`destination-option ${selectedIndex === index ? 'selected' : ''}`}
                onClick={() => setSelectedIndex(index)}
              >
                <span className="destination-hex">{hexId(dest.row, dest.col)}</span>
                <span className="destination-distance">{distance} hexes</span>
                <span className="free-badge">FREE</span>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="action-btn secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="action-btn primary" onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
