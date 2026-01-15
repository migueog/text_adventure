/**
 * WHY: Issue #57 - Legacy map restoration for campaign continuation
 *
 * Restores hex grid from campaign snapshot and converts old base to Abandoned Camp.
 */

import type { CampaignSnapshot } from '@/types/legacyCampaign'
import type { Hex, HexPosition } from '@/types/campaign'
import { hexId } from './hexUtils'
import { rollD6 } from './dice'

/**
 * WHY: Restore hex grid from snapshot with old base converted to Abandoned Camp
 * Returns complete hex grid for new campaign with legacy exploration intact
 *
 * @param snapshot - Previous campaign snapshot
 * @param newBaseHex - Selected hex for new base
 * @param abandonedCampCondition - D36 roll for condition at old base
 * @returns Restored hex grid with explored hexes from legacy campaign
 */
export function restoreLegacyHexGrid(
  snapshot: CampaignSnapshot,
  _newBaseHex: HexPosition,
  _abandonedCampCondition: number
): Record<string, Hex> {
  const hexes: Record<string, Hex> = {}

  // WHY: Create full hex grid for new campaign
  for (let row = 0; row < snapshot.mapSize.rows; row++) {
    for (let col = 0; col < snapshot.mapSize.cols; col++) {
      const id = hexId(row, col)

      // WHY: Check if hex was explored in previous campaign
      const legacyHex = snapshot.exploredHexes.find(
        h => h.hexId === id
      )

      if (legacyHex) {
        // WHY: Restore explored hex with legacy data
        hexes[id] = {
          id,
          row,
          col,
          type: legacyHex.type,
          explored: true,
          location: legacyHex.locationNumber,
          condition: legacyHex.conditionNumber,
          exploredBy: [1],  // WHY: New player ID (always 1 in solo)
          exploredLocation: legacyHex.locationId,
          exploredCondition: legacyHex.conditionId,
          state: legacyHex.state
        }
      } else {
        // WHY: Create unexplored hex for positions not explored in legacy campaign
        hexes[id] = {
          id,
          row,
          col,
          // WHY: Determine type from row position (first half = surface)
          type: row < snapshot.mapSize.rows / 2 ? 'surface' : 'tomb',
          explored: false,
          location: 0,
          condition: 0,
          exploredBy: []
        }
      }
    }
  }

  return hexes
}

/**
 * WHY: Convert previous base hex to Abandoned Camp (SL25)
 * Mutates the hexes object in place
 *
 * @param hexes - Hex grid to modify
 * @param oldBaseHex - Position of old base from previous campaign
 * @param conditionRoll - D36 roll for new condition at old base
 */
export function convertBaseToAbandonedCamp(
  hexes: Record<string, Hex>,
  oldBaseHex: HexPosition,
  conditionRoll: number
): void {
  const oldBaseId = hexId(oldBaseHex.row, oldBaseHex.col)
  const hex = hexes[oldBaseId]

  if (!hex) return

  // WHY: Change location to Abandoned Camp (SL25)
  hex.location = 25  // D36 result for Abandoned Camp
  hex.condition = conditionRoll  // New D36 roll for condition
  hex.explored = true
  hex.exploredLocation = 'SL25'
  // Don't set exploredCondition - use conditionRoll directly

  // WHY: Initialize Abandoned Camp state (D6 supplies)
  const supplies = rollD6()
  hex.state = {
    supplyCount: supplies
  }
}
