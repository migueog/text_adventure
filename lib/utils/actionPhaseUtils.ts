import type { Player } from '@/types/campaign'

/**
 * Calculate Action Phase turn order based on battle results
 * WHY: Official rules state Winners → Draws → Losses, with priority tiebreaking within each group
 *
 * @param players - Array of players with battleResult field
 * @param determinePriority - Priority calculation function (lowest CP → SP)
 * @returns Array of player indices in action order
 */
export function calculateActionPhaseOrder(
  players: Player[],
  determinePriority: (players: Player[]) => Player[]
): number[] {
  // WHY: Group players by battle result (Winners, Draws, Losses)
  const winners = players.filter(p => p.battleResult === 'WIN')
  const draws = players.filter(p =>
    p.battleResult === 'DRAW' || p.battleResult === 'BYE' || p.battleResult === null
  )
  const losses = players.filter(p => p.battleResult === 'LOSS')

  // WHY: Apply priority within each group (lowest CP → SP)
  const winnersOrdered = determinePriority(winners)
  const drawsOrdered = determinePriority(draws)
  const lossesOrdered = determinePriority(losses)

  // WHY: Concatenate in rule-specified order and return player IDs
  return [
    ...winnersOrdered.map(p => p.id),
    ...drawsOrdered.map(p => p.id),
    ...lossesOrdered.map(p => p.id)
  ]
}
