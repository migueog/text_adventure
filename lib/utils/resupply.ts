import { rollD3 } from './dice'
import type { Player, Hex } from '@/types/campaign'

/**
 * WHY: Result of resupply calculation with details for UI display
 */
export interface ResupplyResult {
  amount: number
  type: 'base' | 'camp' | 'blocked' | 'other'
  guaranteed: boolean
  roll?: number  // WHY: D3 roll value for camps (1-3)
}

/**
 * WHY: Calculate resupply amount based on location type
 * Official rules:
 * - Base: 10 SP (fills to max)
 * - Camp: D3+3 SP (4-6 range)
 * - Blocked: 0 SP
 * - Other: 1 SP
 */
export function calculateResupply(
  player: Player,
  hex: Hex
): ResupplyResult {
  // WHY: Priority order - blocked takes precedence over all
  if (hex.type === 'blocked') {
    return {
      amount: 0,
      type: 'blocked',
      guaranteed: true
    }
  }

  // WHY: Check if player is at their own base
  const isAtBase = player.bases.some(
    base => base.row === player.position.row && base.col === player.position.col
  )

  if (isAtBase) {
    return {
      amount: 10,
      type: 'base',
      guaranteed: true
    }
  }

  // WHY: Check if player is at their own camp
  const isAtCamp = player.camps.some(
    camp => camp.row === player.position.row && camp.col === player.position.col
  )

  if (isAtCamp) {
    const roll = rollD3()
    return {
      amount: roll + 3,
      type: 'camp',
      guaranteed: false,
      roll
    }
  }

  // WHY: Any other hex grants 1 SP
  return {
    amount: 1,
    type: 'other',
    guaranteed: true
  }
}
