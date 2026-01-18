'use client'

import { useState, useEffect } from 'react'

/**
 * WHY: Owner-only modal for editing campaign settings
 * Can edit name, max players, target threat level
 * Validates changes (can't reduce max players below current count)
 */

interface CampaignSettingsProps {
  campaignId: number
  currentName: string
  currentMaxPlayers: number
  currentTargetThreat: number
  currentPlayerCount: number
  campaignStatus: string
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export default function CampaignSettings({
  campaignId,
  currentName,
  currentMaxPlayers,
  currentTargetThreat,
  currentPlayerCount,
  campaignStatus,
  isOpen,
  onClose,
  onSaved
}: CampaignSettingsProps) {
  const [name, setName] = useState(currentName)
  const [maxPlayers, setMaxPlayers] = useState(currentMaxPlayers)
  const [targetThreat, setTargetThreat] = useState(currentTargetThreat)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // WHY: Reset form when props change
  useEffect(() => {
    setName(currentName)
    setMaxPlayers(currentMaxPlayers)
    setTargetThreat(currentTargetThreat)
    setError(null)
    setValidationError(null)
  }, [currentName, currentMaxPlayers, currentTargetThreat, isOpen])

  // WHY: Validate max players can't be less than current count
  useEffect(() => {
    if (maxPlayers < currentPlayerCount) {
      setValidationError(`Cannot reduce max players below current player count (${currentPlayerCount})`)
    } else {
      setValidationError(null)
    }
  }, [maxPlayers, currentPlayerCount])

  const handleSave = async () => {
    // Validate name
    if (!name.trim()) {
      setValidationError('Campaign name is required')
      return
    }
    if (name.length < 3) {
      setValidationError('Campaign name must be at least 3 characters')
      return
    }
    if (name.length > 100) {
      setValidationError('Campaign name cannot exceed 100 characters')
      return
    }

    // Validate max players
    if (maxPlayers < currentPlayerCount) {
      setValidationError(`Cannot reduce max players below current player count (${currentPlayerCount})`)
      return
    }

    setIsSaving(true)
    setError(null)
    setValidationError(null)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          settings: {
            playerCount: maxPlayers,
            targetThreatLevel: targetThreat
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update campaign settings')
      }

      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
      setIsSaving(false)
    }
  }

  const hasChanges =
    name !== currentName ||
    maxPlayers !== currentMaxPlayers ||
    targetThreat !== currentTargetThreat

  const canSave = hasChanges && !validationError && !isSaving

  // WHY: Only render modal when open
  if (!isOpen) return null

  // WHY: Active campaigns have restrictions on what can be changed
  const isActiveCampaign = campaignStatus === 'active'

  return (
    <>
      {/* Modal Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={onClose}
      >
        {/* Modal Content */}
        <div
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ marginTop: 0 }}>Campaign Settings</h2>

          {/* Campaign Name */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="campaign-name"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--text-primary)',
                fontWeight: 'bold'
              }}
            >
              Campaign Name
            </label>
            <input
              id="campaign-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              disabled={isSaving}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.375rem',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Maximum Players */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="max-players"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--text-primary)',
                fontWeight: 'bold'
              }}
            >
              Maximum Players (2-20)
            </label>
            {isActiveCampaign ? (
              <div style={{
                padding: '0.75rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.375rem',
                color: 'var(--text-secondary)'
              }}>
                {maxPlayers} (cannot be changed for active campaigns)
              </div>
            ) : (
              <select
                id="max-players"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  color: 'var(--text-primary)',
                  fontSize: '1rem'
                }}
              >
                {Array.from({ length: 19 }, (_, i) => i + 2).map(num => (
                  <option key={num} value={num} disabled={num < currentPlayerCount}>
                    {num} Players{num < currentPlayerCount ? ' (below current count)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Target Threat Level */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--text-primary)',
                fontWeight: 'bold'
              }}
            >
              Target Threat Level (5-10)
            </label>
            {isActiveCampaign ? (
              <div style={{
                padding: '0.75rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.375rem',
                color: 'var(--text-secondary)'
              }}>
                {targetThreat} (cannot be changed for active campaigns)
              </div>
            ) : (
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                {[5, 6, 7, 8, 9, 10].map(level => (
                  <button
                    key={level}
                    onClick={() => setTargetThreat(level)}
                    disabled={isSaving}
                    style={{
                      padding: '0.5rem 1rem',
                      background: targetThreat === level ? 'var(--accent-blue, #3b82f6)' : 'var(--bg-secondary)',
                      color: targetThreat === level ? 'white' : 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.375rem',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Validation Error */}
          {validationError && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.375rem',
              color: 'var(--accent-red, #ef4444)',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {validationError}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.375rem',
              color: 'var(--accent-red, #ef4444)',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            marginTop: '2rem'
          }}>
            <button
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.375rem',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              style={{
                padding: '0.75rem 1.5rem',
                background: canSave ? 'var(--accent-blue, #3b82f6)' : 'var(--bg-secondary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: canSave ? 'pointer' : 'not-allowed',
                fontSize: '1rem',
                opacity: canSave ? 1 : 0.6
              }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
