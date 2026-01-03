import { describe, it, expect } from 'vitest'
import {
  narrateExploration,
  narrateBattle,
  narrateMovement,
  narrateThreat,
  enrichEvent
} from './narrativeTemplates'
import type { Event } from '@/types/campaign'

describe('narrativeTemplates', () => {
  describe('narrateExploration', () => {
    it('should generate narrative text with player name and location', () => {
      const result = narrateExploration('Test Team', 'Ancient Ruins', 'surface')

      expect(result).toContain('Test Team')
      expect(result).toContain('Ancient Ruins')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should generate different narratives for surface locations', () => {
      const results = new Set()

      // Generate multiple results to check variation
      for (let i = 0; i < 20; i++) {
        results.add(narrateExploration('Team Alpha', 'Barren Wastes', 'surface'))
      }

      // Should have more than 1 unique result (random variation)
      expect(results.size).toBeGreaterThan(1)
    })

    it('should generate different narratives for tomb locations', () => {
      const results = new Set()

      // Generate multiple results to check variation
      for (let i = 0; i < 20; i++) {
        results.add(narrateExploration('Team Beta', 'Stasis Chamber', 'tomb'))
      }

      // Should have more than 1 unique result (random variation)
      expect(results.size).toBeGreaterThan(1)
    })

    it('should handle location types correctly', () => {
      const surfaceNarrative = narrateExploration('Team', 'Surface Loc', 'surface')
      const tombNarrative = narrateExploration('Team', 'Tomb Loc', 'tomb')

      expect(surfaceNarrative).toContain('Team')
      expect(tombNarrative).toContain('Team')
      expect(surfaceNarrative).not.toBe(tombNarrative)
    })
  })

  describe('narrateBattle', () => {
    it('should generate victory narrative with player name', () => {
      const result = narrateBattle('Victors', 'Victory', 'Rival Team')

      expect(result).toContain('Victors')
      expect(result).toContain('Rival Team')
      expect(typeof result).toBe('string')
    })

    it('should generate defeat narrative', () => {
      const result = narrateBattle('Defeated Team', 'Defeat', 'Enemy Forces')

      expect(result).toContain('Defeated Team')
      expect(result).toContain('Enemy Forces')
    })

    it('should generate draw narrative', () => {
      const result = narrateBattle('Team One', 'Draw', 'Team Two')

      expect(result).toContain('Team One')
      expect(result).toContain('Team Two')
    })

    it('should use default opponent when not provided', () => {
      const result = narrateBattle('Solo Team', 'Victory')

      expect(result).toContain('Solo Team')
      expect(result).toContain('enemy')
    })

    it('should show random variation for victories', () => {
      const results = new Set()

      for (let i = 0; i < 20; i++) {
        results.add(narrateBattle('Winners', 'Victory', 'Losers'))
      }

      expect(results.size).toBeGreaterThan(1)
    })

    it('should show random variation for defeats', () => {
      const results = new Set()

      for (let i = 0; i < 20; i++) {
        results.add(narrateBattle('Team', 'Defeat', 'Opponent'))
      }

      expect(results.size).toBeGreaterThan(1)
    })
  })

  describe('narrateMovement', () => {
    it('should generate move action narrative', () => {
      const result = narrateMovement('Mobile Team', 'move', 'A3')

      expect(result).toContain('Mobile Team')
      expect(result).toContain('A3')
      expect(result).toContain('advanced')
    })

    it('should generate regroup action narrative', () => {
      const result = narrateMovement('Regrouping Team', 'regroup', 'B2')

      expect(result).toContain('Regrouping Team')
      expect(result).toContain('B2')
      expect(result).toContain('regroup')
    })

    it('should generate hold action narrative', () => {
      const result = narrateMovement('Defensive Team', 'hold', 'C4')

      expect(result).toContain('Defensive Team')
      expect(result).toContain('C4')
      expect(result).toContain('held')
    })

    it('should return different narratives for different actions', () => {
      const moveResult = narrateMovement('Team', 'move', 'A1')
      const regroupResult = narrateMovement('Team', 'regroup', 'A1')
      const holdResult = narrateMovement('Team', 'hold', 'A1')

      expect(moveResult).not.toBe(regroupResult)
      expect(regroupResult).not.toBe(holdResult)
      expect(moveResult).not.toBe(holdResult)
    })
  })

  describe('narrateThreat', () => {
    it('should generate threat narrative with reason and level', () => {
      const result = narrateThreat('tomb awakening detected', 5)

      expect(result).toContain('tomb awakening detected')
      expect(result).toContain('5')
      expect(typeof result).toBe('string')
    })

    it('should show random variation', () => {
      const results = new Set()

      for (let i = 0; i < 20; i++) {
        results.add(narrateThreat('test reason', 3))
      }

      expect(results.size).toBeGreaterThan(1)
    })

    it('should include threat level in output', () => {
      const level7 = narrateThreat('increase', 7)
      const level10 = narrateThreat('increase', 10)

      expect(level7).toContain('7')
      expect(level10).toContain('10')
    })
  })

  describe('enrichEvent', () => {
    it('should add narrative to an event', () => {
      const baseEvent: Event = {
        type: 'exploration',
        icon: '🔍',
        message: 'Explored hex A3',
        round: 1,
        phase: 'Action',
        timestamp: '12:00:00'
      }

      const enriched = enrichEvent(
        baseEvent,
        'Team discovered ancient ruins.',
        'exploration',
        { locationName: 'Ancient Ruins', playerNames: ['Team Alpha'] }
      )

      expect(enriched.narrative).toBeDefined()
      expect(enriched.narrative?.flavor).toBe('Team discovered ancient ruins.')
      expect(enriched.narrative?.category).toBe('exploration')
      expect(enriched.narrative?.isCustom).toBe(false)
      expect(enriched.narrative?.locationName).toBe('Ancient Ruins')
      expect(enriched.narrative?.playerNames).toEqual(['Team Alpha'])
    })

    it('should preserve original event properties', () => {
      const baseEvent: Event = {
        type: 'battle',
        icon: '⚔️',
        message: 'Battle occurred',
        round: 2,
        phase: 'Battle',
        timestamp: '13:00:00'
      }

      const enriched = enrichEvent(
        baseEvent,
        'Epic battle narrative',
        'combat'
      )

      expect(enriched.type).toBe('battle')
      expect(enriched.icon).toBe('⚔️')
      expect(enriched.message).toBe('Battle occurred')
      expect(enriched.round).toBe(2)
      expect(enriched.phase).toBe('Battle')
      expect(enriched.timestamp).toBe('13:00:00')
    })

    it('should work without optional context', () => {
      const baseEvent: Event = {
        type: 'system',
        icon: 'ℹ️',
        message: 'System event',
        round: 1,
        phase: 'Movement',
        timestamp: '14:00:00'
      }

      const enriched = enrichEvent(
        baseEvent,
        'Generic narrative',
        'milestone'
      )

      expect(enriched.narrative).toBeDefined()
      expect(enriched.narrative?.locationName).toBeUndefined()
      expect(enriched.narrative?.playerNames).toBeUndefined()
    })
  })
})
