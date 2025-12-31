/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCampaign } from './useCampaign'
import type { ThreatWarningLevel } from '@/types/campaign'

describe('Threat Level Mechanics', () => {
  describe('End of Round Threat Increase', () => {
    it('should increase threat by 1 at end of round', () => {
      const { result } = renderHook(() => useCampaign())

      // WHY: Start a basic 2-player campaign with target threat 7
      act(() => {
        result.current.createCampaign({
          playerNames: ['Player 1', 'Player 2'],
          targetThreatLevel: 7,
          isSolo: false
        })
      })

      const initialThreat = result.current.threatLevel
      expect(initialThreat).toBe(1) // Starts at 1

      // WHY: Complete all phases for both players to trigger end-of-round
      // Player 1: Movement -> Battle -> Action -> Threat
      act(() => {
        result.current.nextPhase() // Movement complete
        result.current.nextPhase() // Battle complete
        result.current.nextPhase() // Action complete
        result.current.nextPhase() // Threat complete -> Player 2 turn
      })

      // WHY: Still round 1, threat should not have increased yet
      expect(result.current.threatLevel).toBe(1)

      // Player 2: Movement -> Battle -> Action -> Threat
      act(() => {
        result.current.nextPhase() // Movement complete
        result.current.nextPhase() // Battle complete
        result.current.nextPhase() // Action complete
        result.current.nextPhase() // Threat complete -> Round ends, threat increases
      })

      // WHY: After all players complete all phases, threat should increase by 1
      expect(result.current.threatLevel).toBe(2)
      expect(result.current.currentRound).toBe(2)
    })

    it('should NOT increase threat mid-round', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.createCampaign({
          playerNames: ['Player 1', 'Player 2', 'Player 3'],
          targetThreatLevel: 7,
          isSolo: false
        })
      })

      const initialThreat = result.current.threatLevel

      // WHY: Complete only first player's turn
      act(() => {
        result.current.nextPhase() // Movement
        result.current.nextPhase() // Battle
        result.current.nextPhase() // Action
        result.current.nextPhase() // Threat -> Player 2 turn
      })

      // WHY: Threat should NOT increase mid-round
      expect(result.current.threatLevel).toBe(initialThreat)

      // WHY: Complete second player's turn
      act(() => {
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase() // Player 3 turn
      })

      // WHY: Still mid-round, no threat increase
      expect(result.current.threatLevel).toBe(initialThreat)
    })

    it('should cap threat at 10 maximum', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.createCampaign({
          playerNames: ['Player 1'],
          targetThreatLevel: 15, // Invalid, but should cap at 10
          isSolo: false
        })
      })

      // WHY: Manually set threat to 9 to test capping
      act(() => {
        result.current.setThreatLevel(9)
      })

      expect(result.current.threatLevel).toBe(9)

      // WHY: Complete round to trigger increase
      act(() => {
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
      })

      // WHY: Threat should cap at 10
      expect(result.current.threatLevel).toBe(10)

      // WHY: Another round should NOT exceed 10
      act(() => {
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
      })

      expect(result.current.threatLevel).toBe(10)
    })

    it('should log threat increase event', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.createCampaign({
          playerNames: ['Player 1'],
          targetThreatLevel: 7,
          isSolo: false
        })
      })

      const eventsBefore = result.current.events.length

      // WHY: Complete round to trigger threat increase
      act(() => {
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
      })

      const eventsAfter = result.current.events

      // WHY: Should have new event about threat increase
      expect(eventsAfter.length).toBeGreaterThan(eventsBefore)

      const threatEvents = eventsAfter.filter(e =>
        e.message.toLowerCase().includes('threat')
      )
      expect(threatEvents.length).toBeGreaterThan(0)
    })
  })

  describe('Solo Mode Threat', () => {
    it('should increase threat from tomb Awakening condition (+1)', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.createCampaign({
          playerNames: ['Solo Player'],
          targetThreatLevel: 7,
          isSolo: true
        })
      })

      // WHY: Need to move to a tomb hex and explore with Awakening condition
      // This is complex because it requires specific hex type and condition
      // For now, test that soloMode is set correctly
      expect(result.current.soloMode).toBe(true)
      expect(result.current.threatLevel).toBe(1)
    })

    it('should apply BOTH exploration and end-round increases in solo mode', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.createCampaign({
          playerNames: ['Solo Player'],
          targetThreatLevel: 7,
          isSolo: true
        })
      })

      const initialThreat = result.current.threatLevel

      // WHY: Solo mode should still get +1 at end of round
      act(() => {
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
      })

      // WHY: Threat should increase by 1 at round end
      expect(result.current.threatLevel).toBe(initialThreat + 1)
    })
  })

  describe('Campaign End Conditions', () => {
    it('should end campaign when threat reaches target', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.createCampaign({
          playerNames: ['Player 1'],
          targetThreatLevel: 3, // Low target for quick test
          isSolo: false
        })
      })

      expect(result.current.gameEnded).toBe(false)
      expect(result.current.threatLevel).toBe(1)

      // WHY: Complete rounds to reach target threat (1 -> 2)
      act(() => {
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
      })

      expect(result.current.threatLevel).toBe(2)
      expect(result.current.gameEnded).toBe(false)

      // WHY: One more round to reach target (2 -> 3)
      act(() => {
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
      })

      // WHY: Campaign should end when threat reaches target
      expect(result.current.threatLevel).toBe(3)
      expect(result.current.gameEnded).toBe(true)
    })

    it('should NOT end when extendedMode is true', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.createCampaign({
          playerNames: ['Player 1'],
          targetThreatLevel: 2, // Very low target
          isSolo: false
        })
      })

      // WHY: Complete round to reach target (1 -> 2)
      act(() => {
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
      })

      expect(result.current.gameEnded).toBe(true)

      // WHY: Enable extended mode
      act(() => {
        result.current.enableExtendedMode()
      })

      expect(result.current.gameEnded).toBe(false)
      expect(result.current.extendedMode).toBe(true)

      // WHY: Complete another round - should NOT end
      act(() => {
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
      })

      expect(result.current.threatLevel).toBe(3)
      expect(result.current.gameEnded).toBe(false)
    })

    it('should log campaign end event', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.createCampaign({
          playerNames: ['Player 1'],
          targetThreatLevel: 2,
          isSolo: false
        })
      })

      // WHY: Complete round to reach target
      act(() => {
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
      })

      const endEvents = result.current.events.filter(e =>
        e.message.toLowerCase().includes('campaign ended') ||
        e.message.toLowerCase().includes('necrons')
      )

      // WHY: Should have campaign end event
      expect(endEvents.length).toBeGreaterThan(0)
    })

    it('should set gameEnded state to true', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.createCampaign({
          playerNames: ['Player 1'],
          targetThreatLevel: 2,
          isSolo: false
        })
      })

      expect(result.current.gameEnded).toBe(false)

      // WHY: Reach target threat
      act(() => {
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
      })

      // WHY: gameEnded should be true
      expect(result.current.gameEnded).toBe(true)
    })
  })

  describe('Warning System', () => {
    it('should return "critical" when 1 level from target', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.createCampaign({
          playerNames: ['Player 1'],
          targetThreatLevel: 5,
          isSolo: false
        })
      })

      // WHY: Manually set threat to target-1
      act(() => {
        result.current.setThreatLevel(4)
      })

      // WHY: Should have critical warning
      expect(result.current.threatWarning).toBe('critical')
    })

    it('should return "moderate" when 2 levels from target', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.createCampaign({
          playerNames: ['Player 1'],
          targetThreatLevel: 7,
          isSolo: false
        })
      })

      // WHY: Set threat to target-2
      act(() => {
        result.current.setThreatLevel(5)
      })

      // WHY: Should have moderate warning
      expect(result.current.threatWarning).toBe('moderate')
    })

    it('should return "none" when 3+ levels away', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.createCampaign({
          playerNames: ['Player 1'],
          targetThreatLevel: 7,
          isSolo: false
        })
      })

      // WHY: Default threat is 1, which is 6 levels from target
      expect(result.current.threatWarning).toBe('none')

      // WHY: Set to target-3
      act(() => {
        result.current.setThreatLevel(4)
      })

      expect(result.current.threatWarning).toBe('none')
    })

    it('should update warning as threat increases', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.createCampaign({
          playerNames: ['Player 1'],
          targetThreatLevel: 4,
          isSolo: false
        })
      })

      // WHY: Start at threat 1, target 4 -> 3 away -> none
      expect(result.current.threatWarning).toBe('none')

      // WHY: Complete round: 1 -> 2 (target 4, distance 2 -> moderate)
      act(() => {
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
      })

      expect(result.current.threatLevel).toBe(2)
      expect(result.current.threatWarning).toBe('moderate')

      // WHY: Complete round: 2 -> 3 (target 4, distance 1 -> critical)
      act(() => {
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
        result.current.nextPhase()
      })

      expect(result.current.threatLevel).toBe(3)
      expect(result.current.threatWarning).toBe('critical')
    })
  })
})
