import type { Hex } from '@/types/campaign'

/**
 * Configure portal network for Tomb Ruin (TL11) (Issue #59)
 * WHY: Player selects two hexes (1 tomb, 1 surface) as portal destinations
 * Portal travel costs 1 SP and allows instant movement to linked hexes
 */
export function configurePortalNetwork(
  portalHexId: string,
  tombDestination: string,
  surfaceDestination: string,
  hexes: Record<string, Hex>
): Record<string, Hex> {
  const portalHex = hexes[portalHexId]
  const tombHex = hexes[tombDestination]
  const surfaceHex = hexes[surfaceDestination]

  if (!portalHex) {
    throw new Error('Portal hex not found')
  }

  if (!tombHex) {
    throw new Error('Tomb destination hex not found')
  }

  if (!surfaceHex) {
    throw new Error('Surface destination hex not found')
  }

  if (tombHex.type !== 'tomb') {
    throw new Error('Tomb destination must be a tomb hex')
  }

  if (surfaceHex.type !== 'surface') {
    throw new Error('Surface destination must be a surface hex')
  }

  return {
    ...hexes,
    [portalHexId]: {
      ...portalHex,
      state: {
        ...portalHex.state,
        portalDestinations: {
          tomb: tombDestination,
          surface: surfaceDestination
        }
      }
    }
  }
}

/**
 * Check if portal travel is valid (Issue #59)
 * WHY: Portal movement requires configured destinations at source hex
 * Only allows travel to linked tomb or surface hexes
 */
export function canUsePortal(
  fromHexId: string,
  toHexId: string,
  hexes: Record<string, Hex>
): {
  canTravel: boolean
  reason?: string
} {
  const sourceHex = hexes[fromHexId]

  if (!sourceHex) {
    return { canTravel: false, reason: 'Source hex not found' }
  }

  const targetHex = hexes[toHexId]

  if (!targetHex) {
    return { canTravel: false, reason: 'Target hex not found' }
  }

  const portalDest = sourceHex.state?.portalDestinations

  if (!portalDest) {
    return { canTravel: false, reason: 'No portal configured at source hex' }
  }

  const isLinked = portalDest.tomb === toHexId || portalDest.surface === toHexId

  if (!isLinked) {
    return { canTravel: false, reason: 'Target hex is not linked to this portal' }
  }

  return { canTravel: true }
}

/**
 * Block/unblock tomb hex via Transtechnic Fulcrum (TL25) (Issue #59)
 * WHY: Fulcrum can block any tomb hex, changing its type to 'blocked'
 * Blocks only one hex at a time - unblocks previous selection when blocking new hex
 */
export function toggleHexBlocking(
  fulcrumHexId: string,
  targetHexId: string,
  hexes: Record<string, Hex>
): Record<string, Hex> {
  const fulcrumHex = hexes[fulcrumHexId]
  const targetHex = hexes[targetHexId]

  if (!fulcrumHex) {
    throw new Error('Fulcrum hex not found')
  }

  if (!targetHex) {
    throw new Error('Target hex not found')
  }

  if (fulcrumHexId === targetHexId) {
    throw new Error('Cannot block the fulcrum hex itself')
  }

  if (targetHex.type !== 'tomb' && targetHex.type !== 'blocked') {
    throw new Error('Can only block tomb hexes')
  }

  const updatedHexes = { ...hexes }

  // Unblock any hex previously blocked by this fulcrum
  for (const hexId in updatedHexes) {
    const hex = updatedHexes[hexId]!
    if (hex.state?.blockedByFulcrumId === fulcrumHexId && hexId !== targetHexId) {
      updatedHexes[hexId] = {
        ...hex,
        type: 'tomb',
        state: {
          ...hex.state,
          blockedByFulcrumId: undefined
        }
      }
    }
  }

  // Block the target hex
  updatedHexes[targetHexId] = {
    ...targetHex,
    type: 'blocked',
    state: {
      ...targetHex.state,
      blockedByFulcrumId: fulcrumHexId
    }
  }

  return updatedHexes
}
