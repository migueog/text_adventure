// Threat Phase location rule detection and resolution utilities
// WHY: These functions identify and order location-based effects that trigger during Threat Phase

import type { Player, Hex, Location, ActiveThreatPhaseRule } from '@/types/campaign'
import { SURFACE_LOCATIONS, TOMB_LOCATIONS } from '@/lib/data/campaignData'
import { determinePriority } from './priority'
import { hexId } from './hexUtils'

/**
 * Get the Location object for a hex based on its type and location roll
 * WHY: Hexes store location as a D36 roll number, need to look up full data
 */
function getLocationForHex(hex: Hex): Location | undefined {
  const locations = hex.type === 'surface'
    ? SURFACE_LOCATIONS
    : TOMB_LOCATIONS
  return locations[hex.location]
}

/**
 * Detect which players have active Threat Phase location rules
 * WHY: Only explored hexes can trigger location rules
 *
 * @param players - All players in the campaign
 * @param hexes - Map of all hexes by ID
 * @returns Array of active rules with player/location context
 */
export function detectActiveThreatPhaseRules(
  players: Player[],
  hexes: Record<string, Hex>
): ActiveThreatPhaseRule[] {
  const activeRules: ActiveThreatPhaseRule[] = []

  for (const player of players) {
    const playerHexId = hexId(player.position.row, player.position.col)
    const hex = hexes[playerHexId]

    // Skip if hex not found or not explored
    if (!hex || !hex.explored) continue

    const location = getLocationForHex(hex)

    // Skip if location not found or has no threat phase rule
    if (!location?.threatPhaseRule) continue

    activeRules.push({
      player,
      hexId: playerHexId,
      location,
      rule: location.threatPhaseRule,
      priority: player.priority ?? 0
    })
  }

  return activeRules
}

/**
 * Sort active rules by player priority (lowest CP -> SP first)
 * WHY: Rules must resolve in priority order per game rules
 *
 * @param rules - Array of detected active rules
 * @param players - All players to determine priority from
 * @returns Rules sorted by priority order
 */
export function sortByPriority(
  rules: ActiveThreatPhaseRule[],
  players: Player[]
): ActiveThreatPhaseRule[] {
  if (rules.length === 0) return []

  // Get priority ordering from all players
  const prioritizedPlayers = determinePriority(players)

  // Build a map of player ID to priority
  const priorityMap = new Map<number, number>(
    prioritizedPlayers.map(p => [p.id, p.priority ?? Infinity])
  )

  // Sort rules by their player's priority
  return [...rules].sort((a, b) => {
    const aPriority = priorityMap.get(a.player.id) ?? Infinity
    const bPriority = priorityMap.get(b.player.id) ?? Infinity
    return aPriority - bPriority
  })
}

/**
 * Quick check if any Threat Phase rules need resolution
 * WHY: Allows UI to show/hide location rules section efficiently
 *
 * @param players - All players in the campaign
 * @param hexes - Map of all hexes by ID
 * @returns true if at least one player has an active location rule
 */
export function hasActiveRules(
  players: Player[],
  hexes: Record<string, Hex>
): boolean {
  return detectActiveThreatPhaseRules(players, hexes).length > 0
}
