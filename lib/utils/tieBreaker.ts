import type { Player, TieBreakerCriterion, TieBreakerResult } from '@/types/campaign'

// WHY: Issue #51 - Define the 4 tie-breaking criteria in strict priority order
// Returns criteria array for consistent application across all victory categories
export function getTieBreakerCriteria(): TieBreakerCriterion[] {
  return [
    {
      name: 'Most Campaign Points',
      getter: (player: Player) => player.campaignPoints
    },
    {
      name: 'Most Games Won',
      getter: (player: Player) => player.gamesWon
    },
    {
      name: 'Most Supply Points Spent',
      getter: (player: Player) => player.supplyPointsSpent ?? 0  // WHY: Fallback for legacy saves
    },
    {
      name: 'Most Hexes Explored',
      getter: (player: Player) => player.exploredHexes
    }
  ]
}

// WHY: Issue #51 - Check if multiple players are tied for maximum stat value
// Returns true if 2+ players share the highest value
export function detectTie(players: Player[], statGetter: (p: Player) => number): boolean {
  if (players.length <= 1) return false

  const values = players.map(statGetter)
  const maxValue = Math.max(...values)
  const playersAtMax = values.filter(v => v === maxValue).length

  return playersAtMax > 1
}

// WHY: Issue #51 - Extract all players tied at the maximum stat value
// Used to identify which players need tie-breaking
export function getTiedPlayers(players: Player[], statGetter: (p: Player) => number): Player[] {
  if (players.length === 0) return []

  const maxValue = Math.max(...players.map(statGetter))
  return players.filter(p => statGetter(p) === maxValue)
}

// WHY: Issue #51 - Apply a single tie-breaker criterion to filter players
// Returns players with maximum value for the criterion (may still be tied)
export function applyCriterion(
  players: Player[],
  criterion: TieBreakerCriterion
): Player[] {
  if (players.length === 0) return []

  const maxValue = Math.max(...players.map(criterion.getter))
  return players.filter(p => criterion.getter(p) === maxValue)
}

// WHY: Issue #51 - Main tie-breaking algorithm with 4-tier cascade
// Applies criteria sequentially until single winner or ultimate tie (shared victory)
export function resolveTie(
  players: Player[],
  primaryStatGetter: (p: Player) => number
): TieBreakerResult {
  // WHY: No tie if single player
  if (players.length <= 1) {
    return {
      winners: players,
      tieBreaker: null,
      eliminatedPlayers: []
    }
  }

  // WHY: Get all players tied at maximum primary stat value
  const tiedPlayers = getTiedPlayers(players, primaryStatGetter)

  // WHY: No tie if only one player at max
  if (tiedPlayers.length === 1) {
    return {
      winners: tiedPlayers,
      tieBreaker: null,
      eliminatedPlayers: []
    }
  }

  // WHY: Apply tie-breaking criteria sequentially
  const criteria = getTieBreakerCriteria()
  let candidates = [...tiedPlayers]
  const allEliminated: Player[] = []

  for (const criterion of criteria) {
    // WHY: Skip criterion if it matches primary stat (avoid circular logic)
    const primaryValues = candidates.map(primaryStatGetter)
    const criterionValues = candidates.map(criterion.getter)
    const isCircular = primaryValues.every((pv, i) => pv === criterionValues[i])

    if (isCircular) {
      continue
    }

    // WHY: Apply criterion and track eliminated players
    const beforeCount = candidates.length
    candidates = applyCriterion(candidates, criterion)

    // WHY: Record eliminated players for UI display
    const eliminated = tiedPlayers.filter(p => !candidates.includes(p) && !allEliminated.includes(p))
    allEliminated.push(...eliminated)

    // WHY: Single winner found - return with tie-breaker name
    if (candidates.length === 1) {
      return {
        winners: candidates,
        tieBreaker: criterion.name,
        eliminatedPlayers: allEliminated
      }
    }

    // WHY: Some eliminated but still tied - continue to next criterion
    if (beforeCount > candidates.length) {
      continue
    }
  }

  // WHY: Ultimate tie - all criteria exhausted, award is shared
  return {
    winners: candidates,
    tieBreaker: null,
    eliminatedPlayers: allEliminated
  }
}
