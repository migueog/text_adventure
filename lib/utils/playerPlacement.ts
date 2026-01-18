import type { HexPosition, Hex, MapConfig, Player } from '@/types/campaign'
import { hexId } from './hexUtils'

/**
 * WHY: Calculate starting positions for all players using perimeter distribution
 * Distributes players around map perimeter (corners first, then edges) to maximize starting distance
 * This provides better competitive balance than row-based placement
 *
 * Distribution strategy:
 * - 2 players: opposite corners (top-left, bottom-right) - maximum distance
 * - 3 players: three corners (top-left, bottom-right, top-right)
 * - 4 players: all four corners
 * - 5 players: four corners + right-middle edge
 * - 6 players: four corners + both middle edges (right, left)
 *
 * @param numPlayers - Number of players (must be 2-6)
 * @param mapConfig - Map configuration with rows and cols
 * @returns Array of hex positions, one per player
 * @throws Error if numPlayers is outside valid range (2-6)
 */
export function calculateStartPositions(
  numPlayers: number,
  mapConfig: MapConfig
): HexPosition[] {
  // WHY: Validate player count to match campaign rules (2-6 players)
  if (numPlayers < 2 || numPlayers > 6) {
    throw new Error('Player count must be between 2 and 6')
  }

  const { rows, cols } = mapConfig

  // WHY: Define perimeter positions prioritizing corners for maximum spread
  const perimeterPositions: HexPosition[] = [
    { row: 0, col: 0 },                           // 1. top-left corner
    { row: rows - 1, col: cols - 1 },             // 2. bottom-right corner (max distance from #1)
    { row: 0, col: cols - 1 },                    // 3. top-right corner
    { row: rows - 1, col: 0 },                    // 4. bottom-left corner
    { row: Math.floor(rows / 2), col: cols - 1 }, // 5. right-middle edge
    { row: Math.floor(rows / 2), col: 0 }         // 6. left-middle edge
  ]

  // WHY: Return only the number of positions needed for player count
  return perimeterPositions.slice(0, numPlayers)
}

/**
 * WHY: Mark starting hexes as explored bases
 * Sets each starting hex to location 11 (Base) and condition 11 (Clear)
 * Marks hexes as explored by the corresponding player index
 *
 * @param hexes - Record of all hexes on the map (mutated in place)
 * @param positions - Array of starting positions to mark
 */
export function markStartingHexes(
  hexes: Record<string, Hex>,
  positions: HexPosition[]
): void {
  positions.forEach((pos, idx) => {
    const posId = hexId(pos.row, pos.col)

    // WHY: Skip invalid positions that don't exist in hex map
    if (hexes[posId]) {
      hexes[posId].explored = true
      hexes[posId].exploredBy = [idx]
      hexes[posId].location = 11 // Base location (from campaignData)
      hexes[posId].condition = 11 // Clear condition (from campaignData)
    }
  })
}

/**
 * WHY: Assign position and base to a single player object
 * Sets both the current position and adds it to the bases array
 * This is used during initial player creation
 *
 * @param player - Partial player object to update
 * @param position - Starting hex position to assign
 * @returns Updated player object with position and bases set
 */
export function assignPlayerStartPosition(
  player: Partial<Player>,
  position: HexPosition
): Partial<Player> {
  return {
    ...player,
    position,
    bases: [position]
  }
}
