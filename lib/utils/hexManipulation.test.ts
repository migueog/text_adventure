import { describe, it, expect } from 'vitest'
import { configurePortalNetwork, canUsePortal, toggleHexBlocking } from './hexManipulation'
import type { Hex } from '@/types/campaign'

// Helper to create test hex
function createTestHex(
  id: string,
  type: Hex['type'],
  location: number,
  state?: Hex['state']
): Hex {
  return {
    id,
    row: parseInt(id.split(',')[0] ?? '0'),
    col: parseInt(id.split(',')[1] ?? '0'),
    type,
    location,
    condition: 0,
    explored: true,
    exploredBy: [],
    state
  }
}

describe('Portal Network (Issue #59 - Phase 4)', () => {
  describe('configurePortalNetwork', () => {
    it('should store tomb and surface destinations in portal hex', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 11),  // Portal hex (TL11 Tomb Ruin)
        '2,2': createTestHex('2,2', 'tomb', 12),  // Tomb destination
        '3,3': createTestHex('3,3', 'surface', 13)  // Surface destination
      }

      const result = configurePortalNetwork('1,1', '2,2', '3,3', hexes)

      expect(result['1,1']!.state?.portalDestinations).toEqual({
        tomb: '2,2',
        surface: '3,3'
      })
    })

    it('should validate tomb destination is tomb type', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 11),
        '2,2': createTestHex('2,2', 'surface', 12),  // WRONG TYPE
        '3,3': createTestHex('3,3', 'surface', 13)
      }

      expect(() => {
        configurePortalNetwork('1,1', '2,2', '3,3', hexes)
      }).toThrow('Tomb destination must be a tomb hex')
    })

    it('should validate surface destination is surface type', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 11),
        '2,2': createTestHex('2,2', 'tomb', 12),
        '3,3': createTestHex('3,3', 'tomb', 13)  // WRONG TYPE
      }

      expect(() => {
        configurePortalNetwork('1,1', '2,2', '3,3', hexes)
      }).toThrow('Surface destination must be a surface hex')
    })

    it('should preserve existing hex properties', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 11),
        '2,2': createTestHex('2,2', 'tomb', 12),
        '3,3': createTestHex('3,3', 'surface', 13)
      }
      hexes['1,1']!.state = { supplyCount: 5 }

      const result = configurePortalNetwork('1,1', '2,2', '3,3', hexes)

      expect(result['1,1']!.state?.supplyCount).toBe(5)
      expect(result['1,1']!.location).toBe(11)
      expect(result['1,1']!.type).toBe('tomb')
    })

    it('should reject invalid portal hex', () => {
      const hexes: Record<string, Hex> = {
        '2,2': createTestHex('2,2', 'tomb', 12),
        '3,3': createTestHex('3,3', 'surface', 13)
      }

      expect(() => {
        configurePortalNetwork('9,9', '2,2', '3,3', hexes)
      }).toThrow('Portal hex not found')
    })

    it('should reject invalid tomb destination hex', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 11),
        '3,3': createTestHex('3,3', 'surface', 13)
      }

      expect(() => {
        configurePortalNetwork('1,1', '9,9', '3,3', hexes)
      }).toThrow('Tomb destination hex not found')
    })

    it('should reject invalid surface destination hex', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 11),
        '2,2': createTestHex('2,2', 'tomb', 12)
      }

      expect(() => {
        configurePortalNetwork('1,1', '2,2', '9,9', hexes)
      }).toThrow('Surface destination hex not found')
    })

    it('should update existing portal configuration', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 11, {
          portalDestinations: { tomb: '4,4', surface: '5,5' }
        }),
        '2,2': createTestHex('2,2', 'tomb', 12),
        '3,3': createTestHex('3,3', 'surface', 13)
      }

      const result = configurePortalNetwork('1,1', '2,2', '3,3', hexes)

      expect(result['1,1']!.state?.portalDestinations).toEqual({
        tomb: '2,2',
        surface: '3,3'
      })
    })
  })

  describe('canUsePortal', () => {
    it('should allow movement to tomb destination from portal', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 11, {
          portalDestinations: { tomb: '2,2', surface: '3,3' }
        }),
        '2,2': createTestHex('2,2', 'tomb', 12)
      }

      const result = canUsePortal('1,1', '2,2', hexes)

      expect(result.canTravel).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should allow movement to surface destination from portal', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 11, {
          portalDestinations: { tomb: '2,2', surface: '3,3' }
        }),
        '3,3': createTestHex('3,3', 'surface', 13)
      }

      const result = canUsePortal('1,1', '3,3', hexes)

      expect(result.canTravel).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should prevent movement to unlinked hex', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 11, {
          portalDestinations: { tomb: '2,2', surface: '3,3' }
        }),
        '4,4': createTestHex('4,4', 'tomb', 14)
      }

      const result = canUsePortal('1,1', '4,4', hexes)

      expect(result.canTravel).toBe(false)
      expect(result.reason).toBe('Target hex is not linked to this portal')
    })

    it('should prevent movement when no portal at source', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 11),  // No portal configured
        '2,2': createTestHex('2,2', 'tomb', 12)
      }

      const result = canUsePortal('1,1', '2,2', hexes)

      expect(result.canTravel).toBe(false)
      expect(result.reason).toBe('No portal configured at source hex')
    })

    it('should prevent movement when source hex does not exist', () => {
      const hexes: Record<string, Hex> = {
        '2,2': createTestHex('2,2', 'tomb', 12)
      }

      const result = canUsePortal('9,9', '2,2', hexes)

      expect(result.canTravel).toBe(false)
      expect(result.reason).toBe('Source hex not found')
    })

    it('should prevent movement when target hex does not exist', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 11, {
          portalDestinations: { tomb: '2,2', surface: '3,3' }
        })
      }

      const result = canUsePortal('1,1', '9,9', hexes)

      expect(result.canTravel).toBe(false)
      expect(result.reason).toBe('Target hex not found')
    })
  })
})

