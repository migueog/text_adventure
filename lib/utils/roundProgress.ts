/**
 * WHY: Round progress calculation utilities (Issue #31 - Phase 1)
 * Estimates total rounds and calculates progress percentage
 * based on threat level progression
 */

/**
 * WHY: Estimate total rounds needed to reach target threat
 * Uses linear projection based on threat progression
 * Assumes +1 threat per round (normal campaign flow)
 *
 * @param currentRound - Current round number
 * @param currentThreat - Current threat level
 * @param targetThreat - Target threat level (campaign end)
 * @returns Estimated total rounds needed
 */
export function estimateTotalRounds(
  currentRound: number,
  currentThreat: number,
  targetThreat: number
): number {
  // WHY: Campaign is complete or over target
  if (currentThreat >= targetThreat) {
    return currentRound
  }

  // WHY: Calculate remaining threat increase needed
  const remainingThreat = targetThreat - currentThreat

  // WHY: Assuming +1 threat per round, add remaining rounds
  return currentRound + remainingThreat
}

/**
 * WHY: Calculate campaign progress as percentage
 * Based on threat level progression from 1 to target
 *
 * @param currentThreat - Current threat level
 * @param targetThreat - Target threat level
 * @returns Progress percentage (0-100, rounded to nearest integer)
 */
export function calculateProgress(
  currentThreat: number,
  targetThreat: number
): number {
  // WHY: Cap progress at 100% if threat exceeds target
  if (currentThreat >= targetThreat) {
    return 100
  }

  // WHY: Threat starts at 1, so progress is (current - 1) / (target - 1)
  // Example: threat 4/7 → (4-1)/(7-1) = 3/6 = 50%
  const threatProgress = currentThreat - 1
  const totalThreatRange = targetThreat - 1

  const percentage = (threatProgress / totalThreatRange) * 100

  // WHY: Round to nearest integer for clean display
  return Math.round(percentage)
}
