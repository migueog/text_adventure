import { rollD3 } from './dice'
import type { Player, Hex, SearchRule, SearchResult } from '@/types/campaign'
import { SURFACE_LOCATIONS, TOMB_LOCATIONS } from '@/lib/data/campaignData'

/**
 * WHY: Resolve search rule and calculate rewards
 * Handles d3, d3+1, and fixed values for SP/CP
 */
export function resolveSearchRule(
  searchRule: SearchRule | null | undefined
): SearchResult | null {
  if (!searchRule) return null

  switch (searchRule.type) {
    case 'sp':
      return resolveSPRule(searchRule.amount)
    case 'cp':
      return resolveCPRule(searchRule.amount)
    case 'both':
      return resolveBothRule(searchRule.sp, searchRule.cp)
  }
}

/**
 * WHY: Helper for SP-only rules
 * Handles d3 (1-3), d3+1 (2-4), and fixed amounts
 */
function resolveSPRule(amount: 'd3' | 'd3+1' | number): SearchResult {
  if (amount === 'd3') {
    const roll = rollD3()
    return {
      success: true,
      spGained: roll,
      cpGained: 0,
      description: `Found ${roll} SP`,
      roll
    }
  }
  if (amount === 'd3+1') {
    const roll = rollD3()
    const total = roll + 1
    return {
      success: true,
      spGained: total,
      cpGained: 0,
      description: `Found ${total} SP (D3+1)`,
      roll
    }
  }
  // WHY: Fixed amount, no roll needed
  return {
    success: true,
    spGained: amount,
    cpGained: 0,
    description: `Found ${amount} SP`
  }
}

/**
 * WHY: Helper for CP-only rules
 * Always fixed amounts, no dice rolls
 */
function resolveCPRule(amount: number): SearchResult {
  return {
    success: true,
    spGained: 0,
    cpGained: amount,
    description: `Found ${amount} CP`
  }
}

/**
 * WHY: Helper for combined SP+CP rules
 * SP can be d3, d3+1, or fixed; CP is always fixed
 */
function resolveBothRule(
  sp: 'd3' | 'd3+1' | number,
  cp: number
): SearchResult {
  const spResult = resolveSPRule(sp)
  return {
    success: true,
    spGained: spResult.spGained,
    cpGained: cp,
    description: `Found ${spResult.spGained} SP and ${cp} CP`,
    roll: spResult.roll
  }
}

/**
 * WHY: Validate if player can perform search action
 * Checks: SP >= 1, hex not already searched, searchRule exists
 */
export function canPerformSearch(
  player: Player,
  hex: Hex,
  hexKey: string
): { canSearch: boolean; reason?: string } {
  // WHY: Search costs 1 SP
  if (player.supplyPoints < 1) {
    return { canSearch: false, reason: 'Insufficient SP (need 1)' }
  }

  // WHY: One-time use - check if already searched
  if (player.searchedHexes.includes(hexKey)) {
    return { canSearch: false, reason: 'Already searched this hex' }
  }

  // WHY: Get location searchRule
  const location = hex.type === 'surface'
    ? SURFACE_LOCATIONS[hex.location]
    : TOMB_LOCATIONS[hex.location]

  if (!location?.searchRule) {
    return { canSearch: false, reason: 'Nothing to search here' }
  }

  return { canSearch: true }
}
