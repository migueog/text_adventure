import type { Location, Condition } from '@/types/campaign'

/**
 * WHY: Validation result type for data integrity checks (Issue #58)
 * Returns validation status, errors, and missing D36 numbers
 */
export interface ValidationResult {
  valid: boolean
  errors?: string[]
  missingNumbers?: number[]
}

/**
 * WHY: Validate a single location's data structure (Issue #58)
 * Ensures repeatable locations have ranges, unique locations have single numbers
 */
export function validateLocationData(location: Partial<Location>): ValidationResult {
  const errors: string[] = []

  // WHY: Repeatable locations must have range format like "11-16"
  if (location.repeatable && typeof location.number !== 'string') {
    errors.push('Repeatable location must have number range (e.g., "11-16")')
  }

  // WHY: Unique and Special locations must have single number like 21
  if (
    (location.type === 'UNIQUE' || location.type === 'SPECIAL') &&
    !location.repeatable &&
    typeof location.number === 'string'
  ) {
    errors.push('Unique/Special location must have single number')
  }

  // WHY: ID format validation - must match SL11-16, SL21, TL11-16, or TL21 patterns
  if (location.id) {
    const idPattern = /^[ST][LC]\d{2}(-\d{2})?$/
    if (!idPattern.test(location.id)) {
      errors.push('Invalid ID format. Expected SL11-16 or SL21 or TL11-16 or TL21')
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * WHY: Parse number or range string to array of covered numbers
 * Converts "11-16" to [11, 12, 13, 14, 15, 16] or 21 to [21]
 */
function parseNumberCoverage(number: number | string | undefined): number[] {
  if (number === undefined) {
    return []
  }

  // WHY: Single number like 21
  if (typeof number === 'number') {
    return [number]
  }

  // WHY: Range like "11-16"
  if (typeof number === 'string' && number.includes('-')) {
    const [start, end] = number.split('-').map(Number)
    const range: number[] = []
    for (let i = start; i <= end; i++) {
      range.push(i)
    }
    return range
  }

  // WHY: String number like "21"
  if (typeof number === 'string') {
    const parsed = parseInt(number)
    return isNaN(parsed) ? [] : [parsed]
  }

  return []
}

/**
 * WHY: Validate that locations cover all D36 numbers without gaps
 * D36 = D3 (1-3) × 10 + D6 (1-6) = 11-16, 21-26, 31-36 (18 values total)
 */
export function validateLocationCoverage(
  locations: Partial<Location>[]
): ValidationResult {
  const covered = new Set<number>()

  // WHY: Build set of all covered numbers from all locations
  locations.forEach(loc => {
    const numbers = parseNumberCoverage(loc.number)
    numbers.forEach(n => covered.add(n))
  })

  // WHY: D36 system uses D3×10 + D6, giving: 11-16, 21-26, 31-36 (18 valid values)
  const expectedNumbers: number[] = []
  for (let tens = 1; tens <= 3; tens++) {
    for (let ones = 1; ones <= 6; ones++) {
      expectedNumbers.push(tens * 10 + ones)
    }
  }

  const missing = expectedNumbers.filter(n => !covered.has(n))

  return {
    valid: missing.length === 0,
    missingNumbers: missing.length > 0 ? missing : []
  }
}

/**
 * WHY: Validate that conditions cover all D36 numbers without gaps
 * D36 = D3 (1-3) × 10 + D6 (1-6) = 11-16, 21-26, 31-36 (18 values total)
 */
export function validateConditionCoverage(
  conditions: Partial<Condition>[]
): ValidationResult {
  const covered = new Set<number>()

  // WHY: Build set of all covered numbers from all conditions
  conditions.forEach(cond => {
    const numbers = parseNumberCoverage(cond.number)
    numbers.forEach(n => covered.add(n))
  })

  // WHY: D36 system uses D3×10 + D6, giving: 11-16, 21-26, 31-36 (18 valid values)
  const expectedNumbers: number[] = []
  for (let tens = 1; tens <= 3; tens++) {
    for (let ones = 1; ones <= 6; ones++) {
      expectedNumbers.push(tens * 10 + ones)
    }
  }

  const missing = expectedNumbers.filter(n => !covered.has(n))

  return {
    valid: missing.length === 0,
    missingNumbers: missing.length > 0 ? missing : []
  }
}
