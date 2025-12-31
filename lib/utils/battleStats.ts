/**
 * Battle statistics utility for Issue #34
 *
 * WHY: Provides functions to calculate battle statistics and filter history
 * for the BattleHistory accordion display in PlayerPanel.
 */

import type {
  ExtendedBattleRecord,
  BattleStatistics,
  BattleHistoryFilter
} from '@/types/battle'

/**
 * Calculate comprehensive battle statistics from history
 *
 * WHY: Pre-compute all stats for efficient UI rendering in PlayerPanel
 */
export function calculateBattleStatistics(
  history: ExtendedBattleRecord[]
): BattleStatistics {
  if (history.length === 0) {
    return createEmptyStats()
  }

  const counts = countResults(history)
  const actualBattles = counts.wins + counts.losses + counts.draws

  return {
    totalBattles: history.length,
    ...counts,
    winRate: actualBattles > 0
      ? Math.round((counts.wins / actualBattles) * 100)
      : 0,
    totalCPFromBattles: sumField(history, 'cpEarned'),
    totalSPFromBattles: sumField(history, 'spEarned'),
    totalOperativesKilled: sumField(history, 'operativesKilled'),
    totalOperativesLost: sumOptionalField(history, 'operativesLost'),
    averageVPScored: calculateAverageVP(history),
    mostFacedOpponent: getMostFacedOpponent(history)
  }
}

/**
 * WHY: Helper to create empty stats object for zero-battle case
 */
function createEmptyStats(): BattleStatistics {
  return {
    totalBattles: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    byes: 0,
    winRate: 0,
    totalCPFromBattles: 0,
    totalSPFromBattles: 0,
    totalOperativesKilled: 0,
    totalOperativesLost: 0,
    averageVPScored: null,
    mostFacedOpponent: null
  }
}

/**
 * WHY: Count each result type efficiently in single pass
 */
function countResults(history: ExtendedBattleRecord[]): {
  wins: number
  losses: number
  draws: number
  byes: number
} {
  return history.reduce(
    (acc, record) => {
      switch (record.result) {
        case 'WIN': acc.wins++; break
        case 'LOSS': acc.losses++; break
        case 'DRAW': acc.draws++; break
        case 'BYE': acc.byes++; break
      }
      return acc
    },
    { wins: 0, losses: 0, draws: 0, byes: 0 }
  )
}

/**
 * WHY: Generic sum helper for required numeric fields
 */
function sumField(
  history: ExtendedBattleRecord[],
  field: 'cpEarned' | 'spEarned' | 'operativesKilled'
): number {
  return history.reduce((sum, record) => sum + record[field], 0)
}

/**
 * WHY: Sum helper for optional numeric fields (treats undefined as 0)
 */
function sumOptionalField(
  history: ExtendedBattleRecord[],
  field: 'operativesLost' | 'vpScored' | 'vpOpponent'
): number {
  return history.reduce((sum, record) => sum + (record[field] ?? 0), 0)
}

/**
 * WHY: Calculate average VP only for battles with VP data
 */
function calculateAverageVP(history: ExtendedBattleRecord[]): number | null {
  const withVP = history.filter(r => r.vpScored !== undefined)
  if (withVP.length === 0) return null

  const total = withVP.reduce((sum, r) => sum + (r.vpScored ?? 0), 0)
  return Math.round(total / withVP.length)
}

/**
 * Find the opponent faced most frequently
 *
 * WHY: Provides "favorite opponent" stat for display
 */
export function getMostFacedOpponent(
  history: ExtendedBattleRecord[]
): { playerId: number; count: number } | null {
  const opponentCounts = new Map<number, number>()

  for (const record of history) {
    // WHY: Only count campaign opponents (not external, not null)
    if (record.opponent !== null && !record.isExternalOpponent) {
      const count = opponentCounts.get(record.opponent) ?? 0
      opponentCounts.set(record.opponent, count + 1)
    }
  }

  if (opponentCounts.size === 0) return null

  let maxCount = 0
  let maxPlayerId = -1

  for (const [playerId, count] of opponentCounts) {
    if (count > maxCount) {
      maxCount = count
      maxPlayerId = playerId
    }
  }

  return { playerId: maxPlayerId, count: maxCount }
}

/**
 * Filter battle history by multiple criteria
 *
 * WHY: Support filtered views in battle history accordion
 */
export function filterBattleHistory(
  history: ExtendedBattleRecord[],
  filter: BattleHistoryFilter
): ExtendedBattleRecord[] {
  return history.filter(record => {
    if (filter.round !== undefined && record.round !== filter.round) {
      return false
    }

    if (filter.result !== undefined && record.result !== filter.result) {
      return false
    }

    if (filter.opponentId !== undefined) {
      if (filter.opponentId === 'external') {
        if (!record.isExternalOpponent) return false
      } else if (record.opponent !== filter.opponentId) {
        return false
      }
    }

    if (filter.hasMission !== undefined) {
      const hasMission = record.missionType !== undefined
      if (filter.hasMission !== hasMission) return false
    }

    return true
  })
}
