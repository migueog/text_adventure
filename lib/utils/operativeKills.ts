import type { OperativeKill, Player } from '@/types/campaign'

/**
 * Operative Kill Tracking Utilities (Issue #50)
 * WHY: HEADHUNTER victory category uses wound-based counting, not raw kill count
 *
 * Wound-based scoring rules:
 * - 5 or fewer wounds: 0 points
 * - 6-10 wounds: 1 point
 * - 11+ wounds: 2 points
 */

/**
 * Calculate wound-based value for operative kill
 * WHY: HEADHUNTER category uses wound-based counting (Issue #50)
 *
 * @param wounds - Wound characteristic of killed operative
 * @returns Point value: 0 (≤5W), 1 (6-10W), or 2 (11+W)
 *
 * @example
 * calculateOperativeWoundValue(4)  // => 0 (Gretchin)
 * calculateOperativeWoundValue(7)  // => 1 (Fire Warrior)
 * calculateOperativeWoundValue(12) // => 2 (Ork Nob)
 */
export function calculateOperativeWoundValue(wounds: number): number {
  if (wounds <= 5) return 0
  if (wounds <= 10) return 1
  return 2  // 11+
}

/**
 * Record operative kill with wound-based tracking
 * WHY: Track kill details for HEADHUNTER calculations
 *
 * @param player - Player making the kill
 * @param round - Current campaign round
 * @param operativeName - Name of killed operative
 * @param wounds - Wound characteristic of killed operative
 * @param opponentId - ID of opponent (null for external opponents)
 * @returns OperativeKill record with calculated wound value
 */
export function recordOperativeKill(
  _player: Player,
  round: number,
  operativeName: string,
  wounds: number,
  opponentId?: number | null
): OperativeKill {
  const woundValue = calculateOperativeWoundValue(wounds)

  return {
    round,
    operativeName,
    wounds,
    woundValue,
    opponentId: opponentId ?? null
  }
}

/**
 * Calculate total wound-based operative value for player
 * WHY: HEADHUNTER winner determined by wound-based total, not raw count
 *
 * @param player - Player to calculate score for
 * @returns Total wound-based score
 *
 * Fallback logic:
 * - If operativeKillDetails exist and has entries: sum woundValue fields
 * - If operativeKillDetails is empty or undefined: use legacy operativesKilled
 */
export function calculateHeadhunterScore(player: Player): number {
  if (!player.operativeKillDetails || player.operativeKillDetails.length === 0) {
    // Fallback: Use legacy operativesKilled for backward compatibility
    return player.operativesKilled || 0
  }

  return player.operativeKillDetails.reduce((total, kill) => total + kill.woundValue, 0)
}

/**
 * Get kill details summary for display
 * WHY: Provide categorized kill statistics for UI
 *
 * @param player - Player to get summary for
 * @returns Summary object with categorized kill counts
 */
export function getKillSummary(player: Player): {
  totalKills: number
  woundScore: number
  heavyKills: number  // 11+ wounds
  standardKills: number  // 6-10 wounds
  lightKills: number  // 1-5 wounds
} {
  const details = player.operativeKillDetails || []

  return {
    totalKills: details.length,
    woundScore: calculateHeadhunterScore(player),
    heavyKills: details.filter(k => k.wounds >= 11).length,
    standardKills: details.filter(k => k.wounds >= 6 && k.wounds <= 10).length,
    lightKills: details.filter(k => k.wounds <= 5).length
  }
}
