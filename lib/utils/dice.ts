// Dice rolling utilities for Kill Team campaign

/**
 * Roll a D3 (1-3)
 */
export function rollD3(): number {
  return Math.floor(Math.random() * 3) + 1
}

/**
 * Roll a D6 (1-6)
 */
export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1
}

/**
 * Roll a D36 (11-36) - D3 for tens + D6 for units
 */
export function rollD36(): number {
  const tens = rollD3()
  const units = rollD6()
  return tens * 10 + units
}

/**
 * Roll 2D6 and return sum
 */
export function roll2D6(): number {
  return rollD6() + rollD6()
}

/**
 * Parse and roll dice notation like "D3", "D6", "2D6", "D3+1", etc.
 */
export function rollDice(notation: string): number {
  const match = notation.match(/^(\d*)D(\d+)([+-]\d+)?$/i)
  if (!match) return 0

  const count = parseInt(match[1] || '') || 1
  const sides = parseInt(match[2] || '')
  const modifier = parseInt(match[3] || '') || 0

  let total = 0
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1
  }
  return total + modifier
}

/**
 * Parse a value that might be a number or dice notation
 */
export function parseValue(value: number | string): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    if (value.includes('D')) {
      return rollDice(value)
    }
    return parseInt(value) || 0
  }
  return 0
}

/**
 * Roll result with breakdown for display
 */
export interface RollBreakdown {
  total: number
  rolls: number[]
  modifier: number
  notation: string
}

/**
 * Roll dice and get detailed breakdown
 */
export function rollWithBreakdown(notation: string): RollBreakdown {
  const match = notation.match(/^(\d*)D(\d+)([+-]\d+)?$/i)
  if (!match) return { total: 0, rolls: [], modifier: 0, notation }

  const count = parseInt(match[1] || '') || 1
  const sides = parseInt(match[2] || '')
  const modifier = parseInt(match[3] || '') || 0

  const rolls: number[] = []
  let total = 0
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1
    rolls.push(roll)
    total += roll
  }

  return {
    total: total + modifier,
    rolls,
    modifier,
    notation,
  }
}
