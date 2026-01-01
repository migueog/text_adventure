'use client'

import { useState } from 'react'
import type { Hex } from '@/types/campaign'

/**
 * Hex Block Selector Component (Issue #59 - Phase 4)
 * WHY: Transtechnic Fulcrum (TL25) can block any tomb hex
 * Selecting new hex unblocks previous selection (one at a time)
 */

interface HexBlockSelectorProps {
  fulcrumHexId: string
  hexes: Record<string, Hex>
  currentlyBlockedHex?: string  // Currently blocked hex by this fulcrum
  onBlock: (targetHexId: string) => void
  onCancel: () => void
}

export default function HexBlockSelector({
  fulcrumHexId,
  hexes,
  currentlyBlockedHex,
  onBlock,
  onCancel
}: HexBlockSelectorProps) {
  const [selectedHex, setSelectedHex] = useState(currentlyBlockedHex || '')

  const tombHexes = Object.entries(hexes)
    .filter(([_, hex]) => hex.type === 'tomb' && hex.id !== fulcrumHexId)
    .map(([id]) => id)

  const canConfirm = selectedHex && selectedHex !== currentlyBlockedHex

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
        <h3 style={{ marginTop: 0 }}>⚡ Transtechnic Fulcrum</h3>
        <p style={{ fontSize: '0.9em', color: '#666' }}>
          Select a tomb hex to block. Blocked hexes cannot be entered by any player.
        </p>

        {currentlyBlockedHex && (
          <div style={{
            padding: '0.75rem',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.9em'
          }}>
            <strong>Currently Blocking:</strong> {currentlyBlockedHex}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Target Tomb Hex:
          </label>
          <select
            value={selectedHex}
            onChange={(e) => setSelectedHex(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          >
            <option value="">-- Select Tomb Hex to Block --</option>
            {tombHexes.map(hexId => (
              <option key={hexId} value={hexId}>
                {hexId} {hexes[hexId]?.type === 'blocked' ? '(Currently Blocked)' : ''}
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
            onClick={() => onBlock(selectedHex)}
            disabled={!canConfirm}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              background: canConfirm ? '#dc3545' : '#ccc',
              color: 'white',
              cursor: canConfirm ? 'pointer' : 'not-allowed'
            }}
          >
            {currentlyBlockedHex ? 'Switch Block Target' : 'Block Hex'}
          </button>
        </div>
      </div>
    </div>
  )
}
