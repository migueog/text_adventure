/**
 * WHY: Issue #56 - Solo performance calculation utilities
 *
 * Functions to calculate performance stats, build performance records,
 * and manage personal best tracking for solo campaigns.
 */

import type { Player } from '@/types/campaign'
import type {
  PerformanceStats,
  SoloPerformanceRecord,
  PersonalBests,
  PersonalBestRecord
} from '@/types/soloPerformance'

/**
 * WHY: Calculate derived statistics from campaign performance
 * Used to show comparative metrics across campaigns
 */
export function calculatePerformanceStats(
  rounds: number,
  gamesWon: number,
  gamesPlayed: number,
  spSpent: number,
  hexesExplored: number,
  finalCP: number
): PerformanceStats {
  // WHY: Avoid division by zero
  if (rounds === 0) {
    return {
      winRate: 0,
      avgCPPerRound: 0,
      spSpentPerRound: 0,
      hexesPerRound: 0
    }
  }

  return {
    winRate: gamesPlayed > 0 ? gamesWon / gamesPlayed : 0,
    avgCPPerRound: finalCP / rounds,
    spSpentPerRound: spSpent / rounds,
    hexesPerRound: hexesExplored / rounds
  }
}

/**
 * WHY: Build complete performance record from player data
 * Creates snapshot of campaign performance at completion
 */
export function buildPerformanceRecord(
  campaignId: string,
  success: boolean,
  finalThreat: number,
  rounds: number,
  player: Player
): SoloPerformanceRecord {
  const totalOperativeWounds = calculateTotalOperativeWounds(
    player.operativeKillDetails || []
  )

  const stats = calculatePerformanceStats(
    rounds,
    player.gamesWon,
    player.gamesPlayed,
    player.supplyPointsSpent || 0,
    player.exploredHexes,
    player.campaignPoints
  )

  return {
    campaignId,
    date: new Date().toISOString(),
    success,
    finalCP: player.campaignPoints,
    finalThreat,
    rounds,
    categories: {
      pioneer: {
        name: 'Pioneer',
        value: player.supplyPointsSpent || 0,
        description: 'Total Supply Points spent'
      },
      explorer: {
        name: 'Explorer',
        value: player.exploredHexes,
        description: 'Hexes explored'
      },
      trooper: {
        name: 'Trooper',
        value: player.gamesPlayed,
        description: 'Battles fought'
      },
      warrior: {
        name: 'Warrior',
        value: player.gamesWon,
        description: 'Victories achieved'
      },
      headhunter: {
        name: 'Headhunter',
        value: totalOperativeWounds,
        description: 'Enemy operative wounds inflicted'
      }
    },
    stats
  }
}

/**
 * WHY: Calculate total operative wounds from kill details
 * Sums wounds from all operative kills for HEADHUNTER category
 */
function calculateTotalOperativeWounds(
  killDetails: Array<{ wounds: number }>
): number {
  return killDetails.reduce((sum, kill) => sum + kill.wounds, 0)
}

/**
 * WHY: Create empty personal bests structure
 * Used when no campaign history exists yet
 */
export function createEmptyPersonalBests(): PersonalBests {
  return {
    highestCP: null,
    mostSPSpent: null,
    mostHexesExplored: null,
    mostGamesPlayed: null,
    mostGamesWon: null,
    mostOperatives: null,
    shortestVictory: null,
    longestVictory: null
  }
}

/**
 * WHY: Update personal bests with new campaign record
 * Compares new record against current bests and updates if better
 */
export function updatePersonalBests(
  current: PersonalBests,
  record: SoloPerformanceRecord
): PersonalBests {
  const updated = { ...current }

  // WHY: Update max value records (higher is better)
  updated.highestCP = updateIfBetter(
    current.highestCP,
    record.finalCP,
    record,
    'max'
  )

  updated.mostSPSpent = updateIfBetter(
    current.mostSPSpent,
    record.categories.pioneer.value,
    record,
    'max'
  )

  updated.mostHexesExplored = updateIfBetter(
    current.mostHexesExplored,
    record.categories.explorer.value,
    record,
    'max'
  )

  updated.mostGamesPlayed = updateIfBetter(
    current.mostGamesPlayed,
    record.categories.trooper.value,
    record,
    'max'
  )

  updated.mostGamesWon = updateIfBetter(
    current.mostGamesWon,
    record.categories.warrior.value,
    record,
    'max'
  )

  updated.mostOperatives = updateIfBetter(
    current.mostOperatives,
    record.categories.headhunter.value,
    record,
    'max'
  )

  // WHY: Update victory-specific records (only for successful campaigns)
  if (record.success) {
    updated.shortestVictory = updateIfBetter(
      current.shortestVictory,
      record.rounds,
      record,
      'min'
    )

    updated.longestVictory = updateIfBetter(
      current.longestVictory,
      record.rounds,
      record,
      'max'
    )
  }

  return updated
}

/**
 * WHY: Helper to update personal best if new value is better
 * Supports both max (higher is better) and min (lower is better) modes
 */
function updateIfBetter(
  currentBest: PersonalBestRecord | null,
  newValue: number,
  record: SoloPerformanceRecord,
  mode: 'min' | 'max'
): PersonalBestRecord | null {
  // WHY: First campaign always sets the record
  if (!currentBest) {
    return createBestRecord(newValue, record)
  }

  const isBetter = mode === 'max'
    ? newValue > currentBest.value
    : newValue < currentBest.value

  return isBetter ? createBestRecord(newValue, record) : currentBest
}

/**
 * WHY: Create personal best record from campaign data
 * Extracts relevant fields for tracking which campaign holds the record
 */
function createBestRecord(
  value: number,
  record: SoloPerformanceRecord
): PersonalBestRecord {
  return {
    value,
    campaignId: record.campaignId,
    date: record.date
  }
}
