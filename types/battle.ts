/**
 * Battle type definitions for Issue #34
 *
 * WHY: Extends base BattleRecord with detailed tracking fields,
 * external opponent support, and statistics for the battle history accordion.
 */

import type { BattleResult, BattleRecord } from './campaign'

/**
 * Input data for recording operative kills with wound details (Issue #50)
 * WHY: Allow battle recording to include detailed operative kill data
 */
export interface OperativeKillInput {
  operativeName: string  // WHY: Name of killed operative (e.g., "Fire Warrior", "Ork Nob")
  wounds: number         // WHY: Wound characteristic determines point value for HEADHUNTER
}

/**
 * Extended battle record with full details for history tracking
 *
 * WHY: Extends base BattleRecord to include mission details, VP scoring,
 * and external opponent support as specified in Issue #34.
 */
export interface ExtendedBattleRecord extends BattleRecord {
  /** WHY: Toggle for non-campaign opponents (simple flag, no name collection) */
  isExternalOpponent: boolean

  /** WHY: Track when battle was recorded for sorting and display */
  timestamp: string

  /** WHY: Store earned rewards for history display (calculated at record time) */
  cpEarned: number
  spEarned: number

  // Optional detailed fields (for expanded "Show Details" mode)

  /** WHY: Kill Team mission played (from predefined list) */
  missionType?: string

  /** WHY: Victory points scored by player */
  vpScored?: number

  /** WHY: Victory points scored by opponent */
  vpOpponent?: number

  /** WHY: Operatives lost (distinct from operativesKilled which tracks kills made) */
  operativesLost?: number

  /** WHY: Free-form notes for narrative tracking */
  notes?: string

  /** WHY: Optional detailed kill tracking for wound-based HEADHUNTER category (Issue #50) */
  operativeKills?: OperativeKillInput[]

  // Issue #41: Battle Phase Rewards and Special Cases

  /** WHY: Helper playing extra game for odd player - receives no rewards */
  isExtraGame?: boolean

  /** WHY: Recorded against missing opponent - auto loss/win scenario */
  isMissingOpponent?: boolean
}

/**
 * Calculated statistics for battle history display
 *
 * WHY: Pre-computed stats for efficient UI rendering in PlayerPanel accordion
 */
export interface BattleStatistics {
  totalBattles: number
  wins: number
  losses: number
  draws: number
  byes: number

  /** WHY: Calculated as (wins / actualBattles) * 100, excludes byes */
  winRate: number

  totalCPFromBattles: number
  totalSPFromBattles: number
  totalOperativesKilled: number
  totalOperativesLost: number

  /** WHY: Average VP when missionType is recorded, null if no VP data */
  averageVPScored: number | null

  /** WHY: Track most common opponent for statistics display */
  mostFacedOpponent: { playerId: number; count: number } | null
}

/**
 * Kill Team mission definition for randomizer
 *
 * WHY: Basic structure for mission selection, extensible for future generator
 */
export interface Mission {
  id: string
  name: string

  /** WHY: Kill Team mission categories (Incursion, Infiltrate, etc.) */
  category: 'Incursion' | 'Infiltrate' | 'Recon' | 'Seek and Destroy'
}

/**
 * Filter options for battle history display
 *
 * WHY: Support filtered view in PlayerPanel accordion
 */
export interface BattleHistoryFilter {
  round?: number
  result?: BattleResult
  /** WHY: Can filter by player ID or 'external' for non-campaign opponents */
  opponentId?: number | 'external'
  hasMission?: boolean
}
