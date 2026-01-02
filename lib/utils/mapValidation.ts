import type {
  Hex,
  Player,
  MapValidationError,
  MapValidationResult
} from '@/types/campaign'

/**
 * WHY: Validate complete map state for integrity issues (Issue #23 - Phase 1)
 */
export function validateMapState(
  hexes: Record<string, Hex>,
  players: Player[]
): MapValidationResult {
  const allErrors = collectAllErrors(hexes, players)
  const errors = allErrors.filter(e => e.severity === 'error')
  const warnings = allErrors.filter(e => e.severity === 'warning')

  return {
    valid: allErrors.length === 0,
    errors,
    warnings,
    timestamp: new Date().toISOString()
  }
}

/**
 * WHY: Collect all validation errors from all validators
 */
function collectAllErrors(
  hexes: Record<string, Hex>,
  players: Player[]
): MapValidationError[] {
  return [
    ...validateBases(hexes, players),
    ...validateCamps(hexes, players),
    ...validateExploredBy(hexes, players),
    ...validatePortals(hexes),
    ...validateBeastLairs(hexes),
    ...validateIntelCaches(hexes)
  ]
}

/**
 * WHY: Check for overlapping bases at hexes
 */
function validateBases(
  hexes: Record<string, Hex>,
  players: Player[]
): MapValidationError[] {
  return validateStructureOverlaps(
    players,
    p => p.bases,
    'OVERLAPPING_BASE',
    'base',
    'One or more players should move their base to a different hex'
  )
}

/**
 * WHY: Generic validator for overlapping structures (bases/camps)
 */
function validateStructureOverlaps(
  players: Player[],
  getPositions: (player: Player) => Array<{ row: number; col: number }>,
  errorType: 'OVERLAPPING_BASE' | 'OVERLAPPING_CAMP',
  structureName: string,
  suggestedFix: string
): MapValidationError[] {
  const counts = buildPositionCounts(players, getPositions)
  const errors: MapValidationError[] = []

  counts.forEach((playerIds, hexId) => {
    if (playerIds.length > 1) {
      errors.push({
        type: errorType,
        hexId,
        severity: 'error',
        message: `Multiple ${structureName}s at hex ${hexId}`,
        affectedPlayerIds: playerIds,
        suggestedFix
      })
    }
  })

  return errors
}

/**
 * WHY: Build map of hexId -> player IDs at that position
 */
function buildPositionCounts(
  players: Player[],
  getPositions: (player: Player) => Array<{ row: number; col: number }>
): Map<string, number[]> {
  const counts = new Map<string, number[]>()

  players.forEach(player => {
    getPositions(player).forEach(pos => {
      const hexId = `${pos.row},${pos.col}`
      if (!counts.has(hexId)) counts.set(hexId, [])
      counts.get(hexId)!.push(player.id)
    })
  })

  return counts
}

/**
 * WHY: Check for overlapping camps at hexes
 */
function validateCamps(
  hexes: Record<string, Hex>,
  players: Player[]
): MapValidationError[] {
  return validateStructureOverlaps(
    players,
    p => p.camps,
    'OVERLAPPING_CAMP',
    'camp',
    'One or more players should move their camp or demolish it'
  )
}

/**
 * WHY: Validate exploredBy arrays contain only valid player IDs
 */
function validateExploredBy(
  hexes: Record<string, Hex>,
  players: Player[]
): MapValidationError[] {
  const validIds = new Set(players.map(p => p.id))

  return Object.values(hexes)
    .map(hex => {
      const invalidIds = hex.exploredBy.filter(id => !validIds.has(id))
      return invalidIds.length > 0
        ? {
            type: 'INVALID_PLAYER_ID' as const,
            hexId: hex.id,
            severity: 'warning' as const,
            message: `Hex ${hex.id} exploredBy contains invalid player ID(s): ${invalidIds.join(', ')}`,
            suggestedFix: 'Remove invalid player IDs from exploredBy array'
          }
        : null
    })
    .filter((e): e is MapValidationError => e !== null)
}

/**
 * WHY: Validate portal destinations exist
 */
function validatePortals(hexes: Record<string, Hex>): MapValidationError[] {
  return Object.values(hexes)
    .map(hex => {
      const dest = hex.state?.portalDestination
      return dest && !hexes[dest]
        ? {
            type: 'BROKEN_PORTAL' as const,
            hexId: hex.id,
            severity: 'error' as const,
            message: `Hex ${hex.id} has portal to non-existent hex ${dest}`,
            suggestedFix: `Remove portal or create hex ${dest}`
          }
        : null
    })
    .filter((e): e is MapValidationError => e !== null)
}

/**
 * WHY: Validate Beast Lair is only at TL23 locations
 */
function validateBeastLairs(hexes: Record<string, Hex>): MapValidationError[] {
  return Object.values(hexes)
    .map(hex => {
      const isActive = hex.state?.beastLairActive === true
      return isActive && hex.location !== 23
        ? {
            type: 'BEAST_LAIR_VIOLATION' as const,
            hexId: hex.id,
            severity: 'error' as const,
            message: `Beast Lair active at hex ${hex.id} but location is ${hex.location} (should be 23)`,
            suggestedFix: 'Deactivate Beast Lair or verify location is TL23'
          }
        : null
    })
    .filter((e): e is MapValidationError => e !== null)
}

/**
 * WHY: Validate Intel Cache counts don't exceed D6 maximum
 */
function validateIntelCaches(hexes: Record<string, Hex>): MapValidationError[] {
  const MAX_INTEL = 6

  return Object.values(hexes)
    .map(hex => {
      const intel = hex.state?.intelRemaining
      return intel !== undefined && intel > MAX_INTEL
        ? {
            type: 'INTEL_OVERFLOW' as const,
            hexId: hex.id,
            severity: 'warning' as const,
            message: `Hex ${hex.id} has ${intel} intel remaining (max is ${MAX_INTEL} from D6 roll)`,
            suggestedFix: `Reduce intelRemaining to ${MAX_INTEL} or less`
          }
        : null
    })
    .filter((e): e is MapValidationError => e !== null)
}
