'use client'

import { useState, useEffect } from 'react'
import UserMenu from './UserMenu'

/**
 * Campaign interface matching API response
 * WHY: Type-safe campaign data from /api/campaigns
 */
interface Campaign {
  id: number
  name: string
  ownerId: number
  status: 'setup' | 'active' | 'completed'
  settings: {
    playerCount: number
    targetThreatLevel: number
    soloMode: boolean
  }
  createdAt: string
  updatedAt: string
}

/**
 * API response format for campaigns endpoint
 */
interface CampaignsResponse {
  owned: Campaign[]
  joined: Campaign[]
}

/**
 * Available campaign with player count info
 */
interface AvailableCampaign extends Campaign {
  currentPlayers: number
  maxPlayers: number
}

interface CampaignListProps {
  onSelectCampaign: (campaignId: number) => void
  onCreateNew: () => void
}

/**
 * Campaign List Component
 * WHY: Dashboard view showing user's campaigns
 *
 * Features:
 * - Lists owned campaigns
 * - Lists joined campaigns
 * - Click to load/resume campaign
 * - Create new campaign button
 * - Loading states
 * - Error handling
 */
export default function CampaignList({ onSelectCampaign, onCreateNew }: CampaignListProps) {
  const [campaigns, setCampaigns] = useState<CampaignsResponse | null>(null)
  const [availableCampaigns, setAvailableCampaigns] = useState<AvailableCampaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [joiningId, setJoiningId] = useState<number | null>(null)

  /**
   * Fetch campaigns from API on mount
   * WHY: Load user's campaigns and available campaigns from database
   */
  useEffect(() => {
    fetchCampaigns()
    fetchAvailableCampaigns()
  }, [])

  /**
   * Fetch campaigns from /api/campaigns
   */
  const fetchCampaigns = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/campaigns')

      if (!response.ok) {
        throw new Error('Failed to load campaigns')
      }

      const data: CampaignsResponse = await response.json()
      setCampaigns(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Fetch available campaigns from /api/campaigns/available
   * WHY: Show campaigns user can join
   */
  const fetchAvailableCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns/available')

      if (!response.ok) {
        console.error('Failed to load available campaigns')
        return
      }

      const data = await response.json()
      setAvailableCampaigns(data.campaigns)
    } catch (err) {
      console.error('Available campaigns error:', err)
    }
  }

  /**
   * Join a campaign
   * WHY: Add user as player to selected campaign
   */
  const handleJoinCampaign = async (campaignId: number) => {
    setJoiningId(campaignId)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/join`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to join campaign')
      }

      // WHY: Refresh campaign lists after joining
      await fetchCampaigns()
      await fetchAvailableCampaigns()

      // WHY: Automatically load the campaign after joining
      onSelectCampaign(campaignId)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to join campaign')
    } finally {
      setJoiningId(null)
    }
  }

  /**
   * Format date for display
   * WHY: Show human-readable timestamps
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  /**
   * Get status badge color
   * WHY: Visual indication of campaign status
   */
  const getStatusColor = (status: Campaign['status']): string => {
    switch (status) {
      case 'setup':
        return 'var(--accent-yellow)'
      case 'active':
        return 'var(--accent-blue)'
      case 'completed':
        return 'var(--accent-green)'
      default:
        return 'var(--text-muted)'
    }
  }

  if (isLoading) {
    return (
      <div className="campaign-list-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading campaigns...</p>
        </div>

        <style jsx>{`
          .campaign-list-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: var(--bg-primary);
            color: var(--text-primary);
          }

          .loading-state {
            text-align: center;
          }

          .spinner {
            width: 48px;
            height: 48px;
            border: 3px solid var(--border-color);
            border-top: 3px solid var(--accent-blue);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className="campaign-list-container">
        <div className="error-state">
          <h2>Error Loading Campaigns</h2>
          <p>{error}</p>
          <button onClick={fetchCampaigns} className="retry-button">
            Try Again
          </button>
        </div>

        <style jsx>{`
          .campaign-list-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: var(--bg-primary);
            padding: 2rem;
          }

          .error-state {
            text-align: center;
            max-width: 400px;
          }

          .error-state h2 {
            color: var(--accent-red);
            margin-bottom: 1rem;
          }

          .error-state p {
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
          }

          .retry-button {
            background: var(--accent-blue);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s;
          }

          .retry-button:hover {
            background: #2980b9;
          }
        `}</style>
      </div>
    )
  }

  const hasOwnedCampaigns = campaigns && campaigns.owned.length > 0
  const hasJoinedCampaigns = campaigns && campaigns.joined.length > 0
  const hasAnyCampaigns = hasOwnedCampaigns || hasJoinedCampaigns
  const hasAvailableCampaigns = availableCampaigns.length > 0

  return (
    <div className="campaign-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <h1>Ctesiphus Expedition</h1>
          <p className="subtitle">Campaign Manager</p>
        </div>
        <UserMenu />
      </div>

      <div className="dashboard-content">
        <button onClick={onCreateNew} className="create-button">
          + Create New Campaign
        </button>

        {!hasAnyCampaigns && (
          <div className="empty-state">
            <p>No campaigns yet. Create your first campaign to begin your expedition!</p>
          </div>
        )}

        {hasOwnedCampaigns && (
          <div className="campaign-section">
            <h2>Your Campaigns</h2>
            <div className="campaign-grid">
              {campaigns!.owned.map((campaign) => (
                <div
                  key={campaign.id}
                  className="campaign-card"
                  onClick={() => onSelectCampaign(campaign.id)}
                >
                  <div className="campaign-header">
                    <h3>{campaign.name}</h3>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(campaign.status) }}
                    >
                      {campaign.status}
                    </span>
                  </div>
                  <div className="campaign-details">
                    <div className="detail-item">
                      <span className="detail-label">Players:</span>
                      <span className="detail-value">{campaign.settings.playerCount}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Target Threat:</span>
                      <span className="detail-value">{campaign.settings.targetThreatLevel}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Mode:</span>
                      <span className="detail-value">
                        {campaign.settings.soloMode ? 'Solo/Co-op' : 'Competitive'}
                      </span>
                    </div>
                  </div>
                  <div className="campaign-footer">
                    <span className="updated-date">
                      Updated {formatDate(campaign.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasJoinedCampaigns && (
          <div className="campaign-section">
            <h2>Joined Campaigns</h2>
            <div className="campaign-grid">
              {campaigns!.joined.map((campaign) => (
                <div
                  key={campaign.id}
                  className="campaign-card"
                  onClick={() => onSelectCampaign(campaign.id)}
                >
                  <div className="campaign-header">
                    <h3>{campaign.name}</h3>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(campaign.status) }}
                    >
                      {campaign.status}
                    </span>
                  </div>
                  <div className="campaign-details">
                    <div className="detail-item">
                      <span className="detail-label">Players:</span>
                      <span className="detail-value">{campaign.settings.playerCount}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Target Threat:</span>
                      <span className="detail-value">{campaign.settings.targetThreatLevel}</span>
                    </div>
                  </div>
                  <div className="campaign-footer">
                    <span className="updated-date">
                      Updated {formatDate(campaign.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasAvailableCampaigns && (
          <div className="campaign-section">
            <h2>Available Campaigns to Join</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Browse campaigns created by other players that are waiting for players to join
            </p>
            <div className="campaign-grid">
              {availableCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="campaign-card available-campaign"
                >
                  <div className="campaign-header">
                    <h3>{campaign.name}</h3>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(campaign.status) }}
                    >
                      {campaign.status}
                    </span>
                  </div>
                  <div className="campaign-details">
                    <div className="detail-item">
                      <span className="detail-label">Players:</span>
                      <span className="detail-value">
                        {campaign.currentPlayers} / {campaign.maxPlayers}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Target Threat:</span>
                      <span className="detail-value">{campaign.settings.targetThreatLevel}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Mode:</span>
                      <span className="detail-value">
                        {campaign.settings.soloMode ? 'Solo/Co-op' : 'Competitive'}
                      </span>
                    </div>
                  </div>
                  <div className="campaign-footer">
                    <button
                      onClick={() => handleJoinCampaign(campaign.id)}
                      disabled={joiningId === campaign.id}
                      className="join-button"
                    >
                      {joiningId === campaign.id ? 'Joining...' : 'Join Campaign'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .campaign-dashboard {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
          padding: 2rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-title {
          text-align: center;
          flex: 1;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          color: var(--accent-yellow);
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: var(--text-secondary);
          font-size: 1.125rem;
        }

        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .create-button {
          background: var(--accent-green);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 1rem 2rem;
          font-size: 1.125rem;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 2rem;
          transition: background 0.2s;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }

        .create-button:hover {
          background: #27ae60;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-secondary);
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .campaign-section {
          margin-bottom: 3rem;
        }

        .campaign-section h2 {
          color: var(--text-primary);
          font-size: 1.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--border-color);
        }

        .campaign-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .campaign-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .campaign-card:hover {
          border-color: var(--accent-blue);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .campaign-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .campaign-header h3 {
          color: var(--text-primary);
          font-size: 1.25rem;
          margin: 0;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          color: white;
        }

        .campaign-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border-color);
        }

        .detail-label {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .detail-value {
          color: var(--text-primary);
          font-weight: 500;
        }

        .campaign-footer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .updated-date {
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .available-campaign {
          cursor: default;
        }

        .available-campaign:hover {
          transform: none;
          box-shadow: none;
          border-color: var(--border-color);
        }

        .join-button {
          width: 100%;
          padding: 0.75rem;
          background: var(--accent-green);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .join-button:hover:not(:disabled) {
          background: #27ae60;
        }

        .join-button:disabled {
          background: var(--bg-secondary);
          cursor: not-allowed;
          opacity: 0.6;
        }

        @media (max-width: 768px) {
          .campaign-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}
