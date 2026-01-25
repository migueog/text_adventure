import { describe, it, expect } from 'vitest'
import { hasHexChanged } from './hexChangeDetection'
import type { Hex } from '@/types/campaign'

describe('hexChangeDetection', () => {
  describe('Phase 2.1: hasHexChanged', () => {
    const baseHex: Hex = {
      id: '0,0',
      row: 0,
      col: 0,
      type: 'surface',
      explored: false,
      exploredBy: [],
      location: 0,
      condition: 0,
      state: {},
    }

    it('should return true when hex does not exist (new hex)', () => {
      const result = hasHexChanged(null, baseHex)

      // WHY: New hexes need to be drawn
      expect(result).toBe(true)
    })

    it('should return false for identical hexes', () => {
      const result = hasHexChanged(baseHex, baseHex)

      // WHY: No changes means no redraw needed
      expect(result).toBe(false)
    })

    it('should detect explored state change', () => {
      const newHex: Hex = { ...baseHex, explored: true }
      const result = hasHexChanged(baseHex, newHex)

      // WHY: Explored state changes hex appearance
      expect(result).toBe(true)
    })

    it('should detect location change', () => {
      const newHex: Hex = { ...baseHex, location: 11 }
      const result = hasHexChanged(baseHex, newHex)

      // WHY: Location affects hex display
      expect(result).toBe(true)
    })

    it('should detect condition change', () => {
      const newHex: Hex = { ...baseHex, condition: 21 }
      const result = hasHexChanged(baseHex, newHex)

      // WHY: Condition affects hex display
      expect(result).toBe(true)
    })

    it('should detect supplyCount state change', () => {
      const oldHex: Hex = { ...baseHex, state: { supplyCount: 3 } }
      const newHex: Hex = { ...baseHex, state: { supplyCount: 2 } }
      const result = hasHexChanged(oldHex, newHex)

      // WHY: Supply count affects location display
      expect(result).toBe(true)
    })

    it('should detect intelGained state change', () => {
      const oldHex: Hex = { ...baseHex, state: { intelGained: false } }
      const newHex: Hex = { ...baseHex, state: { intelGained: true } }
      const result = hasHexChanged(oldHex, newHex)

      // WHY: Intel state affects location availability
      expect(result).toBe(true)
    })

    it('should detect beastLairActive state change', () => {
      const oldHex: Hex = { ...baseHex, state: { beastLairActive: true } }
      const newHex: Hex = { ...baseHex, state: { beastLairActive: false } }
      const result = hasHexChanged(oldHex, newHex)

      // WHY: Beast lair state affects hex display
      expect(result).toBe(true)
    })

    it('should detect multiple simultaneous changes', () => {
      const newHex: Hex = {
        ...baseHex,
        explored: true,
        location: 21,
        condition: 31,
        state: { supplyCount: 5 },
      }
      const result = hasHexChanged(baseHex, newHex)

      expect(result).toBe(true)
    })

    it('should handle undefined vs empty state correctly', () => {
      const oldHex: Hex = { ...baseHex, state: undefined }
      const newHex: Hex = { ...baseHex, state: {} }
      const result = hasHexChanged(oldHex, newHex)

      // WHY: Empty/undefined states are equivalent, no redraw needed
      expect(result).toBe(false)
    })

    it('should detect when blockedByFulcrumId changes', () => {
      const oldHex: Hex = { ...baseHex, state: { blockedByFulcrumId: 'TL25-1' } }
      const newHex: Hex = { ...baseHex, state: { blockedByFulcrumId: undefined } }
      const result = hasHexChanged(oldHex, newHex)

      expect(result).toBe(true)
    })

    it('should return false when exploredBy changes (non-visual)', () => {
      const oldHex: Hex = { ...baseHex, exploredBy: [1] }
      const newHex: Hex = { ...baseHex, exploredBy: [1, 2] }
      const result = hasHexChanged(oldHex, newHex)

      // WHY: exploredBy doesn't affect visual rendering
      expect(result).toBe(false)
    })
  })
})
