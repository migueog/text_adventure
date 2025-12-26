import type { Hex, Player } from '@/types/campaign'

/**
 * Calculate total number of explored hexes across the campaign
 */
export function calculateTotalHexesExplored(hexMap: Record<string, Hex>): number {
  return Object.values(hexMap).filter(hex => hex.explored).length
}

/**
 * Calculate total number of battles fought by all players
 */
export function calculateTotalBattles(players: Player[]): number {
  return players.reduce((total, player) => total + player.gamesPlayed, 0)
}

/**
 * Generate narrative summary based on victory category
 * Why: Adds flavor text to celebrate the winner's achievement
 */
export function generateNarrativeSummary(winner: Player, category: string): string {
  const name = winner.name
  const team = winner.killTeamName

  const narratives: Record<string, string> = {
    Warlord: `Through countless battles, ${name} and the ${team} have proven their tactical superiority, securing victory after victory in the depths of Ctesiphus.`,
    Explorer: `By mapping the unknown territories of the tomb, ${name} and the ${team} have uncovered secrets that will be remembered for generations.`,
    Headhunter: `With ruthless precision, ${name} and the ${team} have eliminated their enemies, leaving a trail of fallen operatives in their wake.`,
    Pioneer: `Through careful resource management, ${name} and the ${team} have maintained their strength, emerging from the expedition fully prepared for future battles.`,
    Trooper: `By engaging in more battles than any other team, ${name} and the ${team} have demonstrated unwavering courage in the face of constant danger.`
  }

  return narratives[category] || `${name} and the ${team} have emerged victorious from the Ctesiphus Expedition.`
}