describe('Hex Blocking - Transtechnic Fulcrum (Issue #59 - Phase 4)', () => {
  describe('toggleHexBlocking', () => {
    it('should block a tomb hex', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 25),  // Transtechnic Fulcrum (TL25)
        '2,2': createTestHex('2,2', 'tomb', 12)   // Target to block
      }

      const result = toggleHexBlocking('1,1', '2,2', hexes)

      expect(result['2,2']!.state?.blockedByFulcrumId).toBe('1,1')
      expect(result['2,2']!.type).toBe('blocked')
    })

    it('should unblock previously blocked hex when blocking new hex', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 25),
        '2,2': createTestHex('2,2', 'blocked', 12, { blockedByFulcrumId: '1,1' }),
        '3,3': createTestHex('3,3', 'tomb', 13)
      }

      const result = toggleHexBlocking('1,1', '3,3', hexes)

      // Old hex should be unblocked
      expect(result['2,2']!.state?.blockedByFulcrumId).toBeUndefined()
      expect(result['2,2']!.type).toBe('tomb')

      // New hex should be blocked
      expect(result['3,3']!.state?.blockedByFulcrumId).toBe('1,1')
      expect(result['3,3']!.type).toBe('blocked')
    })

    it('should only block tomb hexes', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 25),
        '2,2': createTestHex('2,2', 'surface', 12)
      }

      expect(() => {
        toggleHexBlocking('1,1', '2,2', hexes)
      }).toThrow('Can only block tomb hexes')
    })

    it('should preserve other hex state properties', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 25),
        '2,2': createTestHex('2,2', 'tomb', 12, { supplyCount: 5 })
      }

      const result = toggleHexBlocking('1,1', '2,2', hexes)

      expect(result['2,2']!.state?.supplyCount).toBe(5)
      expect(result['2,2']!.state?.blockedByFulcrumId).toBe('1,1')
    })

    it('should reject invalid fulcrum hex', () => {
      const hexes: Record<string, Hex> = {
        '2,2': createTestHex('2,2', 'tomb', 12)
      }

      expect(() => {
        toggleHexBlocking('9,9', '2,2', hexes)
      }).toThrow('Fulcrum hex not found')
    })

    it('should reject invalid target hex', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 25)
      }

      expect(() => {
        toggleHexBlocking('1,1', '9,9', hexes)
      }).toThrow('Target hex not found')
    })

    it('should prevent blocking the fulcrum hex itself', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 25)
      }

      expect(() => {
        toggleHexBlocking('1,1', '1,1', hexes)
      }).toThrow('Cannot block the fulcrum hex itself')
    })

    it('should track which fulcrum blocked which hex', () => {
      const hexes: Record<string, Hex> = {
        '1,1': createTestHex('1,1', 'tomb', 25),  // First fulcrum
        '2,2': createTestHex('2,2', 'tomb', 12),
        '3,3': createTestHex('3,3', 'tomb', 25),  // Second fulcrum
        '4,4': createTestHex('4,4', 'tomb', 14)   // Target for second fulcrum
      }

      const result1 = toggleHexBlocking('1,1', '2,2', hexes)
      expect(result1['2,2']!.state?.blockedByFulcrumId).toBe('1,1')

      // Different fulcrum should not unblock hex blocked by first fulcrum
      const result2 = toggleHexBlocking('3,3', '4,4', result1)
      expect(result2['2,2']!.state?.blockedByFulcrumId).toBe('1,1')
      expect(result2['2,2']!.type).toBe('blocked')
    })
  })
})
