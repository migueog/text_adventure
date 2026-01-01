'use client'

import { useState } from 'react'
import type { Hex } from '@/types/campaign'

/**
 * Portal Configuration Modal (Issue #59 - Phase 4)
 * WHY: When player searches Tomb Ruin (TL11), they configure portal network
 * Selects 1 tomb hex and 1 surface hex as portal destinations
 */

interface PortalConfigModalProps {
  portalHexId: string
  hexes: Record<string, Hex>
  onConfirm: (tombDest: string, surfaceDest: string) => void
  onCancel: () => void
}

export default function PortalConfigModal({
  portalHexId,
  hexes,
  onConfirm,
  onCancel
}: PortalConfigModalProps) {
  const [tombDest, setTombDest] = useState('')
  const [surfaceDest, setSurfaceDest] = useState('')

  const tombHexes = Object.entries(hexes)
    .filter(([_, hex]) => hex.type === 'tomb' && hex.id !== portalHexId)
    .map(([id]) => id)

  const surfaceHexes = Object.entries(hexes)
    .filter(([_, hex]) => hex.type === 'surface')
    .map(([id]) => id)

  const canConfirm = tombDest && surfaceDest

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h3 style={{ marginTop: 0 }}>🔮 Configure Portal Network</h3>
        <p style={{ fontSize: '0.9em', color: '#666' }}>
          Select one tomb hex and one surface hex to link with this portal.
          Portal travel costs 1 SP.
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Tomb Destination:
          </label>
          <select
            value={tombDest}
            onChange={(e) => setTombDest(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          >
            <option value="">-- Select Tomb Hex --</option>
            {tombHexes.map(hexId => (
              <option key={hexId} value={hexId}>
                {hexId}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Surface Destination:
          </label>
          <select
            value={surfaceDest}
            onChange={(e) => setSurfaceDest(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          >
            <option value="">-- Select Surface Hex --</option>
            {surfaceHexes.map(hexId => (
              <option key={hexId} value={hexId}>
                {hexId}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(tombDest, surfaceDest)}
            disabled={!canConfirm}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              background: canConfirm ? '#007bff' : '#ccc',
              color: 'white',
              cursor: canConfirm ? 'pointer' : 'not-allowed'
            }}
          >
            Configure Portal
          </button>
        </div>
      </div>
    </div>
  )
}
