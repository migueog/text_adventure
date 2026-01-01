import { rollD3, rollD6 } from './dice'
import type { Hex, Player } from '@/types/campaign'

/**
 * Initialize hex with intel count on exploration (Issue #59)
 * WHY: Intel Cache (SL31) gets D6 intel on first discovery
 */
export function initializeIntelHex(hex: Hex): Hex {
  const intelRoll = rollD6()

  return {
    ...hex,
    state: {
      ...hex.state,
      intelRemaining: intelRoll
    }
  }
}

/**
 * Gain intel from hex (up to remaining amount) (Issue #59)
 * WHY: SEARCH action can gain D3 intel (capped by remaining)
 */
export function gainIntel(
  hex: Hex,
  player: Player
): {
  intelGained: number
  remaining: number
  playerIntelCount: number
} {
  const currentRemaining = hex.state?.intelRemaining ?? 0

  if (currentRemaining === 0) {
    return {
      intelGained: 0,
      remaining: 0,
      playerIntelCount: player.intelCount ?? 0
    }
  }

  const roll = rollD3()
  const actualGain = Math.min(roll, currentRemaining)
  const newRemaining = currentRemaining - actualGain
  const newPlayerIntel = (player.intelCount ?? 0) + actualGain

  return {
    intelGained: actualGain,
    remaining: newRemaining,
    playerIntelCount: newPlayerIntel
  }
}

/**
 * Validate intel scout action (Issue #59)
 * WHY: Intel scouts must target surface hexes only
 */
export function canUseIntelScout(
  player: Player,
  targetHexId: string,
  hexes: Record<string, Hex>
): {
  canScout: boolean
  reason?: string
} {
  const playerIntel = player.intelCount ?? 0

  if (playerIntel < 1) {
    return {
      canScout: false,
      reason: 'No intel available (need 1)'
    }
  }

  const targetHex = hexes[targetHexId]

  if (!targetHex) {
    return {
      canScout: false,
      reason: 'Invalid target hex'
    }
  }

  if (targetHex.type !== 'surface') {
    return {
      canScout: false,
      reason: 'Intel scouts can only target surface hexes'
    }
  }

  return { canScout: true }
}
