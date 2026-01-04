/**
 * WHY: Solo mode threat check utilities (Issue #54)
 *
 * Pure functions for calculating threat increases in solo/co-op mode.
 * All functions use dice rolls and return structured results for UI display.
 */

import type { ThreatCheckResult, ResupplyReductionResult, SoloThreatTrigger, Player, Hex, BattleResult } from '@/types/campaign'
import { rollD6, rollD3 } from './dice'

/**
 * Check if tomb exploration should trigger threat increase
 * WHY: Non-Scout tomb explorations have 50% chance (4+ on D6)
 *
 * @returns ThreatCheckResult with D6 roll and 4+ threshold
 */
export function checkTombExplorationThreat(): ThreatCheckResult {
  const roll = rollD6()
  const threshold = 4
  const success = roll >= threshold

  return {
    trigger: 'TOMB_EXPLORATION',
    triggerName: 'Tomb Exploration',
    roll,
    threshold,
    success,
    increase: success ? 1 : 0,
    preventable: false,
    prevented: false,
    description: success
      ? `Tomb exploration rolled ${roll} (4+) - threat increases by 1`
      : `Tomb exploration rolled ${roll} (4+) - no threat increase`
  }
}

/**
 * Check if battle completion should trigger threat increase
 * WHY: Win = 67% chance (3+), Loss/Draw = 33% chance (5+)
 *
 * @param result - Battle result (WIN, LOSS, DRAW, BYE)
 * @returns ThreatCheckResult with appropriate threshold
 */
export function checkBattleThreat(result: BattleResult): ThreatCheckResult {
  // WHY: BYE results don't trigger threat checks
  if (result === 'BYE') {
    return {
      trigger: 'BATTLE_WIN',
      triggerName: 'Battle (BYE)',
      roll: 0,
      threshold: undefined,
      success: false,
      increase: 0,
      preventable: false,
      prevented: false,
      description: 'BYE - no threat check'
    }
  }

  const isWin = result === 'WIN'
  const trigger: SoloThreatTrigger = isWin ? 'BATTLE_WIN' : 'BATTLE_LOSS_DRAW'
  const triggerName = isWin ? 'Battle Win' : 'Battle Loss/Draw'
  const threshold = isWin ? 3 : 5
  const roll = rollD6()
  const success = roll >= threshold

  return {
    trigger,
    triggerName,
    roll,
    threshold,
    success,
    increase: success ? 1 : 0,
    preventable: false,
    prevented: false,
    description: success
      ? `${triggerName} rolled ${roll} (${threshold}+) - threat increases by 1`
      : `${triggerName} rolled ${roll} (${threshold}+) - no threat increase`
  }
}

/**
 * Check if search action should trigger threat increase
 * WHY: 33% chance (5+ on D6), preventable with 1 SP
 *
 * @returns ThreatCheckResult with D6 roll and 5+ threshold
 */
export function checkSearchThreat(): ThreatCheckResult {
  const roll = rollD6()
  const threshold = 5
  const success = roll >= threshold

  return {
    trigger: 'SEARCH_ACTION',
    triggerName: 'Search Action',
    roll,
    threshold,
    success,
    increase: success ? 1 : 0,
    preventable: true,  // Can spend 1 SP to prevent
    prevented: false,
    description: success
      ? `Search rolled ${roll} (5+) - threat will increase by 1 (can prevent with 1 SP)`
      : `Search rolled ${roll} (5+) - no threat increase`
  }
}

/**
 * Execute Trophy Hall (TL24) demolish threat
 * WHY: Automatic D3 threat increase, not preventable
 *
 * @returns ThreatCheckResult with D3 roll
 */
export function executeTrophyHallThreat(): ThreatCheckResult {
  const roll = rollD3()

  return {
    trigger: 'TROPHY_HALL_DEMOLISH',
    triggerName: 'Trophy Hall Demolish',
    roll,
    threshold: undefined,  // Automatic
    success: true,
    increase: roll,
    preventable: false,
    prevented: false,
    description: `Trophy Hall demolished - threat increases by ${roll} (D3)`
  }
}

/**
 * Execute Void Shield Generator (TL35) search threat
 * WHY: Automatic D3 threat increase, not preventable
 *
 * @returns ThreatCheckResult with D3 roll
 */
export function executeVoidShieldThreat(): ThreatCheckResult {
  const roll = rollD3()

  return {
    trigger: 'VOID_SHIELD_SEARCH',
    triggerName: 'Void Shield Generator Search',
    roll,
    threshold: undefined,  // Automatic
    success: true,
    increase: roll,
    preventable: false,
    prevented: false,
    description: `Void Shield Generator searched - threat increases by ${roll} (D3)`
  }
}

/**
 * Calculate available resupply threat reduction
 * WHY: Max 3 uses per campaign, D3 at base/camp, 1 elsewhere
 *
 * @param player - Current player
 * @param hex - Current hex location
 * @param usesRemaining - Number of uses remaining (0-3)
 * @returns ResupplyReductionResult or null if not available
 */
export function calculateResupplyReduction(
  player: Player,
  hex: Hex,
  usesRemaining: number
): ResupplyReductionResult | null {
  // WHY: No reduction if all 3 uses exhausted
  if (usesRemaining <= 0) {
    return null
  }

  // WHY: Determine location type for reduction amount
  const isBase = hex.type === 'surface' && hex.location === 0  // SL00 = location 0
  const isCamp = player.camps.some(camp => camp.row === hex.row && camp.col === hex.col)

  let location: 'base' | 'camp' | 'other'
  let reductionAmount: number | 'D3'

  if (isBase) {
    location = 'base'
    reductionAmount = 'D3'
  } else if (isCamp) {
    location = 'camp'
    reductionAmount = 'D3'
  } else {
    location = 'other'
    reductionAmount = 1
  }

  return {
    available: true,
    usesRemaining,
    reductionAmount,
    location
  }
}

/**
 * Execute resupply threat reduction
 * WHY: Roll D3 if at base/camp, return fixed 1 otherwise
 *
 * @param result - ResupplyReductionResult from calculateResupplyReduction
 * @returns Actual reduction amount (1-3)
 */
export function executeResupplyReduction(result: ResupplyReductionResult): number {
  if (result.reductionAmount === 'D3') {
    return rollD3()
  }
  return result.reductionAmount
}

/**
 * Check if hex is Trophy Hall (TL24)
 * WHY: Need to identify for demolish threat trigger
 *
 * @param hex - Hex to check
 * @returns true if Trophy Hall
 */
export function isTrophyHall(hex: Hex): boolean {
  return hex.location === 24  // TL24 = location 24
}

/**
 * Check if hex is Void Shield Generator (TL35)
 * WHY: Need to identify for search threat trigger
 *
 * @param hex - Hex to check
 * @returns true if Void Shield Generator
 */
export function isVoidShieldGenerator(hex: Hex): boolean {
  return hex.location === 35  // TL35 = location 35
}
