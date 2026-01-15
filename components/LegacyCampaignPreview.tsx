'use client'

/**
 * WHY: Issue #57 - Preview component for legacy campaign selection
 * Shows campaign details when selecting which legacy campaign to continue
 */

import type { LegacyCampaignHistory } from '@/types/legacyCampaign'

interface LegacyCampaignPreviewProps {
  campaignId: string
  history: LegacyCampaignHistory
}

export default function LegacyCampaignPreview({ campaignId, history }: LegacyCampaignPreviewProps) {
  const snapshot = history.snapshots.find(s => s.campaignId === campaignId)

  if (!snapshot) {
    return (
      <div className="legacy-campaign-preview empty">
        <p>Campaign not found</p>
      </div>
    )
  }

  return (
    <div className="legacy-campaign-preview">
      <div className="preview-header">
        <h4>{snapshot.campaignName}</h4>
        <span className={`preview-status ${snapshot.success ? 'victory' : 'defeat'}`}>
          {snapshot.success ? 'Victory' : 'Defeat'}
        </span>
      </div>

      <div className="preview-stats">
        <div className="stat-item">
          <span className="stat-label">Kill Team:</span>
          <span className="stat-value">{snapshot.killTeamName}</span>
        </div>

        {snapshot.faction && (
          <div className="stat-item">
            <span className="stat-label">Faction:</span>
            <span className="stat-value">{snapshot.faction}</span>
          </div>
        )}

        <div className="stat-item">
          <span className="stat-label">Final CP:</span>
          <span className="stat-value">{snapshot.finalCP}</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Threat Level:</span>
          <span className="stat-value">{snapshot.finalThreat} / {snapshot.targetThreatLevel}</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Rounds:</span>
          <span className="stat-value">{snapshot.rounds}</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Hexes Explored:</span>
          <span className="stat-value">{snapshot.exploredHexes.length}</span>
        </div>
      </div>

      {snapshot.backstory && (
        <div className="preview-backstory">
          <p className="backstory-label">Campaign Backstory:</p>
          <p className="backstory-text">{snapshot.backstory}</p>
        </div>
      )}

      <div className="preview-hint">
        <p>
          ⚠️ Your new campaign will continue from this map with {snapshot.exploredHexes.length} hexes already explored.
          The previous base will become an Abandoned Camp.
        </p>
      </div>
    </div>
  )
}
