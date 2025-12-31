/**
 * Battle Rewards Utilities (Issue #41)
 *
 * WHY: Pure functions for calculating battle rewards, handling SP caps,
 * and creating records for special cases (missing players, extra games).
 */

import type { Player, BattleResult } from '@/types/campaign'
import type { ExtendedBattleRecord } from '@/types/battle'
import { BATTLE_RESULTS } from '@/lib/data/campaignData'

/** WHY: SP limits enforced throughout campaign */
export const SP_MAX = 10
export const SP_MIN = 0

/**
 * Result of SP calculation with cap info for UI feedback
 */
export interface SPCapResult {
  newSP: number
  wasCapped: boolean
  /** WHY: Amount lost to cap for display message */
  cappedAmount: number
}

/**
 * Calculates new SP value with cap enforcement and feedback
 *
 * WHY: Provides UI feedback when rewards are capped at maximum
 *
 * @param currentSP - Player's current supply points
 * @param spReward - SP to add (can be negative for defensive edge cases)
 * @returns Object with new SP, whether it was capped, and amount lost to cap
 */
export function calculateRewardWithCap(
  currentSP: number,
  spReward: number
): SPCapResult {
  const rawTotal = currentSP + spReward

  // WHY: Clamp to valid SP range
  const newSP = Math.max(SP_MIN, Math.min(SP_MAX, rawTotal))

  // WHY: Only count as capped if we're at max and would have gone higher
  const wasCapped = rawTotal > SP_MAX
  const cappedAmount = wasCapped ? rawTotal - SP_MAX : 0

  return {
    newSP,
    wasCapped,
    cappedAmount
  }
}

/**
 * Records returned for missing player scenario
 */
export interface MissingPlayerRecords {
  winRecord: ExtendedBattleRecord
  lossRecord: ExtendedBattleRecord
}

/**
 * Creates battle records for present/absent player scenario
 *
 * WHY: When a player misses their game, sporting rules dictate:
 * - Present player gets WIN (+1 CP)
 * - Absent player gets LOSS (+1 SP as consolation)
 *
 * @param presentPlayer - Player who showed up
 * @param absentPlayer - Player who didn't show
 * @param round - Current round number
 * @returns Records for both players with appropriate results
 */
export function createMissingPlayerRecords(
  presentPlayer: Pick<Player, 'id' | 'name'>,
  absentPlayer: Pick<Player, 'id' | 'name'>,
  round: number
): MissingPlayerRecords {
  const timestamp = new Date().toISOString()

  const winRecord: ExtendedBattleRecord = {
    round,
    opponent: absentPlayer.id,
    result: 'WIN',
    status: 'completed',
    operativesKilled: 0,
    isExternalOpponent: false,
    timestamp,
    cpEarned: 1,
    spEarned: 0,
    isMissingOpponent: true
  }

  const lossRecord: ExtendedBattleRecord = {
    round,
    opponent: presentPlayer.id,
    result: 'LOSS',
    status: 'completed',
    operativesKilled: 0,
    isExternalOpponent: false,
    timestamp,
    cpEarned: 0,
    spEarned: 1,
    isMissingOpponent: true
  }

  return { winRecord, lossRecord }
}

/**
 * Reward structure for battle results
 */
export interface BattleReward {
  cpGain: number
  spGain: number
}

/**
 * Gets reward values for a battle result, accounting for extra game flag
 *
 * WHY: Centralizes reward logic and handles extra game case where helper
 * receives no rewards.
 *
 * @param result - Battle result (WIN/DRAW/LOSS/BYE)
 * @param isExtraGame - If true, returns zero rewards (helper scenario)
 * @returns CP and SP gains for the result
 */
export function getRewardForResult(
  result: BattleResult,
  isExtraGame: boolean = false
): BattleReward {
  // WHY: Extra game helper gets no rewards
  if (isExtraGame) {
    return { cpGain: 0, spGain: 0 }
  }

  // WHY: Look up rewards from campaign data
  const rewards = BATTLE_RESULTS[result]

  if (!rewards) {
    // WHY: Defensive fallback - should never happen with typed result
    return { cpGain: 0, spGain: 0 }
  }

  return {
    cpGain: rewards.cpGain,
    spGain: rewards.spGain
  }
}
