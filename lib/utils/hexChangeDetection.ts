import type { Hex } from '@/types/campaign'

/**
 * Check if a hex has changed in ways that require redrawing
 * WHY: Selective rendering optimization - only redraw changed hexes
 * NOTE: Does not check for bases/camps - those are handled by player updates
 */
export function hasHexChanged(oldHex: Hex | null, newHex: Hex): boolean {
  if (!oldHex) return true

  // WHY: Check properties that affect visual rendering
  if (oldHex.explored !== newHex.explored) return true
  if (oldHex.location !== newHex.location) return true
  if (oldHex.condition !== newHex.condition) return true

  // WHY: Check if state changed (deep comparison of relevant state properties)
  const oldState = oldHex.state || {}
  const newState = newHex.state || {}

  // WHY: Compare state properties that affect rendering
  if (oldState.supplyCount !== newState.supplyCount) return true
  if (oldState.intelGained !== newState.intelGained) return true
  if (oldState.beastLairActive !== newState.beastLairActive) return true
  if (oldState.blockedByFulcrumId !== newState.blockedByFulcrumId) return true

  return false
}
