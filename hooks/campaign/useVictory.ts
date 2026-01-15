'use client'

import { useCallback } from 'react'
import type { Player, Event } from '@/types/campaign'

/**
 * WHY: Victory hook for managing campaign end conditions (Issue #53, #55)
 * Handles solo victory (10+ CP goal), multiplayer end, and extended mode
 */

interface UseVictoryProps {
  gameEnded: boolean
  extendedMode: boolean
  soloMode: boolean
  threatLevel: number
  targetThreatLevel: number
  players: Player[]
  addEvent: (message: string, type?: Event['type']) => void
}

interface VictoryResult {
  soloVictory?: boolean
  gameEnded: boolean
}

interface ExtendedModeResult {
  extendedMode: boolean
  gameEnded: boolean
}

export function useVictory(props: UseVictoryProps) {
  const {
    gameEnded,
    extendedMode,
    soloMode,
    threatLevel,
    targetThreatLevel,
    players,
    addEvent,
  } = props

  /**
   * WHY: Check if campaign should end (threat reached target)
   * Returns true if threat >= target and extended mode is not active
   */
  const checkCampaignEnd = useCallback((): boolean => {
    if (extendedMode) return false
    return threatLevel >= targetThreatLevel
  }, [threatLevel, targetThreatLevel, extendedMode])

  /**
   * WHY: Handle campaign end for solo or multiplayer mode
   * Solo: Check 10+ CP goal, log success/failure
   * Multiplayer: Log campaign end, winner determined by VictoryScreen
   */
  const handleCampaignEnd = useCallback((): VictoryResult => {
    if (soloMode) {
      // WHY: Issue #55 - Solo mode victory determined by 10+ CP goal
      const soloPlayer = players[0]
      const victoryAchieved = soloPlayer ? soloPlayer.campaignPoints >= 10 : false

      if (victoryAchieved && soloPlayer) {
        addEvent(
          `🎉 CAMPAIGN SUCCESS! You achieved ${soloPlayer.campaignPoints} CP with threat at ${threatLevel}. Victory secured!`,
          'milestone'
        )
      } else {
        const cpValue = soloPlayer ? soloPlayer.campaignPoints : 0
        addEvent(
          `💀 CAMPAIGN FAILED! You only achieved ${cpValue} CP (need 10+). Threat reached ${threatLevel}.`,
          'warning'
        )
      }

      return {
        soloVictory: victoryAchieved,
        gameEnded: true,
      }
    } else {
      // WHY: Multiplayer campaign end - winner determined by VictoryScreen
      addEvent('Campaign ended! Threat level reached target. Calculating winners...', 'system')

      return {
        gameEnded: true,
      }
    }
  }, [soloMode, players, threatLevel, addEvent])

  /**
   * WHY: Enable extended campaign mode (Issue #53)
   * Allows campaign to continue beyond target threat level
   */
  const enableExtendedMode = useCallback((): ExtendedModeResult => {
    addEvent('Campaign extended beyond target threat level', 'system')

    return {
      extendedMode: true,
      gameEnded: false,
    }
  }, [addEvent])

  return {
    // State
    gameEnded,
    extendedMode,

    // Actions
    checkCampaignEnd,
    handleCampaignEnd,
    enableExtendedMode,
  }
}
