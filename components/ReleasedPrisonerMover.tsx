'use client'

import { useState, useCallback } from 'react'

/**
 * ReleasedPrisonerMover component for Issue #59
 * WHY: Allows controlling player to move Released Prisoner during Threat Phase
 *
 * Shows:
 * - Current prisoner location
 * - Valid movement destinations (up to D3 hexes)
 * - Hex selector for choosing destination
 * - Confirm button to execute movement
 */

interface ReleasedPrisonerMoverProps {
  prisonerId: string
  currentHexId: string
  controllingPlayerName: string
  movementDistance: number
  validDestinations: string[]
  onMovePrisoner: (destinationHexId: string) => void
}

export default function ReleasedPrisonerMover({
  prisonerId,
  currentHexId,
  controllingPlayerName,
  movementDistance,
  validDestinations,
  onMovePrisoner
}: ReleasedPrisonerMoverProps) {
  const [selectedHex, setSelectedHex] = useState<string | null>(null)

  const handleHexSelect = useCallback((hexId: string) => {
    setSelectedHex(hexId)
  }, [])

  const handleConfirm = useCallback(() => {
    if (selectedHex) {
      onMovePrisoner(selectedHex)
      setSelectedHex(null)
    }
  }, [selectedHex, onMovePrisoner])

  return (
    <div className="released-prisoner-mover">
      <div className="prisoner-mover-header">
        <span className="prisoner-icon">👤</span>
        <h4 className="prisoner-mover-title">Released Prisoner Movement</h4>
      </div>

      <div className="prisoner-mover-info">
        <p className="prisoner-controller">
          <strong>Controller:</strong> {controllingPlayerName}
        </p>
        <p className="prisoner-current-hex">
          <strong>Current Location:</strong> Hex {currentHexId}
        </p>
        <p className="prisoner-movement-range">
          <strong>Movement Range:</strong> Up to {movementDistance} hexes
        </p>
      </div>

      <div className="prisoner-destination-selector">
        <label htmlFor={`prisoner-${prisonerId}-destination`}>
          <strong>Select Destination:</strong>
        </label>
        <select
          id={`prisoner-${prisonerId}-destination`}
          value={selectedHex ?? ''}
          onChange={(e) => handleHexSelect(e.target.value)}
          className="prisoner-hex-select"
        >
          <option value="">-- Choose hex --</option>
          {validDestinations.map(hexId => (
            <option key={hexId} value={hexId}>
              Hex {hexId}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="prisoner-confirm-btn"
        onClick={handleConfirm}
        disabled={!selectedHex}
      >
        Confirm Movement
      </button>
    </div>
  )
}
