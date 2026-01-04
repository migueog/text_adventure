/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCampaign } from './useCampaign'

/**
 * WHY: Issue #55 - Solo Victory Condition Tests
 *
 * Tests for the 10 CP goal victory condition in solo mode.
 * Campaign success requires reaching 10+ CP when threat level reaches target.
 */

describe('Solo Victory Condition (Issue #55)', () => {
  describe('Victory determination', () => {
    it('should set soloVictory=true when CP >= 10 at threat 10', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        // Setup solo campaign (1 player, solo mode)
        result.current.setPlayerCount(1)
        result.current.setTargetThreatLevel(10)
        result.current.startGame(1, true) // numPlayers, isSolo
        result.current.setShowRoundSummary(false) // WHY: Disable round summary modal for tests
      })

      // Earn 12 CP
      act(() => {
        result.current.updatePlayer(0, { campaignPoints: 12 })
      })

      // Set threat to 10 (campaign end threshold)
      act(() => {
        result.current.setThreatLevel(10)
      })

      // Advance through phases to trigger end-of-round check
      // Start: Movement phase → Battle → Action → Threat → New Round (checks threat >= 10)
      act(() => {
        result.current.nextPhase() // Battle
        result.current.nextPhase() // Action
        result.current.nextPhase() // Threat
        result.current.nextPhase() // New round - triggers campaign end check
      })

      // Should trigger victory
      expect(result.current.soloVictory).toBe(true)
      expect(result.current.gameEnded).toBe(true)
    })

    it('should set soloVictory=false when CP < 10 at threat 10', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        // Setup solo campaign (1 player, solo mode)
        result.current.setPlayerCount(1)
        result.current.setTargetThreatLevel(10)
        result.current.startGame(1, true) // numPlayers, isSolo
        result.current.setShowRoundSummary(false) // WHY: Disable round summary modal for tests
      })

      // Earn only 7 CP
      act(() => {
        result.current.updatePlayer(0, { campaignPoints: 7 })
        result.current.setThreatLevel(10)
      })

      // Advance through phases to trigger campaign end
      act(() => {
        result.current.nextPhase() // Battle
        result.current.nextPhase() // Action
        result.current.nextPhase() // Threat
        result.current.nextPhase() // New round - triggers campaign end check
      })

      // Should trigger failure
      expect(result.current.soloVictory).toBe(false)
      expect(result.current.gameEnded).toBe(true)
    })

    // TODO: Fix battle recording in competitive mode tests
    it.skip('should not set soloVictory in competitive mode', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        // Setup competitive campaign (1 player for simplicity - focus is on testing non-solo mode)
        result.current.setPlayerCount(1)
        result.current.setTargetThreatLevel(7)
        result.current.startGame(1, false) // numPlayers=1, isSolo=false (competitive mode)
        result.current.setShowRoundSummary(false) // WHY: Disable round summary modal for tests
      })

      // Set threat to 6 (will auto-increment to 7 at end of round in competitive mode)
      act(() => {
        result.current.setThreatLevel(6)
      })

      // Advance through phases to trigger campaign end
      act(() => {
        result.current.nextPhase() // Battle
        result.current.recordBattle({ winner: 0, gamesWon: 1, gamesPlayed: 1, operativesKilled: 0 })
        result.current.nextPhase() // Action
        result.current.nextPhase() // Threat
        result.current.nextPhase() // End of round - threat increments to 7, triggers campaign end
      })

      // Should NOT set soloVictory (competitive mode)
      expect(result.current.soloVictory).toBeUndefined()
      expect(result.current.gameEnded).toBe(true)
    })

    it('should add success event log when CP >= 10', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.setPlayerCount(1)
        result.current.setTargetThreatLevel(10)
        result.current.startGame(1, true) // numPlayers, isSolo
        result.current.setShowRoundSummary(false) // WHY: Disable round summary modal for tests
      })

      act(() => {
        result.current.updatePlayer(0, { campaignPoints: 11 })
        result.current.setThreatLevel(10)
      })

      act(() => {
        result.current.nextPhase() // Battle
        result.current.nextPhase() // Action
        result.current.nextPhase() // Threat
        result.current.nextPhase() // New round - triggers campaign end
      })

      // Check for success message in event log
      const hasSuccessMessage = result.current.eventLog.some(
        event => event.message.includes('CAMPAIGN SUCCESS') && event.message.includes('11 CP')
      )
      expect(hasSuccessMessage).toBe(true)
    })

    it('should add failure event log when CP < 10', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.setPlayerCount(1)
        result.current.setTargetThreatLevel(10)
        result.current.startGame(1, true) // numPlayers, isSolo
        result.current.setShowRoundSummary(false) // WHY: Disable round summary modal for tests
      })

      act(() => {
        result.current.updatePlayer(0, { campaignPoints: 5 })
        result.current.setThreatLevel(10)
      })

      act(() => {
        result.current.nextPhase() // Battle
        result.current.nextPhase() // Action
        result.current.nextPhase() // Threat
        result.current.nextPhase() // New round - triggers campaign end
      })

      // Check for failure message in event log
      const hasFailureMessage = result.current.eventLog.some(
        event => event.message.includes('CAMPAIGN FAILED') && event.message.includes('5 CP')
      )
      expect(hasFailureMessage).toBe(true)
    })
  })

  describe('Progress warnings', () => {
    it('should warn at threat 8 when CP < 8', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.setPlayerCount(1)
        result.current.startGame(1, true) // numPlayers, isSolo
        result.current.setShowRoundSummary(false) // WHY: Disable round summary modal for tests
      })

      act(() => {
        result.current.updatePlayer(0, { campaignPoints: 6 })
        result.current.setThreatLevel(7)
      })

      // Increase threat to 8
      act(() => {
        result.current.increaseThreat(1, 'Test trigger')
      })

      // Check for warning message
      const hasWarning = result.current.eventLog.some(
        event => event.message.includes('WARNING') && event.message.includes('~2 rounds')
      )
      expect(hasWarning).toBe(true)
    })

    it('should warn critically at threat 9 when CP < 10', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.setPlayerCount(1)
        result.current.startGame(1, true) // numPlayers, isSolo
        result.current.setShowRoundSummary(false) // WHY: Disable round summary modal for tests
      })

      act(() => {
        result.current.updatePlayer(0, { campaignPoints: 8 })
        result.current.setThreatLevel(8)
      })

      // Increase threat to 9
      act(() => {
        result.current.increaseThreat(1, 'Test trigger')
      })

      // Check for critical warning
      const hasCriticalWarning = result.current.eventLog.some(
        event => event.message.includes('CRITICAL') && event.message.includes('next round')
      )
      expect(hasCriticalWarning).toBe(true)
    })

    it('should celebrate at threat 9 when CP >= 10', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.setPlayerCount(1)
        result.current.startGame(1, true) // numPlayers, isSolo
        result.current.setShowRoundSummary(false) // WHY: Disable round summary modal for tests
      })

      act(() => {
        result.current.updatePlayer(0, { campaignPoints: 12 })
        result.current.setThreatLevel(8)
      })

      // Increase threat to 9
      act(() => {
        result.current.increaseThreat(1, 'Test trigger')
      })

      // Check for success message
      const hasSuccessMessage = result.current.eventLog.some(
        event => event.message.includes('Victory secured') && event.message.includes('10+ CP')
      )
      expect(hasSuccessMessage).toBe(true)
    })

    it('should not warn in competitive mode', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.setPlayerCount(2)
        result.current.startGame(2, false) // numPlayers, isSolo
        result.current.setShowRoundSummary(false) // WHY: Disable round summary modal for tests
      })

      act(() => {
        result.current.updatePlayer(0, { campaignPoints: 5 })
        result.current.setThreatLevel(7)
      })

      // Increase threat to 8
      act(() => {
        result.current.increaseThreat(1, 'Test trigger')
      })

      // Should NOT have solo mode warnings
      const hasSoloWarning = result.current.eventLog.some(
        event => event.message.includes('CP needed') || event.message.includes('Victory secured')
      )
      expect(hasSoloWarning).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should handle exactly 10 CP as victory', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.setPlayerCount(1)
        result.current.setTargetThreatLevel(10)
        result.current.startGame(1, true) // numPlayers, isSolo
        result.current.setShowRoundSummary(false) // WHY: Disable round summary modal for tests
      })

      // Exactly 10 CP
      act(() => {
        result.current.updatePlayer(0, { campaignPoints: 10 })
        result.current.setThreatLevel(10)
      })

      act(() => {
        result.current.nextPhase() // Battle
        result.current.nextPhase() // Action
        result.current.nextPhase() // Threat
        result.current.nextPhase() // New round - triggers campaign end
      })

      // Should be a victory
      expect(result.current.soloVictory).toBe(true)
      expect(result.current.gameEnded).toBe(true)
    })

    it('should handle 0 CP as failure', () => {
      const { result } = renderHook(() => useCampaign())

      act(() => {
        result.current.setPlayerCount(1)
        result.current.setTargetThreatLevel(10)
        result.current.startGame(1, true) // numPlayers, isSolo
        result.current.setShowRoundSummary(false) // WHY: Disable round summary modal for tests
      })

      // 0 CP (starting value)
      act(() => {
        result.current.setThreatLevel(10)
      })

      act(() => {
        result.current.nextPhase() // Battle
        result.current.nextPhase() // Action
        result.current.nextPhase() // Threat
        result.current.nextPhase() // New round - triggers campaign end
      })

      // Should be a failure
      expect(result.current.soloVictory).toBe(false)
      expect(result.current.gameEnded).toBe(true)
    })
  })
})
