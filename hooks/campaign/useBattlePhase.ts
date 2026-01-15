'use client'

import { useState, useCallback } from 'react'
import type { Player, Event } from '@/types/campaign'
import type { ExtendedBattleRecord } from '@/types/battle'
import { recordOperativeKill } from '@/lib/utils/operativeKills'
import { createMissingPlayerRecords } from '@/lib/utils/battleRewards'

/**
 * WHY: Battle phase hook for managing battle results and rewards (Phase 2, Hook 4)
 * Handles battle recording, missing player scenarios, and phase completion tracking
 */

interface UseBattlePhaseProps {
  players: Player[]
  currentPlayerIndex: number
  currentRound: number
  currentPhase: string
  isSolo?: boolean
  addEvent: (message: string, type?: Event['type']) => void
  updatePlayer: (index: number, updates: Partial<Player>) => void
}

/**
 * WHY: Clamp SP within valid range (0-10)
 */
const SP_MIN = 0
const SP_MAX = 10
const clampSP = (value: number): number => {
  return Math.max(SP_MIN, Math.min(SP_MAX, value))
}

/**
 * WHY: Add history entry to player
 */
const addHistoryEntry = (
  player: Player,
  round: number,
  phase: string,
  spChange: number,
  cpChange: number,
  reason: string
) => {
  return [
    ...(player.history || []),
    {
      round,
      phase,
      timestamp: new Date().toISOString(),
      action: reason,
      spBefore: player.supplyPoints,
      spAfter: clampSP(player.supplyPoints + spChange),
      cpBefore: player.campaignPoints,
      cpAfter: player.campaignPoints + cpChange,
    }
  ]
}

export function useBattlePhase(props: UseBattlePhaseProps) {
  const {
    players,
    currentPlayerIndex,
    currentRound,
    currentPhase,
    isSolo: _isSolo = false,
    addEvent,
    updatePlayer,
  } = props

  const [battleCompleted, setBattleCompleted] = useState(false)

  /**
   * WHY: Record battle result with rewards and stats
   * Creates complete battle record and updates player state
   */
  const recordBattle = useCallback((
    record: Omit<ExtendedBattleRecord, 'round' | 'timestamp'>
  ) => {
    const player = players[currentPlayerIndex]
    if (!player) return

    const newSP = clampSP(player.supplyPoints + record.spEarned)
    const newCP = player.campaignPoints + record.cpEarned

    // WHY: Create complete battle record with auto-generated fields
    const battleRecord: ExtendedBattleRecord = {
      ...record,
      round: currentRound,
      timestamp: new Date().toISOString()
    }

    // WHY: Calculate win/loss stats from result
    const isWin = record.result === 'WIN'
    const isLoss = record.result === 'LOSS'

    // WHY: Process operative kill details for wound-based tracking
    const newKillDetails = (record.operativeKills || []).map(kill =>
      recordOperativeKill(
        player,
        currentRound,
        kill.operativeName,
        kill.wounds,
        record.opponent
      )
    )

    updatePlayer(currentPlayerIndex, {
      supplyPoints: newSP,
      campaignPoints: newCP,
      gamesPlayed: player.gamesPlayed + 1,
      gamesWon: isWin ? player.gamesWon + 1 : player.gamesWon,
      gamesLost: isLoss ? player.gamesLost + 1 : player.gamesLost,
      operativesKilled: player.operativesKilled + record.operativesKilled,
      operativeKillDetails: [
        ...(player.operativeKillDetails || []),
        ...newKillDetails
      ],
      battleResult: record.result,
      battleHistory: [
        ...(player.battleHistory || []),
        battleRecord
      ],
      history: addHistoryEntry(
        player,
        currentRound,
        currentPhase,
        record.spEarned,
        record.cpEarned,
        `Battle result: ${record.result}`
      )
    })

    addEvent(
      `${player.name}: ${record.result} (+${record.cpEarned} CP, +${record.spEarned} SP)`,
      'battle'
    )

    setBattleCompleted(true)
  }, [players, currentPlayerIndex, currentRound, currentPhase, addEvent, updatePlayer])

  /**
   * WHY: Record missing player scenario (Issue #41)
   * Present player gets WIN (+1 CP), absent player gets LOSS (+1 SP)
   */
  const recordMissingPlayer = useCallback((
    presentPlayerId: number,
    absentPlayerId: number
  ) => {
    const presentPlayer = players.find(p => p.id === presentPlayerId)
    const absentPlayer = players.find(p => p.id === absentPlayerId)

    if (!presentPlayer || !absentPlayer) {
      console.error('recordMissingPlayer: Invalid player IDs')
      return
    }

    // WHY: Create battle records for both players
    const { winRecord, lossRecord } = createMissingPlayerRecords(
      presentPlayer,
      absentPlayer,
      currentRound
    )

    // WHY: Update present player with WIN
    updatePlayer(presentPlayerId, {
      supplyPoints: presentPlayer.supplyPoints,
      campaignPoints: presentPlayer.campaignPoints + winRecord.cpEarned,
      gamesPlayed: presentPlayer.gamesPlayed + 1,
      gamesWon: presentPlayer.gamesWon + 1,
      battleResult: 'WIN',
      battleHistory: [
        ...(presentPlayer.battleHistory || []),
        winRecord
      ],
      history: addHistoryEntry(
        presentPlayer,
        currentRound,
        currentPhase,
        winRecord.spEarned,
        winRecord.cpEarned,
        `Battle result: WIN (opponent absent)`
      )
    })

    // WHY: Update absent player with LOSS
    updatePlayer(absentPlayerId, {
      supplyPoints: clampSP(absentPlayer.supplyPoints + lossRecord.spEarned),
      campaignPoints: absentPlayer.campaignPoints,
      gamesPlayed: absentPlayer.gamesPlayed + 1,
      gamesLost: absentPlayer.gamesLost + 1,
      battleResult: 'LOSS',
      battleHistory: [
        ...(absentPlayer.battleHistory || []),
        lossRecord
      ],
      history: addHistoryEntry(
        absentPlayer,
        currentRound,
        currentPhase,
        lossRecord.spEarned,
        lossRecord.cpEarned,
        `Battle result: LOSS (absent)`
      )
    })

    addEvent(
      `${presentPlayer.name}: WIN (+1 CP) - opponent absent`,
      'battle'
    )
    addEvent(
      `${absentPlayer.name}: LOSS (+1 SP) - marked as absent`,
      'battle'
    )

    setBattleCompleted(true)
  }, [players, currentRound, currentPhase, addEvent, updatePlayer])

  /**
   * WHY: Reset all battle results at start of Battle Phase
   * Clears battleResult fields for turn order calculation
   */
  const resetBattleResults = useCallback(() => {
    players.forEach((_, index) => {
      updatePlayer(index, { battleResult: null })
    })
    setBattleCompleted(false)
  }, [players, updatePlayer])

  return {
    // State
    battleCompleted,

    // Actions
    recordBattle,
    recordMissingPlayer,
    resetBattleResults,
  }
}
