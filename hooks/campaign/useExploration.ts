'use client'

import { useState, useCallback } from 'react'
import type { Player, Hex, MapConfig, ExplorationResult, Event, AuditActionType, HexSnapshot } from '@/types/campaign'
import { SURFACE_LOCATIONS, TOMB_LOCATIONS, SURFACE_CONDITIONS, TOMB_CONDITIONS } from '@/lib/data/campaignData'
import { rollD36, parseValue, rollD6 } from '@/lib/utils/dice'
import { canExploreHex } from '@/lib/utils/hexUtils'
import {
  getExploredLocationIds,
  getExploredConditionIds,
  rollWithRerolls,
  rollConditionWithRerolls
} from '@/lib/utils/explorationUtils'
import { checkTombExplorationThreat } from '@/lib/utils/soloThreatChecks'
import { createHexSnapshot } from '@/lib/utils/auditTrail'

/**
 * WHY: Exploration hook for managing D36 hex exploration (Phase 2, Hook 7)
 * Handles dice rolling, duplicate detection, and exploration state tracking
 */

interface UseExplorationProps {
  players: Player[]
  hexes: Record<string, Hex>
  currentPlayerIndex: number
  currentRound: number
  currentPhase: string
  mapConfig: MapConfig | null
  isSolo?: boolean
  addEvent: (message: string, type?: Event['type']) => void
  updatePlayer: (index: number, updates: Partial<Player>) => void
  setHexes: (hexesOrFn: Record<string, Hex> | ((prev: Record<string, Hex>) => Record<string, Hex>)) => void
  addAudit: (hexId: string, action: AuditActionType, before: HexSnapshot, after: HexSnapshot, playerId: number, playerName: string, round: number, phase: string, reason: string) => void
  onThreatCheck?: (threatCheck: any) => void
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

export function useExploration(props: UseExplorationProps) {
  const {
    players,
    hexes: _hexes,
    currentPlayerIndex,
    currentRound,
    currentPhase,
    mapConfig,
    isSolo = false,
    addEvent,
    updatePlayer,
    setHexes,
    addAudit,
    onThreatCheck,
  } = props

  const [explorationResult, setExplorationResult] = useState<ExplorationResult | null>(null)

  /**
   * WHY: Explore hex with D36 dice rolling and duplicate detection (Issue #58)
   * Rolls location and condition, applies immediate effects, records audit trail
   */
  const exploreHex = useCallback((hexKey: string) => {
    setHexes(prev => {
      const hex = prev[hexKey]
      if (!hex) return prev

      // WHY: Capture before snapshot for audit trail (Issue #23)
      const beforeSnapshot = createHexSnapshot(hex)

      // WHY: Validate hex can be explored (not blocked, not already explored)
      if (!canExploreHex(hex)) {
        if (hex.type === 'blocked') {
          addEvent('Cannot explore blocked hex', 'error')
        } else if (hex.explored) {
          addEvent('Hex already explored', 'warning')
        }
        return prev
      }

      const locations = hex.type === 'surface' ? SURFACE_LOCATIONS : TOMB_LOCATIONS
      const conditions = hex.type === 'surface' ? SURFACE_CONDITIONS : TOMB_CONDITIONS

      // WHY: Get explored IDs for re-roll duplicate detection (Issue #58)
      const exploredLocationIds = getExploredLocationIds(prev)
      const exploredConditionIds = getExploredConditionIds(prev)

      // WHY: Roll with automatic re-rolls for unique locations/conditions (Issue #58)
      const locationRoll = rollWithRerolls(rollD36, exploredLocationIds, locations)
      const conditionRoll = rollConditionWithRerolls(rollD36, exploredConditionIds, conditions)

      const location = locations[locationRoll] || locations[11]
      const condition = conditions[conditionRoll] || conditions[11]

      // WHY: Initialize hex state for special locations (Issue #58, #59)
      const initialState: Record<string, any> = {}
      if (location?.initialState?.supplyCount !== undefined) {
        initialState.supplyCount = rollD6() // Roll D6 for Abandoned Camp supplies
      }
      if (location?.initialState?.intelGained !== undefined) {
        initialState.intelGained = 0 // 0 = not claimed, 1 = claimed
      }
      // WHY: Initialize Intel Cache with D6 intel (Issue #59)
      if (location?.specialRules?.includes('INTEL_CACHE')) {
        initialState.intelRemaining = rollD6()
      }

      addEvent(`Explored hex ${hexKey}: ${location?.name || 'Unknown'} (${condition?.name || 'Clear'})`, 'exploration')

      // WHY: Set exploration result for modal display
      const hexNumber = hex.row * (mapConfig?.cols || 5) + hex.col + 1
      const currentPlayer = players[currentPlayerIndex]
      setExplorationResult({
        hexId: hexKey,
        hexNumber,
        location: {
          name: location?.name || 'Unknown',
          description: location?.description || '',
          effect: location?.effect || ''
        },
        condition: {
          name: condition?.name || 'Clear',
          description: condition?.description || '',
          effect: condition?.effect || ''
        },
        locationRoll,
        conditionRoll,
        playerName: currentPlayer?.name || 'Unknown Player'
      })

      // WHY: Handle immediate exploration effects
      let spGain = 0
      let cpGain = 0

      if (location && location.effect === 'gainSP' && location.value) {
        spGain = parseValue(location.value)
      }
      if (location && location.effect === 'gainCP' && location.value) {
        cpGain = typeof location.value === 'number' ? location.value : parseValue(location.value)
      }

      // WHY: Update player with exploration rewards
      const player = players[currentPlayerIndex]
      if (player) {
        if (spGain > 0 || cpGain > 0) {
          const newSP = clampSP(player.supplyPoints + spGain)
          const newCP = player.campaignPoints + cpGain

          updatePlayer(currentPlayerIndex, {
            supplyPoints: newSP,
            campaignPoints: newCP,
            exploredHexes: player.exploredHexes + 1,
            history: addHistoryEntry(player, currentRound, currentPhase, spGain, cpGain, `Explored ${location?.name || 'Unknown'}`)
          })

          if (spGain > 0) addEvent(`Gained ${spGain} SP from ${location?.name || 'Unknown'}`, 'reward')
          if (cpGain > 0) addEvent(`Gained ${cpGain} CP from ${location?.name || 'Unknown'}`, 'reward')
        } else {
          updatePlayer(currentPlayerIndex, {
            exploredHexes: player.exploredHexes + 1
          })
        }
      }

      // WHY: Check for solo mode tomb exploration threat (Issue #54)
      // Non-Scout tomb explorations trigger D6 roll (4+ = +1 threat)
      if (isSolo && hex.type === 'tomb' && onThreatCheck) {
        const threatCheck = checkTombExplorationThreat()
        onThreatCheck(threatCheck)
      }

      // WHY: Create updated hex for after snapshot (Issue #23)
      const updatedHex = {
        ...hex,
        explored: true,
        location: locationRoll,
        condition: conditionRoll,
        exploredBy: [...hex.exploredBy, currentPlayerIndex],
        exploredLocation: location?.id,
        exploredCondition: condition?.id,
        state: Object.keys(initialState).length > 0 ? initialState : undefined
      }

      // WHY: Record audit entry for exploration (Issue #23)
      const afterSnapshot = createHexSnapshot(updatedHex)
      const exploringPlayer = players[currentPlayerIndex]
      addAudit(
        hexKey,
        'EXPLORE',
        beforeSnapshot,
        afterSnapshot,
        currentPlayerIndex,
        exploringPlayer?.name || 'Unknown',
        currentRound,
        currentPhase,
        `Explored ${location?.name || 'Unknown'}`
      )

      return {
        ...prev,
        [hexKey]: updatedHex
      }
    })
  }, [
    players,
    currentPlayerIndex,
    currentRound,
    currentPhase,
    mapConfig,
    isSolo,
    addEvent,
    updatePlayer,
    setHexes,
    addAudit,
    onThreatCheck
  ])

  /**
   * WHY: Clear exploration result modal
   */
  const clearExplorationResult = useCallback(() => {
    setExplorationResult(null)
  }, [])

  return {
    // State
    explorationResult,

    // Actions
    exploreHex,
    clearExplorationResult,
  }
}
