import type { Player, Hex } from '@/types/campaign'
import { rollD6 } from './dice'
import { hexDistance, hexId } from './hexUtils'

/**
 * WHY: Threat Phase attack utilities for Beast Lair and Released Prisoner (Issue #59)
 * Functions kept under 20 lines per requirement
 */

/**
 * Find players within range of Beast Lair on surface hexes
 * WHY: Beast only attacks surface players within 2 hexes
 */
export function findPlayersInBeastRange(
  beastHexId: string,
  players: Player[],
  hexes: Record<string, Hex>
): Player[] {
  const beastHex = hexes[beastHexId]
  if (!beastHex) return []

  return players.filter(player => {
    const playerHexId = hexId(player.position.row, player.position.col)
    const playerHex = hexes[playerHexId]

    // WHY: Only attack surface players
    if (playerHex?.type !== 'surface') return false

    // WHY: Check distance (2 hex max range)
    const distance = hexDistance(beastHex.row, beastHex.col, player.position.row, player.position.col)
    return distance <= 2
  })
}

/**
 * Resolve Beast Lair attack with roll-off for multiple targets
 * WHY: Single target = D6+distance roll (5+ safe), Multiple = roll-off (lowest attacked)
 */
export function resolveBeastAttack(
  playersInRange: Player[],
  beastHexId: string,
  hexes: Record<string, Hex>
): { targetPlayerId: number; damage: number; roll: number } {
  if (playersInRange.length === 0) {
    return { targetPlayerId: -1, damage: 0, roll: 0 }
  }

  const beastHex = hexes[beastHexId]
  if (!beastHex) return { targetPlayerId: -1, damage: 0, roll: 0 }

  if (playersInRange.length === 1) {
    // WHY: Single target - roll D6 + distance, attacked if < 5
    const player = playersInRange[0]!
    const distance = hexDistance(beastHex.row, beastHex.col, player.position.row, player.position.col)
    const roll = rollD6() + distance

    if (roll < 5) {
      const damage = rollD6()
      return { targetPlayerId: player.id, damage, roll }
    }
    return { targetPlayerId: -1, damage: 0, roll }
  }

  // WHY: Multiple targets - roll-off with distance bonuses
  const rolls = playersInRange.map(player => {
    const distance = hexDistance(beastHex.row, beastHex.col, player.position.row, player.position.col)
    const roll = rollD6() + distance
    return { player, roll }
  })

  // WHY: Lowest roll gets attacked
  rolls.sort((a, b) => a.roll - b.roll)
  const loser = rolls[0]!
  const damage = rollD6()

  return { targetPlayerId: loser.player.id, damage, roll: loser.roll }
}

/**
 * Determine valid hexes for Released Prisoner movement
 * WHY: Can move up to D3 hexes from current position, excluding blocked hexes
 */
export function getValidPrisonerMoves(
  currentHexId: string,
  distance: number,
  hexes: Record<string, Hex>
): string[] {
  const currentHex = hexes[currentHexId]
  if (!currentHex) return []

  return Object.values(hexes)
    .filter(hex => {
      // WHY: Exclude blocked hexes
      if (hex.type === 'blocked') return false

      // WHY: Check if within movement distance
      const hexDist = hexDistance(currentHex.row, currentHex.col, hex.row, hex.col)
      return hexDist > 0 && hexDist <= distance
    })
    .map(hex => hex.id)
}

/**
 * Resolve Released Prisoner attack in hex (if not Transeptum Maze)
 * WHY: Attacks all players except controller, removes camps, D6 damage, 4+ removal
 */
export function resolvePrisonerAttack(
  targetHexId: string,
  controllingPlayerId: number,
  players: Player[],
  hexes: Record<string, Hex>
): {
  playersAttacked: Array<{ playerId: number; damage: number }>
  campsRemoved: string[]
  prisonerRemoved: boolean
} {
  const targetHex = hexes[targetHexId]

  // WHY: Transeptum Maze (TL22) is safe - no attacks
  if (targetHex?.location === 22) {
    return { playersAttacked: [], campsRemoved: [], prisonerRemoved: false }
  }

  const playersInHex = players.filter(p => {
    const pHexId = hexId(p.position.row, p.position.col)
    return pHexId === targetHexId && p.id !== controllingPlayerId
  })

  // WHY: Attack each player (except controller) and remove their camps
  const playersAttacked = playersInHex.map(p => ({
    playerId: p.id,
    damage: rollD6()
  }))

  const campsRemoved = playersInHex
    .flatMap(p => p.camps)
    .filter(camp => hexId(camp.row, camp.col) === targetHexId)
    .map(camp => hexId(camp.row, camp.col))

  // WHY: If anything was removed, roll for prisoner removal (4+ on D6)
  const removedAnything = playersAttacked.length > 0 || campsRemoved.length > 0
  const prisonerRemoved = removedAnything && rollD6() >= 4

  return { playersAttacked, campsRemoved, prisonerRemoved }
}
