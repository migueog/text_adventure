/**
 * WHY: Issue #56 - Solo Performance History Viewer
 *
 * Modal component to display campaign history, personal bests, and provide
 * export/clear functionality for solo performance tracking.
 */

'use client'

import { useState } from 'react'
import type { SoloPerformanceHistory, SoloPerformanceRecord } from '@/types/soloPerformance'
import { clearPerformanceHistory } from '@/lib/utils/performanceStorage'

interface PerformanceHistoryProps {
  history: SoloPerformanceHistory
  onClose: () => void
}

export default function PerformanceHistory({ history, onClose }: PerformanceHistoryProps) {
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const hasHistory = history.campaigns.length > 0

  /**
   * WHY: Check if a campaign holds any personal records
   * Used to display ⭐ indicator on record-holding campaigns
   */
  const isRecordHolder = (campaign: SoloPerformanceRecord): boolean => {
    const { personalBests } = history
    const { campaignId } = campaign

    return (
      personalBests.highestCP?.campaignId === campaignId ||
      personalBests.mostSPSpent?.campaignId === campaignId ||
      personalBests.mostHexesExplored?.campaignId === campaignId ||
      personalBests.mostGamesPlayed?.campaignId === campaignId ||
      personalBests.mostGamesWon?.campaignId === campaignId ||
      personalBests.mostOperatives?.campaignId === campaignId ||
      personalBests.shortestVictory?.campaignId === campaignId ||
      personalBests.longestVictory?.campaignId === campaignId
    )
  }

  /**
   * WHY: Format ISO date string to human-readable format
   * Uses locale-aware date formatting
   */
  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * WHY: Export performance history as JSON file
   * Allows users to backup or share their campaign history
   */
  const handleExport = (): void => {
    const dataStr = JSON.stringify(history, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `ctesiphus-performance-${Date.now()}.json`
    link.click()

    URL.revokeObjectURL(url)
  }

  /**
   * WHY: Clear all performance history after user confirmation
   * Calls localStorage clear function and closes modal
   */
  const handleConfirmClear = (): void => {
    clearPerformanceHistory()
    setShowConfirmClear(false)
    onClose()
  }

  return (
    <div className="performance-history-overlay" onClick={onClose}>
      <div className="performance-history-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="history-header">
          <h2>Solo Performance History</h2>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        {/* Personal Bests Panel */}
        {hasHistory && (
          <div className="personal-bests-panel">
            <h3>Personal Bests</h3>
            <div className="bests-grid">
              {history.personalBests.highestCP && (
                <div className="best-item">
                  <span className="best-label">Highest CP:</span>
                  <span className="best-value">{history.personalBests.highestCP.value}</span>
                </div>
              )}
              {history.personalBests.mostSPSpent && (
                <div className="best-item">
                  <span className="best-label">Most SP Spent:</span>
                  <span className="best-value">{history.personalBests.mostSPSpent.value}</span>
                </div>
              )}
              {history.personalBests.mostHexesExplored && (
                <div className="best-item">
                  <span className="best-label">Most Hexes:</span>
                  <span className="best-value">{history.personalBests.mostHexesExplored.value}</span>
                </div>
              )}
              {history.personalBests.mostGamesPlayed && (
                <div className="best-item">
                  <span className="best-label">Most Games:</span>
                  <span className="best-value">{history.personalBests.mostGamesPlayed.value}</span>
                </div>
              )}
              {history.personalBests.mostGamesWon && (
                <div className="best-item">
                  <span className="best-label">Most Wins:</span>
                  <span className="best-value">{history.personalBests.mostGamesWon.value}</span>
                </div>
              )}
              {history.personalBests.mostOperatives && (
                <div className="best-item">
                  <span className="best-label">Most Operatives:</span>
                  <span className="best-value">{history.personalBests.mostOperatives.value}</span>
                </div>
              )}
              {history.personalBests.shortestVictory && (
                <div className="best-item">
                  <span className="best-label">Shortest Victory:</span>
                  <span className="best-value">{history.personalBests.shortestVictory.value} rounds</span>
                </div>
              )}
              {history.personalBests.longestVictory && (
                <div className="best-item">
                  <span className="best-label">Longest Victory:</span>
                  <span className="best-value">{history.personalBests.longestVictory.value} rounds</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Campaign List */}
        <div className="campaigns-list">
          {hasHistory ? (
            history.campaigns.map((campaign) => (
              <div
                key={campaign.campaignId}
                className={`campaign-card ${isRecordHolder(campaign) ? 'record-holder' : ''}`}
                data-testid="campaign-card"
              >
                <div className="campaign-header">
                  <div className="campaign-status">
                    {campaign.success ? (
                      <span className="status-badge success">Victory</span>
                    ) : (
                      <span className="status-badge failure">Defeat</span>
                    )}
                    {isRecordHolder(campaign) && <span className="record-star">⭐</span>}
                  </div>
                  <div className="campaign-date">{formatDate(campaign.date)}</div>
                </div>

                <div className="campaign-id">{campaign.campaignId}</div>

                <div className="campaign-stats-row">
                  <div className="stat">
                    <span className="stat-label">CP:</span>
                    <span className="stat-value">{campaign.finalCP}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Threat:</span>
                    <span className="stat-value">{campaign.finalThreat}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Rounds:</span>
                    <span className="stat-value">{campaign.rounds}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Win Rate:</span>
                    <span className="stat-value">{(campaign.stats.winRate * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="campaign-categories">
                  <div className="category-mini">
                    <span className="category-mini-icon">💎</span>
                    <span className="category-mini-value">{campaign.categories.pioneer.value}</span>
                  </div>
                  <div className="category-mini">
                    <span className="category-mini-icon">🗺️</span>
                    <span className="category-mini-value">{campaign.categories.explorer.value}</span>
                  </div>
                  <div className="category-mini">
                    <span className="category-mini-icon">⚔️</span>
                    <span className="category-mini-value">{campaign.categories.trooper.value}</span>
                  </div>
                  <div className="category-mini">
                    <span className="category-mini-icon">🏆</span>
                    <span className="category-mini-value">{campaign.categories.warrior.value}</span>
                  </div>
                  <div className="category-mini">
                    <span className="category-mini-icon">🎯</span>
                    <span className="category-mini-value">{campaign.categories.headhunter.value}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No campaigns completed yet. Start your first solo campaign to begin tracking performance!</p>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        {showConfirmClear && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog">
              <h3>Are you sure?</h3>
              <p>This will permanently delete all campaign history and personal bests. This action cannot be undone.</p>
              <div className="confirmation-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowConfirmClear(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-confirm"
                  onClick={handleConfirmClear}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <footer className="history-footer">
          <button
            className="btn-export"
            onClick={handleExport}
            disabled={!hasHistory}
          >
            Export History
          </button>
          <button
            className="btn-clear"
            onClick={() => setShowConfirmClear(true)}
            disabled={!hasHistory}
          >
            Clear History
          </button>
        </footer>
      </div>
    </div>
  )
}
