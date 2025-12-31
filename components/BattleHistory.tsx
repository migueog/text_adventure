'use client'

/**
 * Battle history accordion component (Issue #34)
 *
 * WHY: Displays player's battle history with statistics, filtering,
 * and detailed entries in a collapsible accordion format.
 */

import { useState, useMemo, useCallback } from 'react'
import type { ExtendedBattleRecord, BattleHistoryFilter } from '@/types/battle'
import type { BattleResult } from '@/types/campaign'
import {
  calculateBattleStatistics,
  filterBattleHistory
} from '@/lib/utils/battleStats'

interface BattleHistoryProps {
  history: ExtendedBattleRecord[]
  players: Array<{ id: number; name: string }>
}

export default function BattleHistory({
  history,
  players
}: BattleHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [resultFilter, setResultFilter] = useState<BattleResult | ''>('')

  // WHY: Pre-compute statistics for display
  const stats = useMemo(
    () => calculateBattleStatistics(history),
    [history]
  )

  // WHY: Apply filter and sort by most recent first
  const filteredHistory = useMemo(() => {
    const filter: BattleHistoryFilter = {}
    if (resultFilter) {
      filter.result = resultFilter
    }

    const filtered = filterBattleHistory(history, filter)

    // WHY: Sort by timestamp descending (most recent first)
    return [...filtered].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [history, resultFilter])

  const getOpponentName = useCallback((record: ExtendedBattleRecord): string => {
    if (record.result === 'BYE') return 'No opponent'
    if (record.isExternalOpponent) return 'External'
    if (record.opponent === null) return 'Unknown'

    const player = players.find(p => p.id === record.opponent)
    return player?.name ?? `Player ${record.opponent}`
  }, [players])

  const getFavoriteOpponentName = useCallback((): string | null => {
    if (!stats.mostFacedOpponent) return null
    const player = players.find(p => p.id === stats.mostFacedOpponent?.playerId)
    return player?.name ?? null
  }, [stats.mostFacedOpponent, players])

  const battleCountText = history.length === 1 ? '1 battle' : `${history.length} battles`

  return (
    <div className="battle-history-section">
      <button
        type="button"
        className="battle-history-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span>Battle History ({battleCountText})</span>
        <span className="accordion-icon">{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="battle-history-content">
          <StatisticsSummary
            stats={stats}
            favoriteOpponentName={getFavoriteOpponentName()}
          />

          <FilterControls
            resultFilter={resultFilter}
            onResultFilterChange={setResultFilter}
          />

          <BattleList
            battles={filteredHistory}
            originalCount={history.length}
            getOpponentName={getOpponentName}
          />
        </div>
      )}
    </div>
  )
}

/**
 * WHY: Separate component for statistics display, keeps main component clean
 */
interface StatisticsSummaryProps {
  stats: ReturnType<typeof calculateBattleStatistics>
  favoriteOpponentName: string | null
}

function StatisticsSummary({ stats, favoriteOpponentName }: StatisticsSummaryProps) {
  const record = `${stats.wins}-${stats.losses}-${stats.draws}`

  return (
    <div className="battle-stats-summary">
      <div className="stat-row">
        <span className="stat-label">Win Rate:</span>
        <span className="stat-value">{stats.winRate}%</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Record (W-L-D):</span>
        <span className="stat-value">{record}</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">Total Rewards:</span>
        <span className="stat-value">{stats.totalCPFromBattles} CP / {stats.totalSPFromBattles} SP</span>
      </div>
      {favoriteOpponentName && stats.mostFacedOpponent && (
        <div className="stat-row">
          <span className="stat-label">Favorite Opponent:</span>
          <span className="stat-value">
            {favoriteOpponentName} ({stats.mostFacedOpponent.count}x)
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * WHY: Filter controls for battle history list
 */
interface FilterControlsProps {
  resultFilter: BattleResult | ''
  onResultFilterChange: (value: BattleResult | '') => void
}

function FilterControls({ resultFilter, onResultFilterChange }: FilterControlsProps) {
  return (
    <div className="battle-filters">
      <label htmlFor="result-filter">
        Filter by result:
        <select
          id="result-filter"
          value={resultFilter}
          onChange={(e) => onResultFilterChange(e.target.value as BattleResult | '')}
        >
          <option value="">All</option>
          <option value="WIN">Wins</option>
          <option value="LOSS">Losses</option>
          <option value="DRAW">Draws</option>
          <option value="BYE">Byes</option>
        </select>
      </label>
    </div>
  )
}

/**
 * WHY: Battle list with empty states
 */
interface BattleListProps {
  battles: ExtendedBattleRecord[]
  originalCount: number
  getOpponentName: (record: ExtendedBattleRecord) => string
}

function BattleList({ battles, originalCount, getOpponentName }: BattleListProps) {
  if (originalCount === 0) {
    return <p className="empty-message">No battles recorded yet.</p>
  }

  if (battles.length === 0) {
    return <p className="empty-message">No battles match the current filter.</p>
  }

  return (
    <ul className="battle-list">
      {battles.map((battle, index) => (
        <BattleEntry
          key={`${battle.round}-${battle.timestamp}-${index}`}
          battle={battle}
          opponentName={getOpponentName(battle)}
        />
      ))}
    </ul>
  )
}

/**
 * WHY: Individual battle entry display
 */
interface BattleEntryProps {
  battle: ExtendedBattleRecord
  opponentName: string
}

function BattleEntry({ battle, opponentName }: BattleEntryProps) {
  const resultClass = battle.result.toLowerCase()
  const rewardText = formatReward(battle)

  return (
    <li className="battle-entry">
      <div className="battle-header">
        <span className="round-badge">R{battle.round}</span>
        <span className={`result-badge ${resultClass}`}>{battle.result}</span>
        <span className="opponent-name">vs {opponentName}</span>
        <span className="reward">{rewardText}</span>
      </div>

      {battle.missionType && (
        <div className="battle-detail">
          <span className="detail-label">Mission:</span>
          <span>{battle.missionType}</span>
        </div>
      )}

      {(battle.vpScored !== undefined || battle.vpOpponent !== undefined) && (
        <div className="battle-detail">
          <span className="detail-label">VP:</span>
          <span>{battle.vpScored ?? 0} - {battle.vpOpponent ?? 0}</span>
        </div>
      )}

      <div className="battle-detail">
        <span className="detail-label">Operatives:</span>
        <span>{battle.operativesKilled} killed</span>
        {battle.operativesLost !== undefined && (
          <span>, {battle.operativesLost} lost</span>
        )}
      </div>

      {battle.notes && (
        <div className="battle-notes">{battle.notes}</div>
      )}
    </li>
  )
}

/**
 * WHY: Format reward display string
 */
function formatReward(battle: ExtendedBattleRecord): string {
  const parts: string[] = []
  if (battle.cpEarned > 0) parts.push(`+${battle.cpEarned} CP`)
  if (battle.spEarned > 0) parts.push(`+${battle.spEarned} SP`)
  return parts.join(', ') || '+0'
}
