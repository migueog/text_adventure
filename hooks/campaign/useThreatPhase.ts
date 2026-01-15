'use client'

import { useState, useCallback } from 'react'
import type { Player, Hex, ActiveThreatPhaseRule, ThreatPhaseRuleResolution, ThreatCheckResult, Event } from '@/types/campaign'
import { detectActiveThreatPhaseRules, sortByPriority, hasActiveRules } from '@/lib/utils/threatPhaseRules'
import { findPlayersInBeastRange, resolveBeastAttack } from '@/lib/utils/threatPhaseAttacks'
import { calculateThreatWarning } from '@/lib/utils/threatWarning'

/**
 * WHY: Threat phase hook for managing threat level and location-based mechanics (Phase 2, Hook 6)
 * Handles threat increase, location rules, Beast Lair attacks, and threat prevention
 */

interface UseThreatPhaseProps {
  players: Player[]
  hexes: Record<string, Hex>
  threatLevel: number
  targetThreatLevel: number
  currentRound: number
  currentPhase: string
  currentPlayerIndex?: number
  isSolo?: boolean
  addEvent: (message: string, type?: Event['type']) => void
  updatePlayer: (index: number, updates: Partial<Player>) => void
  setThreatLevel: (levelOrFn: number | ((prev: number) => number)) => void
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

export function useThreatPhase(props: UseThreatPhaseProps) {
  const {
    players,
    hexes,
    threatLevel: _threatLevel,
    targetThreatLevel,
    currentRound,
    currentPhase,
    currentPlayerIndex = 0,
    isSolo: _isSolo = false,
    addEvent,
    updatePlayer,
    setThreatLevel,
  } = props

  const [threatRulesResolved, setThreatRulesResolved] = useState(false)
  const [activeThreatRules, setActiveThreatRules] = useState<ActiveThreatPhaseRule[]>([])
  const [showThreatCheckResultDialog, setShowThreatCheckResultDialog] = useState(false)
  const [pendingThreatCheckResult, setPendingThreatCheckResult] = useState<ThreatCheckResult | null>(null)

  /**
   * WHY: Detect which players have active Threat Phase location rules
   * Returns array of active rules for UI display
   */
  const detectThreatRules = useCallback((): ActiveThreatPhaseRule[] => {
    const rules = detectActiveThreatPhaseRules(players, hexes)
    return sortByPriority(rules, players)
  }, [players, hexes])

  /**
   * WHY: Resolve all threat phase location rules in priority order
   * Location rules resolve BEFORE standard threat increase per game rules
   * Returns array of resolutions for UI display/logging
   */
  const resolveThreatPhaseLocationRules = useCallback((): ThreatPhaseRuleResolution[] => {
    const sortedRules = detectThreatRules()

    if (sortedRules.length === 0) {
      setThreatRulesResolved(true)
      return []
    }

    const resolutions: ThreatPhaseRuleResolution[] = []

    // WHY: Apply each rule in priority order
    for (const activeRule of sortedRules) {
      const { player, location, rule, hexId: ruleHexId } = activeRule
      const playerIndex = players.findIndex(p => p.id === player.id)
      if (playerIndex === -1) continue

      const currentPlayer = players[playerIndex]!
      let spChange = 0
      let cpChange = 0
      let threatChange = 0

      // WHY: Calculate effect based on rule type
      switch (rule.type) {
        case 'sp_gain':
          spChange = rule.amount
          break
        case 'sp_penalty':
          spChange = -rule.amount
          break
        case 'cp_gain':
          cpChange = rule.amount
          break
        case 'threat_increase':
          threatChange = rule.amount
          break
      }

      // WHY: Apply SP/CP changes to player
      if (spChange !== 0 || cpChange !== 0) {
        const newSP = clampSP(currentPlayer.supplyPoints + spChange)
        const newCP = currentPlayer.campaignPoints + cpChange

        updatePlayer(playerIndex, {
          supplyPoints: newSP,
          campaignPoints: newCP,
          history: addHistoryEntry(
            currentPlayer,
            currentRound,
            currentPhase,
            spChange,
            cpChange,
            `${location.name}: ${rule.description}`
          )
        })
      }

      // WHY: Apply threat change
      if (threatChange > 0) {
        increaseThreat(threatChange, location.name)
      }

      // WHY: Build resolution for logging
      const resolution: ThreatPhaseRuleResolution = {
        playerId: player.id,
        playerName: player.name,
        locationName: location.name,
        hexId: ruleHexId,
        effect: rule.description,
        spChange: spChange !== 0 ? spChange : undefined,
        cpChange: cpChange !== 0 ? cpChange : undefined,
        threatChange: threatChange !== 0 ? threatChange : undefined
      }
      resolutions.push(resolution)

      // WHY: Log the resolution
      const changeText = spChange > 0 ? `gained ${spChange} SP` :
        spChange < 0 ? `lost ${Math.abs(spChange)} SP` :
        cpChange > 0 ? `gained ${cpChange} CP` :
        threatChange > 0 ? `increased threat by ${threatChange}` : rule.description
      addEvent(`${player.name} at ${location.name}: ${changeText}`, 'action')
    }

    setThreatRulesResolved(true)
    setActiveThreatRules([])
    return resolutions
  }, [detectThreatRules, players, currentRound, currentPhase, addEvent, updatePlayer])

  /**
   * WHY: Resolve Beast Lair attacks during Threat Phase
   * Threat phase attacks resolve AFTER location rules but BEFORE standard threat increase (Issue #59)
   */
  const resolveThreatPhaseAttacks = useCallback((): void => {
    // WHY: Find all active Beast Lairs
    const beastLairs = Object.values(hexes).filter(hex =>
      hex.location === 23 && hex.state?.beastLairActive !== false
    )

    // WHY: Resolve each Beast Lair attack
    for (const beastLair of beastLairs) {
      const playersInRange = findPlayersInBeastRange(beastLair.id, players, hexes)

      if (playersInRange.length > 0) {
        const { targetPlayerId, damage, roll } = resolveBeastAttack(playersInRange, beastLair.id, hexes)

        if (targetPlayerId !== -1) {
          const targetIndex = players.findIndex(p => p.id === targetPlayerId)

          if (targetIndex !== -1) {
            const target = players[targetIndex]!
            const newSP = clampSP(target.supplyPoints - damage)

            updatePlayer(targetIndex, {
              supplyPoints: newSP,
              history: addHistoryEntry(
                target,
                currentRound,
                currentPhase,
                -damage,
                0,
                `Beast Lair attack (${damage} SP damage)`
              )
            })

            addEvent(`Beast Lair attacks ${target.name}! (Roll: ${roll}, Damage: ${damage} SP)`, 'warning')
          }
        }
      }
    }

    // TODO: Released Prisoner movement and attacks (requires UI for player movement choice)
    // For each active prisoner in releasedPrisoners array:
    // 1. Player chooses movement path (UI modal needed)
    // 2. Call resolvePrisonerAttack() for target hex
    // 3. Update player SP, remove camps, potentially remove prisoner
    // This will be implemented in Phase 1 UI integration step
  }, [players, hexes, currentRound, currentPhase, addEvent, updatePlayer])

  /**
   * WHY: Increase threat level with warnings and campaign end checks
   * Caps threat at 10 and shows warnings when approaching target
   */
  const increaseThreat = useCallback((amount: number, reason: string): void => {
    setThreatLevel(prev => {
      const newThreat = Math.min(prev + amount, 10)
      const warning = calculateThreatWarning(newThreat, targetThreatLevel)

      addEvent(`Threat increased by ${amount}: ${reason}`, 'warning')

      // WHY: Inform players when approaching campaign end
      if (warning === 'critical') {
        addEvent(`⚠️ CRITICAL: Only ${targetThreatLevel - newThreat} level(s) from campaign end!`, 'warning')
      } else if (warning === 'moderate') {
        addEvent(`⚠️ WARNING: ${targetThreatLevel - newThreat} levels from campaign end`, 'warning')
      }

      return newThreat
    })
  }, [targetThreatLevel, addEvent, setThreatLevel])

  /**
   * WHY: Handle threat check confirmation (Issue #54)
   * Process dice roll result and increase threat if successful
   */
  const handleThreatCheckResultConfirm = useCallback(() => {
    if (pendingThreatCheckResult?.success) {
      increaseThreat(pendingThreatCheckResult.increase, pendingThreatCheckResult.description)
    }
    setShowThreatCheckResultDialog(false)
    setPendingThreatCheckResult(null)
  }, [pendingThreatCheckResult, increaseThreat])

  /**
   * WHY: Handle threat prevention - spend SP to prevent threat increase (Issue #54)
   * Allow player to spend SP to prevent search action threat
   */
  const handleThreatPrevention = useCallback((spCost: number) => {
    const currentPlayer = players[currentPlayerIndex]
    if (!currentPlayer) return

    if (currentPlayer.supplyPoints < spCost) {
      addEvent('Insufficient SP to prevent threat increase', 'error')
      return
    }

    updatePlayer(currentPlayerIndex, {
      supplyPoints: currentPlayer.supplyPoints - spCost,
      history: addHistoryEntry(
        currentPlayer,
        currentRound,
        currentPhase,
        -spCost,
        0,
        `Prevented threat increase (spent ${spCost} SP)`
      )
    })

    addEvent(`${currentPlayer.name} prevented threat increase (spent ${spCost} SP)`, 'action')
    setShowThreatCheckResultDialog(false)
    setPendingThreatCheckResult(null)
  }, [players, currentPlayerIndex, currentRound, currentPhase, addEvent, updatePlayer])

  /**
   * WHY: Check if there are active threat phase rules to resolve
   * Allows UI to conditionally show location rules section
   */
  const checkForThreatRules = useCallback((): boolean => {
    return hasActiveRules(players, hexes)
  }, [players, hexes])

  return {
    // State
    threatRulesResolved,
    activeThreatRules,
    showThreatCheckResultDialog,
    pendingThreatCheckResult,

    // Actions
    detectThreatRules,
    resolveThreatPhaseLocationRules,
    resolveThreatPhaseAttacks,
    increaseThreat,
    handleThreatCheckResultConfirm,
    handleThreatPrevention,
    checkForThreatRules,

    // State setters (for tests and UI)
    setThreatRulesResolved,
    setActiveThreatRules,
    setShowThreatCheckResultDialog,
    setPendingThreatCheckResult,
  }
}
