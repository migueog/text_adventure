'use client'

import { useState } from 'react'

/**
 * WHY: Lobby shown when campaign status is 'setup'
 * Players can see who's joined, owner can start the campaign
 */

interface Campaign {
  id: number
  name: string
  settings: {
    playerCount: number
    targetThreatLevel: number
    soloMode?: boolean
  }
}

interface Player {
  id: number
  userId: number
  playerName: string
  joinedAt: string
}

interface CampaignLobbyProps {
  campaign: Campaign
  players: Player[]
  isOwner: boolean
  onStartCampaign: () => Promise<void>
  onLeaveCampaign: () => Promise<void>
  onBackToDashboard: () => void
}

export default function CampaignLobby({
  campaign,
  players,
  isOwner,
  onStartCampaign,
  onLeaveCampaign,
  onBackToDashboard
}: CampaignLobbyProps) {
  const [isStarting, setIsStarting] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  const maxPlayers = campaign.settings.playerCount
  const currentPlayers = players.length
  const canStart = currentPlayers >= 1 && isOwner

  // WHY: Generate shareable campaign link
  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?campaign=${campaign.id}`
    : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleStart = async () => {
    setIsStarting(true)
    setError(null)
    try {
      await onStartCampaign()
    } catch (err: any) {
      setError(err.message || 'Failed to start campaign')
      setIsStarting(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this campaign?')) {
      return
    }

    setIsLeaving(true)
    setError(null)
    try {
      await onLeaveCampaign()
    } catch (err: any) {
      setError(err.message || 'Failed to leave campaign')
      setIsLeaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '2rem'
        }}>
          <button
            onClick={onBackToDashboard}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-blue)',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            ← Back to Dashboard
          </button>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>{campaign.name}</h1>
          <p style={{
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Campaign Lobby - Waiting for players to join
          </p>
        </div>

        {/* Campaign Info */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginTop: 0 }}>Campaign Settings</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Maximum Players
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {maxPlayers}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Target Threat Level
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {campaign.settings.targetThreatLevel}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Game Mode
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {campaign.settings.soloMode ? 'Solo/Co-op' : 'Competitive'}
              </div>
            </div>
          </div>
        </div>

        {/* Invite Link (Owner Only) */}
        {isOwner && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h2 style={{ marginTop: 0 }}>Invite Players</h2>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              Share this link with your players to invite them to the campaign:
            </p>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center'
            }}>
              <input
                type="text"
                readOnly
                value={inviteLink}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: copySuccess ? 'var(--accent-green, #10b981)' : 'var(--accent-blue, #3b82f6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s'
                }}
              >
                {copySuccess ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        )}

        {/* Players List */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginTop: 0 }}>
            Players ({currentPlayers}/{maxPlayers})
          </h2>
          {players.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              No players have joined yet...
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {players.map(player => (
                <div
                  key={player.id}
                  style={{
                    padding: '1rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{player.playerName}</div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)'
                    }}>
                      Joined {new Date(player.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem',
            color: 'var(--accent-red, #ef4444)'
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          {!isOwner && (
            <button
              onClick={handleLeave}
              disabled={isLeaving}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: 'var(--accent-red, #ef4444)',
                border: '1px solid var(--accent-red, #ef4444)',
                borderRadius: '0.5rem',
                cursor: isLeaving ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                opacity: isLeaving ? 0.6 : 1
              }}
            >
              {isLeaving ? 'Leaving...' : 'Leave Campaign'}
            </button>
          )}

          {isOwner && (
            <button
              onClick={handleStart}
              disabled={!canStart || isStarting}
              style={{
                padding: '0.75rem 1.5rem',
                background: canStart && !isStarting ? 'var(--accent-blue, #3b82f6)' : 'var(--bg-secondary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: canStart && !isStarting ? 'pointer' : 'not-allowed',
                fontSize: '1rem',
                opacity: canStart && !isStarting ? 1 : 0.6
              }}
            >
              {isStarting ? 'Starting Campaign...' : 'Start Campaign'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
