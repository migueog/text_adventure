import type { Event, Player, RoundStatistics } from '@/types/campaign'

/**
 * WHY: Round statistics calculation utilities (Issue #31 - Phase 1)
 * Calculates on-demand statistics from event log and player history
 * for round summary display
 */

/**
 * WHY: Calculate complete round statistics from events and players
 * Aggregates all stats for a single round: hexes, battles, SP/CP changes, threat
 *
 * @param events - All game events
 * @param players - All players with history
 * @param roundNumber - Round to calculate stats for
 * @returns Complete statistics object
 */
export function calculateRoundStatistics(
  events: Event[],
  players: Player[],
  roundNumber: number
): RoundStatistics {
  // WHY: Filter events to this round only
  const roundEvents = events.filter(e => e.round === roundNumber)

  return {
    hexesExplored: countHexesExplored(roundEvents),
    battles: extractBattleStats(players, roundNumber),
    spChanges: calculateSPChanges(players, roundNumber),
    cpChanges: calculateCPChanges(players, roundNumber),
    threatChange: calculateThreatChange(roundEvents),
    majorEvents: getMajorEvents(roundEvents, roundNumber)
  }
}

/**
 * WHY: Count exploration events in round
 * Each exploration event represents one hex explored
 */
function countHexesExplored(roundEvents: Event[]): number {
  return roundEvents.filter(e => e.type === 'exploration').length
}

/**
 * WHY: Extract battle statistics from player battle history
 * Counts wins, losses, draws, and byes for specified round
 *
 * @param players - All players with battle history
 * @param roundNumber - Round to extract stats from
 * @returns Battle counts object
 */
export function extractBattleStats(
  players: Player[],
  roundNumber: number
): { wins: number; losses: number; draws: number; byes: number } {
  const stats = { wins: 0, losses: 0, draws: 0, byes: 0 }

  players.forEach(player => {
    const roundBattle = player.battleHistory.find(b => b.round === roundNumber)
    if (roundBattle) {
      if (roundBattle.result === 'WIN') stats.wins++
      else if (roundBattle.result === 'LOSS') stats.losses++
      else if (roundBattle.result === 'DRAW') stats.draws++
      else if (roundBattle.result === 'BYE') stats.byes++
    }
  })

  return stats
}

/**
 * WHY: Calculate SP changes for each player in round
 * Compares spBefore and spAfter from player history
 *
 * @param players - All players with history
 * @param roundNumber - Round to calculate changes for
 * @returns Map of playerId to SP delta
 */
export function calculateSPChanges(
  players: Player[],
  roundNumber: number
): Record<number, number> {
  const changes: Record<number, number> = {}

  players.forEach(player => {
    const roundHistory = player.history.filter(h => h.round === roundNumber)
    if (roundHistory.length > 0) {
      // WHY: Sum all SP changes in the round
      const firstEntry = roundHistory[0]!
      const lastEntry = roundHistory[roundHistory.length - 1]!
      changes[player.id] = lastEntry.spAfter - firstEntry.spBefore
    } else {
      // WHY: Include player with 0 change if no history for round
      changes[player.id] = 0
    }
  })

  return changes
}

/**
 * WHY: Calculate CP changes for each player in round
 * Compares cpBefore and cpAfter from player history
 *
 * @param players - All players with history
 * @param roundNumber - Round to calculate changes for
 * @returns Map of playerId to CP delta
 */
export function calculateCPChanges(
  players: Player[],
  roundNumber: number
): Record<number, number> {
  const changes: Record<number, number> = {}

  players.forEach(player => {
    const roundHistory = player.history.filter(h => h.round === roundNumber)
    if (roundHistory.length > 0) {
      // WHY: Sum all CP changes in the round
      const firstEntry = roundHistory[0]!
      const lastEntry = roundHistory[roundHistory.length - 1]!
      changes[player.id] = lastEntry.cpAfter - firstEntry.cpBefore
    } else {
      // WHY: Include player with 0 change if no history for round
      changes[player.id] = 0
    }
  })

  return changes
}

/**
 * WHY: Extract threat level change from events
 * Parses threat increase event to determine from/to values
 */
function calculateThreatChange(
  roundEvents: Event[]
): { from: number; to: number } {
  // WHY: Find threat increase event (should be at end of round)
  const threatEvent = roundEvents.find(e =>
    e.type === 'system' && e.message.includes('Threat')
  )

  if (threatEvent) {
    // WHY: Parse "Threat increased to X" message
    const match = threatEvent.message.match(/(\d+)/)
    if (match && match[1]) {
      const to = parseInt(match[1])
      return { from: to - 1, to }
    }
  }

  // WHY: Default to no change if event not found
  return { from: 1, to: 1 }
}

/**
 * WHY: Filter events to show only major occurrences
 * Includes exploration, battle, and reward events from specified round
 *
 * @param events - All events
 * @param roundNumber - Round to filter events from
 * @returns Array of major events from specified round
 */
export function getMajorEvents(
  events: Event[],
  roundNumber: number
): Event[] {
  const majorTypes: Event['type'][] = ['exploration', 'battle', 'reward']
  return events.filter(e =>
    e.round === roundNumber && majorTypes.includes(e.type)
  )
}
