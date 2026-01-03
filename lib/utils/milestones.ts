import type { Milestone } from '@/types/campaign'

/**
 * WHY: Milestone detection utilities (Issue #31 - Phase 1)
 * Detects significant round markers for notification
 * Includes interval milestones, halfway point, and final warning
 */

/**
 * WHY: Detect all milestones for current round
 * Checks for interval (every 5 rounds), halfway point, and final warning
 *
 * @param currentRound - Current round number
 * @param threatLevel - Current threat level
 * @param targetThreatLevel - Target threat level
 * @param previousRound - Previous round number (for halfway detection)
 * @returns Array of detected milestones
 */
export function detectMilestones(
  currentRound: number,
  threatLevel: number,
  targetThreatLevel: number,
  previousRound: number
): Milestone[] {
  const milestones: Milestone[] = []

  // WHY: Check for interval milestone (every 5 rounds)
  if (isIntervalMilestone(currentRound)) {
    milestones.push({
      type: 'interval',
      round: currentRound,
      message: `🎖️ Round ${currentRound} completed! Keep pushing forward!`,
      icon: '🎖️'
    })
  }

  // WHY: Check for halfway milestone
  const previousThreat = threatLevel - (currentRound - previousRound)
  if (isHalfwayMilestone(currentRound, threatLevel, targetThreatLevel, previousThreat)) {
    milestones.push({
      type: 'halfway',
      round: currentRound,
      message: `⚡ You're halfway to target threat level! ${threatLevel}/${targetThreatLevel}`,
      icon: '⚡'
    })
  }

  // WHY: Check for final round warning
  if (isFinalWarning(threatLevel, targetThreatLevel)) {
    milestones.push({
      type: 'final-warning',
      round: currentRound,
      message: `⚠️ This is the final round! Threat ${threatLevel}/${targetThreatLevel}`,
      icon: '⚠️'
    })
  }

  return milestones
}

/**
 * WHY: Check if current round is a 5-round interval
 * Triggers at rounds 5, 10, 15, 20, etc.
 *
 * @param round - Round number to check
 * @returns True if round is divisible by 5
 */
export function isIntervalMilestone(round: number): boolean {
  return round > 0 && round % 5 === 0
}

/**
 * WHY: Check if campaign just crossed halfway point
 * Triggers when threat level crosses midpoint between 1 and target
 *
 * @param _currentRound - Current round number (unused, kept for API consistency)
 * @param currentThreat - Current threat level
 * @param targetThreat - Target threat level
 * @param previousThreat - Previous threat level
 * @returns True if just crossed halfway point
 */
export function isHalfwayMilestone(
  _currentRound: number,
  currentThreat: number,
  targetThreat: number,
  previousThreat: number
): boolean {
  // WHY: Calculate halfway point (midpoint between 1 and target)
  const halfway = (1 + targetThreat) / 2

  // WHY: Check if just crossed halfway (current > halfway, previous <= halfway)
  return currentThreat > halfway && previousThreat <= halfway
}

/**
 * WHY: Check if one round away from campaign end
 * Triggers when threat is exactly one below target
 *
 * @param threatLevel - Current threat level
 * @param targetThreatLevel - Target threat level
 * @returns True if threat + 1 = target
 */
export function isFinalWarning(
  threatLevel: number,
  targetThreatLevel: number
): boolean {
  return threatLevel === targetThreatLevel - 1
}
