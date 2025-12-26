// Priority determination utilities for campaign gameplay

import type { Player } from '@/types/campaign'

/**
 * Determine player priority based on official rules:
 * 1. Lowest Campaign Points (CP)
 * 2. If tied, lowest Supply Points (SP)
 * 3. If still tied, maintain order (requires roll-off in game)
 *
 * Returns players sorted by priority with priority values assigned
 */
export function determinePriority(players: Player[]): Player[] {
  if (players.length === 0) return []
  if (players.length === 1) {
    return [{ ...players[0]!, priority: 1 }]
  }

  // Sort by CP (ascending), then SP (ascending)
  const sorted = [...players].sort((a, b) => {
    if (a.campaignPoints !== b.campaignPoints) {
      return a.campaignPoints - b.campaignPoints
    }
    return a.supplyPoints - b.supplyPoints
  })

  // Assign priority values (1-based, tied players get same priority)
  const withPriority: Player[] = []
  let currentPriority = 1

  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i]!
    const prevPlayer = sorted[i - 1]

    // Check if tied with previous player
    if (i > 0 && prevPlayer &&
        player.campaignPoints === prevPlayer.campaignPoints &&
        player.supplyPoints === prevPlayer.supplyPoints) {
      // Same priority as previous
      withPriority.push({ ...player, priority: currentPriority })
    } else {
      // New priority level
      if (i > 0) {
        currentPriority = i + 1
      }
      withPriority.push({ ...player, priority: currentPriority })
    }
  }

  return withPriority
}

/**
 * Check if players need a roll-off to determine priority
 * Returns true if multiple players are tied for lowest CP and SP
 */
export function needsRollOff(players: Player[]): boolean {
  if (players.length < 2) return false

  // Find the lowest CP
  const lowestCP = Math.min(...players.map(p => p.campaignPoints))

  // Get all players with lowest CP
  const playersWithLowestCP = players.filter(p => p.campaignPoints === lowestCP)

  if (playersWithLowestCP.length < 2) return false

  // Find lowest SP among those with lowest CP
  const lowestSP = Math.min(...playersWithLowestCP.map(p => p.supplyPoints))

  // Count how many have both lowest CP and lowest SP
  const tiedPlayers = playersWithLowestCP.filter(p => p.supplyPoints === lowestSP)

  return tiedPlayers.length >= 2
}
