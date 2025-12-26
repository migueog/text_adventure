import type { HexPosition, MapConfig } from '@/types/campaign'
import { hexDistance } from './hexUtils'

/**
 * Get minimum base distance based on player count
 * WHY: Small maps (2-3 players) need more spacing, larger maps less
 *
 * @param playerCount - Number of players in campaign
 * @returns Minimum hexes between bases
 */
export function getMinimumBaseDistance(playerCount: number): number {
  // WHY: 2-3 players on 5x5 map need 2 hex spacing
  if (playerCount <= 3) return 2

  // WHY: 4+ players on 6x6 or 7x7 map need 1 hex spacing
  return 1
}

/**
 * Check if two bases are too close together
 * WHY: Enforces minimum spacing rules between player bases
 *
 * @param pos1 - First base position
 * @param pos2 - Second base position
 * @param minDistance - Minimum required distance
 * @returns true if bases are too close
 */
export function areBasesTooClose(
  pos1: HexPosition,
  pos2: HexPosition,
  minDistance: number
): boolean {
  const distance = hexDistance(pos1.row, pos1.col, pos2.row, pos2.col)
  return distance < minDistance
}

/**
 * Validate base placement
 * WHY: Ensures base placement follows campaign rules
 *
 * Rules:
 * - Must be on surface hex
 * - Must be minimum distance from other bases
 * - Cannot be on same hex as existing base
 *
 * @param position - Proposed base position
 * @param existingBases - List of already placed bases
 * @param playerCount - Number of players
 * @param isSurface - Whether the hex is a surface hex
 * @returns true if placement is valid
 */
export function isValidBasePlacement(
  position: HexPosition,
  existingBases: HexPosition[],
  playerCount: number,
  isSurface: boolean
): boolean {
  // WHY: Bases must be on surface hexes only
  if (!isSurface) return false

  const minDistance = getMinimumBaseDistance(playerCount)

  // WHY: Check distance from all existing bases
  for (const existingBase of existingBases) {
    const distance = hexDistance(
      position.row,
      position.col,
      existingBase.row,
      existingBase.col
    )

    // WHY: Cannot place on same hex
    if (distance === 0) return false

    // WHY: Must maintain minimum distance
    if (distance < minDistance) return false
  }

  return true
}

/**
 * Calculate suggested base positions
 * WHY: Provide AI-suggested evenly-spaced starting positions
 *
 * @param config - Map configuration
 * @param playerCount - Number of players
 * @returns Array of suggested base positions
 */
export function calculateSuggestedBasePositions(
  config: MapConfig,
  playerCount: number
): HexPosition[] {
  const suggestions: HexPosition[] = []

  // WHY: Spread bases evenly across top surface row
  const spacing = Math.floor(config.cols / playerCount)

  for (let i = 0; i < playerCount; i++) {
    const col = Math.min(
      Math.floor(spacing * i + spacing / 2),
      config.cols - 1
    )

    // WHY: Place on first surface row (row 0)
    suggestions.push({ row: 0, col })
  }

  return suggestions
}
