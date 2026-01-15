/**
 * WHY: Issue #57 - Campaign snapshot creation for legacy continuation
 *
 * Builds a complete snapshot of campaign state when solo campaign ends.
 * Snapshot can be used to restore map for future legacy campaigns.
 */

import type { CampaignState, Player } from '@/types/campaign'
import type { CampaignSnapshot, HexSnapshot } from '@/types/legacyCampaign'
import { hexId } from './hexUtils'

/**
 * WHY: Create snapshot from current campaign state
 * Called when solo campaign ends (victory or defeat at threat 10)
 *
 * Extracts:
 * - Explored hexes with locations/conditions
 * - Map configuration
 * - Player information (narrative fields)
 * - Campaign results
 */
export function buildCampaignSnapshot(
  state: CampaignState,
  player: Player
): CampaignSnapshot {
  // WHY: Extract explored hexes with their discovered locations/conditions
  const exploredHexes: HexSnapshot[] = Object.values(state.hexes)
    .filter(hex => hex.explored)
    .map(hex => ({
      hexId: hex.id,
      row: hex.row,
      col: hex.col,
      // WHY: Explored hexes are never blocked, so cast to surface|tomb
      type: hex.type as 'surface' | 'tomb',
      locationNumber: hex.location,
      conditionNumber: hex.condition,
      locationId: hex.exploredLocation,
      conditionId: hex.exploredCondition,
      state: hex.state,
      // WHY: Track if hex was searched by this expedition
      searched: player.searchedHexes.includes(hex.id),
      // WHY: Track if hex was used for camping (not bases)
      camped: player.camps.some(camp =>
        hexId(camp.row, camp.col) === hex.id
      )
    }))

  return {
    campaignId: `campaign-${Date.now()}`,
    campaignName: state.mapConfig?.name || 'Solo Campaign',
    playerName: player.name,
    killTeamName: player.killTeamName,
    faction: player.faction,
    backstory: player.backstory,
    mapSize: {
      rows: state.mapConfig?.rows || 5,
      cols: state.mapConfig?.cols || 5
    },
    exploredHexes,
    finalCP: player.campaignPoints,
    finalThreat: state.threatLevel,
    rounds: state.currentRound,
    success: state.soloVictory ?? false,
    completedDate: new Date().toISOString(),
    targetThreatLevel: state.targetThreatLevel
  }
}
