'use client'

import { useCallback } from 'react'
import type { Player } from '@/types/campaign'
import type { SoloPerformanceRecord } from '@/types/soloPerformance'
import { buildPerformanceRecord } from '@/lib/utils/performanceCalculations'

/**
 * WHY: Solo mode hook for managing solo/co-op campaign mechanics (Issue #54, #55, #56)
 * Handles progress warnings, victory conditions, and performance tracking
 */

interface UseSoloModeProps {
  soloMode: boolean
  soloSettings: {
    jointOpsMode: boolean
    resupplyReductionsUsed: number
  }
  players: Player[]
  threatLevel: number
  targetThreatLevel: number
  addEvent: (message: string, type?: string) => void
}

export function useSoloMode(props: UseSoloModeProps) {
  const {
    soloMode,
    soloSettings,
    players,
    threatLevel,
    targetThreatLevel,
    addEvent,
  } = props

  /**
   * WHY: Issue #55 - Warn players when approaching campaign end with insufficient CP
   * Provides strategic awareness of remaining opportunities to earn CP in solo mode
   */
  const checkSoloProgressWarning = useCallback((threat: number, cp: number) => {
    if (!soloMode) return

    const cpNeeded = 10 - cp

    if (threat >= 9) {
      if (cp >= 10) {
        addEvent(
          '✅ Victory secured! You have 10+ CP. Campaign will end successfully when threat reaches 10.',
          'milestone'
        )
      } else {
        addEvent(
          `🚨 CRITICAL: Campaign will likely end next round! You need ${cpNeeded} more CP for victory!`,
          'warning'
        )
      }
    } else if (threat >= 8 && cp < 8) {
      addEvent(
        `⚠️ WARNING: Only ~2 rounds likely remain. You need ${cpNeeded} more CP for victory.`,
        'warning'
      )
    }
  }, [soloMode, addEvent])

  /**
   * WHY: Issue #55 - Check if solo player achieved victory condition
   * Victory: 10+ CP when threat reaches target threat level
   */
  const checkSoloVictory = useCallback((): boolean => {
    if (!soloMode) return false

    const soloPlayer = players[0]
    if (!soloPlayer) return false

    return soloPlayer.campaignPoints >= 10
  }, [soloMode, players])

  /**
   * WHY: Issue #56 - Build complete solo performance record for history tracking
   * Creates snapshot of campaign performance at completion
   */
  const buildSoloPerformanceRecord = useCallback((
    campaignId: string,
    success: boolean,
    finalThreat: number,
    rounds: number
  ): SoloPerformanceRecord | null => {
    if (!soloMode) return null

    const soloPlayer = players[0]
    if (!soloPlayer) return null

    return buildPerformanceRecord(
      campaignId,
      success,
      finalThreat,
      rounds,
      soloPlayer
    )
  }, [soloMode, players])

  /**
   * WHY: Issue #54 - Check if player can use resupply threat reduction
   * Limited to 3 uses per campaign
   */
  const canUseResupplyReduction = useCallback((): boolean => {
    return soloSettings.resupplyReductionsUsed < 3
  }, [soloSettings.resupplyReductionsUsed])

  return {
    // State
    soloMode,
    soloSettings,

    // Actions
    checkSoloProgressWarning,
    checkSoloVictory,
    buildSoloPerformanceRecord,
    canUseResupplyReduction,
  }
}
