import type { Hex, Location, Condition } from '@/types/campaign'

/**
 * WHY: Extract explored location IDs from hex map for duplicate detection (Issue #58)
 * Scans all explored hexes and returns array of location IDs (e.g., ["SL21", "SL11-16"])
 */
export function getExploredLocationIds(hexes: Record<string, Hex>): string[] {
  return Object.values(hexes)
    .filter(hex => hex.explored && hex.exploredLocation)
    .map(hex => hex.exploredLocation!)
}

/**
 * WHY: Extract explored condition IDs from hex map for duplicate detection (Issue #58)
 * Same logic as locations but for conditions
 */
export function getExploredConditionIds(hexes: Record<string, Hex>): string[] {
  return Object.values(hexes)
    .filter(hex => hex.explored && hex.exploredCondition)
    .map(hex => hex.exploredCondition!)
}

/**
 * WHY: Determine if a location roll should be re-rolled due to duplicate (Issue #58)
 * Returns true if location is unique AND already explored
 * Returns false for repeatable locations (allow duplicates)
 */
export function shouldRerollLocation(
  location: Location,
  exploredIds: string[]
): boolean {
  // WHY: Repeatable locations (e.g., Ruin at 11-16) never need re-roll
  if (location.repeatable) {
    return false
  }

  // WHY: Unique/Special locations need re-roll if already explored
  return exploredIds.includes(location.id || '')
}

/**
 * WHY: Determine if a condition roll should be re-rolled due to duplicate (Issue #58)
 * Same logic as locations but for conditions
 */
export function shouldRerollCondition(
  condition: Condition,
  exploredIds: string[]
): boolean {
  // WHY: Repeatable conditions (e.g., Clear at 11-16) never need re-roll
  if (condition.repeatable) {
    return false
  }

  // WHY: Standard conditions need re-roll if already occurred
  return exploredIds.includes(condition.id || '')
}

/**
 * WHY: Roll D36 with automatic re-rolls for duplicate locations (Issue #58)
 * Keeps rolling until a non-duplicate location is found or maxRerolls reached
 *
 * @param rollFn - Dice rolling function (typically rollD36)
 * @param exploredIds - Array of already explored location IDs
 * @param locations - Location lookup table by roll number
 * @param maxRerolls - Maximum re-roll attempts to prevent infinite loops (default: 10)
 * @returns Final roll number
 */
export function rollWithRerolls(
  rollFn: () => number,
  exploredIds: string[],
  locations: Record<number, Location>,
  maxRerolls: number = 10
): number {
  let attempts = 0
  let roll = rollFn()

  while (attempts < maxRerolls) {
    const location = locations[roll]

    // WHY: No location data? Accept roll (safety fallback)
    if (!location) {
      return roll
    }

    // WHY: Check if re-roll needed based on repeatable flag and explored status
    if (!shouldRerollLocation(location, exploredIds)) {
      return roll
    }

    // WHY: Re-roll needed - increment counter and roll again
    attempts++
    roll = rollFn()
  }

  // WHY: Max re-rolls reached - return last roll to prevent infinite loop
  return roll
}

/**
 * WHY: Roll D36 with automatic re-rolls for duplicate conditions (Issue #58)
 * Same logic as location re-rolls but for conditions
 */
export function rollConditionWithRerolls(
  rollFn: () => number,
  exploredIds: string[],
  conditions: Record<number, Condition>,
  maxRerolls: number = 10
): number {
  let attempts = 0
  let roll = rollFn()

  while (attempts < maxRerolls) {
    const condition = conditions[roll]

    // WHY: No condition data? Accept roll (safety fallback)
    if (!condition) {
      return roll
    }

    // WHY: Check if re-roll needed based on repeatable flag and occurred status
    if (!shouldRerollCondition(condition, exploredIds)) {
      return roll
    }

    // WHY: Re-roll needed - increment counter and roll again
    attempts++
    roll = rollFn()
  }

  // WHY: Max re-rolls reached - return last roll to prevent infinite loop
  return roll
}
