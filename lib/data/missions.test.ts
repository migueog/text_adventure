/**
 * @vitest-environment jsdom
 * WHY: Test suite for mission data and randomizer (Issue #34)
 */

import { describe, it, expect, vi } from 'vitest'
import {
  KILL_TEAM_MISSIONS,
  getRandomMission,
  getMissionsByCategory
} from './missions'
import type { Mission } from '@/types/battle'

describe('Mission Data', () => {
  describe('KILL_TEAM_MISSIONS', () => {
    it('should have 16 missions total', () => {
      // WHY: 4 categories x 4 missions each = 16
      expect(KILL_TEAM_MISSIONS).toHaveLength(16)
    })

    it('should have 4 missions per category', () => {
      const categories = ['Incursion', 'Infiltrate', 'Recon', 'Seek and Destroy'] as const

      categories.forEach(category => {
        const missions = KILL_TEAM_MISSIONS.filter(m => m.category === category)
        expect(missions).toHaveLength(4)
      })
    })

    it('should have unique IDs for all missions', () => {
      const ids = KILL_TEAM_MISSIONS.map(m => m.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(KILL_TEAM_MISSIONS.length)
    })

    it('should have unique names for all missions', () => {
      const names = KILL_TEAM_MISSIONS.map(m => m.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(KILL_TEAM_MISSIONS.length)
    })

    it('should have all required properties for each mission', () => {
      KILL_TEAM_MISSIONS.forEach(mission => {
        expect(mission.id).toBeDefined()
        expect(mission.id).not.toBe('')
        expect(mission.name).toBeDefined()
        expect(mission.name).not.toBe('')
        expect(mission.category).toBeDefined()
        expect(['Incursion', 'Infiltrate', 'Recon', 'Seek and Destroy']).toContain(
          mission.category
        )
      })
    })
  })

  describe('getRandomMission', () => {
    it('should return a valid mission', () => {
      const mission = getRandomMission()

      expect(mission).toBeDefined()
      expect(mission.id).toBeDefined()
      expect(mission.name).toBeDefined()
      expect(mission.category).toBeDefined()
    })

    it('should return a mission from the list', () => {
      const mission = getRandomMission()

      const found = KILL_TEAM_MISSIONS.find(m => m.id === mission.id)
      expect(found).toBeDefined()
    })

    it('should return different missions over multiple calls', () => {
      // WHY: Randomizer should not always return the same mission
      const missions = new Set<string>()

      // Run 50 times to get variety
      for (let i = 0; i < 50; i++) {
        const mission = getRandomMission()
        missions.add(mission.id)
      }

      // Should have gotten at least a few different missions
      expect(missions.size).toBeGreaterThan(1)
    })

    it('should use Math.random for selection', () => {
      // WHY: Verify randomization mechanism
      const mockRandom = vi.spyOn(Math, 'random')
      mockRandom.mockReturnValue(0.5)

      const mission = getRandomMission()

      expect(mockRandom).toHaveBeenCalled()
      expect(mission).toBeDefined()

      mockRandom.mockRestore()
    })
  })

  describe('getMissionsByCategory', () => {
    it('should return only Incursion missions', () => {
      const missions = getMissionsByCategory('Incursion')

      expect(missions).toHaveLength(4)
      missions.forEach(m => {
        expect(m.category).toBe('Incursion')
      })
    })

    it('should return only Infiltrate missions', () => {
      const missions = getMissionsByCategory('Infiltrate')

      expect(missions).toHaveLength(4)
      missions.forEach(m => {
        expect(m.category).toBe('Infiltrate')
      })
    })

    it('should return only Recon missions', () => {
      const missions = getMissionsByCategory('Recon')

      expect(missions).toHaveLength(4)
      missions.forEach(m => {
        expect(m.category).toBe('Recon')
      })
    })

    it('should return only Seek and Destroy missions', () => {
      const missions = getMissionsByCategory('Seek and Destroy')

      expect(missions).toHaveLength(4)
      missions.forEach(m => {
        expect(m.category).toBe('Seek and Destroy')
      })
    })

    it('should return new array (not mutate original)', () => {
      const missions = getMissionsByCategory('Incursion')

      expect(missions).not.toBe(KILL_TEAM_MISSIONS)
      // Modifying result should not affect original
      missions.push({} as Mission)
      expect(KILL_TEAM_MISSIONS).toHaveLength(16)
    })
  })
})
