import type { ThreatWarningLevel } from '@/types/campaign'

/**
 * Calculate threat warning level based on distance to target
 * WHY: Warn players when approaching campaign end (Issue #29)
 *
 * @param currentThreat - Current threat level (1-10)
 * @param targetThreat - Target threat level for campaign end (1-10)
 * @returns Warning level: 'critical' (≤1 from target), 'moderate' (2 from target), or 'none' (>2 from target)
 *
 * @example
 * calculateThreatWarning(5, 7) // => 'moderate' (distance = 2)
 * calculateThreatWarning(6, 7) // => 'critical' (distance = 1)
 * calculateThreatWarning(3, 7) // => 'none' (distance = 4)
 */
export function calculateThreatWarning(
  currentThreat: number,
  targetThreat: number
): ThreatWarningLevel {
  const distance = targetThreat - currentThreat

  if (distance <= 1) return 'critical'
  if (distance === 2) return 'moderate'
  return 'none'
}
