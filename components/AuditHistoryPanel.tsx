'use client'

import { useState } from 'react'
import type { AuditEntry, AuditActionType, CampaignAuditLog } from '@/types/campaign'
import { diffHexSnapshots } from '@/lib/utils/auditTrail'

/**
 * WHY: Audit history panel component (Issue #23 - Phase 3)
 * Displays timeline of hex modifications with filtering and diff view
 */

interface AuditHistoryPanelProps {
  auditLog: CampaignAuditLog
  onClose: () => void
  exportAuditLog: (campaignName: string) => void
}

type FilterType = 'all' | 'hex' | 'player' | 'action' | 'round'

export default function AuditHistoryPanel({
  auditLog,
  onClose,
  exportAuditLog
}: AuditHistoryPanelProps) {
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterValue, setFilterValue] = useState<string>('')
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())

  // WHY: Filter entries based on selected filter type
  const getFilteredEntries = (): AuditEntry[] => {
    let filtered = auditLog.entries

    if (filterType === 'hex' && filterValue) {
      filtered = filtered.filter(e => e.hexId === filterValue)
    } else if (filterType === 'player' && filterValue) {
      const playerId = parseInt(filterValue)
      if (!isNaN(playerId)) {
        filtered = filtered.filter(e => e.playerId === playerId)
      }
    } else if (filterType === 'action' && filterValue) {
      filtered = filtered.filter(e => e.action === filterValue)
    } else if (filterType === 'round' && filterValue) {
      const roundNum = parseInt(filterValue)
      if (!isNaN(roundNum)) {
        filtered = filtered.filter(e => e.round === roundNum)
      }
    }

    // WHY: Sort chronologically (by round, then timestamp)
    return filtered.sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    })
  }

  const filteredEntries = getFilteredEntries()

  // WHY: Toggle expanded state for entry
  const toggleExpanded = (entryId: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev)
      if (next.has(entryId)) {
        next.delete(entryId)
      } else {
        next.add(entryId)
      }
      return next
    })
  }

  // WHY: Get unique values for filter dropdowns
  const getUniqueHexes = () => {
    const hexes = new Set(auditLog.entries.map(e => e.hexId))
    return Array.from(hexes).sort()
  }

  const getUniquePlayers = () => {
    const players = new Map<number, string>()
    auditLog.entries.forEach(e => {
      players.set(e.playerId, e.playerName)
    })
    return Array.from(players.entries()).sort((a, b) => a[0] - b[0])
  }

  const getUniqueActions = (): AuditActionType[] => {
    const actions = new Set(auditLog.entries.map(e => e.action))
    return Array.from(actions).sort() as AuditActionType[]
  }

  const getUniqueRounds = () => {
    const rounds = new Set(auditLog.entries.map(e => e.round))
    return Array.from(rounds).sort((a, b) => a - b)
  }

  // WHY: Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // WHY: Get action icon based on type
  const getActionIcon = (action: AuditActionType) => {
    switch (action) {
      case 'EXPLORE': return '🔍'
      case 'MOVE': return '➡️'
      case 'SCOUT': return '👁️'
      case 'SEARCH': return '🔎'
      case 'ENCAMP': return '⛺'
      case 'DEMOLISH': return '💥'
      case 'PORTAL_CONFIG': return '🌀'
      case 'HEX_BLOCK': return '🚫'
      case 'STATE_CHANGE': return '⚙️'
      default: return '📝'
    }
  }

  return (
    <div className="audit-history-panel">
      <div className="panel-header">
        <h2>Audit History</h2>
        <button type="button" onClick={onClose} className="close-btn">
          ✕
        </button>
      </div>

      <div className="panel-content">
        {/* Filter Controls */}
        <div className="filter-section">
          <div className="filter-type">
            <label htmlFor="filter-type">Filter by:</label>
            <select
              id="filter-type"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as FilterType)
                setFilterValue('')
              }}
            >
              <option value="all">All Entries</option>
              <option value="hex">Hex ID</option>
              <option value="player">Player</option>
              <option value="action">Action Type</option>
              <option value="round">Round</option>
            </select>
          </div>

          {filterType === 'hex' && (
            <div className="filter-value">
              <label htmlFor="filter-hex">Select Hex:</label>
              <select
                id="filter-hex"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              >
                <option value="">All Hexes</option>
                {getUniqueHexes().map(hexId => (
                  <option key={hexId} value={hexId}>{hexId}</option>
                ))}
              </select>
            </div>
          )}

          {filterType === 'player' && (
            <div className="filter-value">
              <label htmlFor="filter-player">Select Player:</label>
              <select
                id="filter-player"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              >
                <option value="">All Players</option>
                {getUniquePlayers().map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {filterType === 'action' && (
            <div className="filter-value">
              <label htmlFor="filter-action">Select Action:</label>
              <select
                id="filter-action"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              >
                <option value="">All Actions</option>
                {getUniqueActions().map(action => (
                  <option key={action} value={action}>
                    {getActionIcon(action)} {action}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterType === 'round' && (
            <div className="filter-value">
              <label htmlFor="filter-round">Select Round:</label>
              <select
                id="filter-round"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              >
                <option value="">All Rounds</option>
                {getUniqueRounds().map(round => (
                  <option key={round} value={round}>Round {round}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Entry Count */}
        <div className="entry-count">
          Showing {filteredEntries.length} of {auditLog.entries.length} entries
        </div>

        {/* Timeline */}
        <div className="audit-timeline">
          {filteredEntries.length === 0 ? (
            <div className="no-entries">
              <p>No audit entries found</p>
            </div>
          ) : (
            filteredEntries.map(entry => {
              const isExpanded = expandedEntries.has(entry.id)
              const changes = isExpanded ? diffHexSnapshots(entry.before, entry.after) : []

              return (
                <div key={entry.id} className="timeline-entry">
                  <div
                    className="entry-header"
                    onClick={() => toggleExpanded(entry.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="entry-icon">
                      {getActionIcon(entry.action)}
                    </div>
                    <div className="entry-summary">
                      <div className="entry-title">
                        <strong>{entry.playerName}</strong> - {entry.action}
                      </div>
                      <div className="entry-meta">
                        Round {entry.round} • {entry.phase} • Hex {entry.hexId}
                      </div>
                      <div className="entry-reason">{entry.reason}</div>
                    </div>
                    <div className="entry-timestamp">
                      {formatTimestamp(entry.timestamp)}
                    </div>
                    <div className="expand-indicator">
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="entry-details">
                      <h4>Changes:</h4>
                      {changes.length === 0 ? (
                        <p className="no-changes">No changes detected</p>
                      ) : (
                        <div className="changes-list">
                          {changes.map((change, idx) => (
                            <div key={idx} className="change-item">
                              <div className="change-field">
                                <strong>{change.field}:</strong>
                              </div>
                              <div className="change-values">
                                <div className="before-value">
                                  <span className="label">Before:</span>
                                  <code>{JSON.stringify(change.before)}</code>
                                </div>
                                <div className="arrow">→</div>
                                <div className="after-value">
                                  <span className="label">After:</span>
                                  <code>{JSON.stringify(change.after)}</code>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="panel-footer">
        <button
          type="button"
          onClick={() => exportAuditLog('campaign')}
          className="action-btn secondary"
        >
          Export Audit Log
        </button>
        <button
          type="button"
          onClick={onClose}
          className="action-btn primary"
        >
          Close
        </button>
      </div>
    </div>
  )
}
