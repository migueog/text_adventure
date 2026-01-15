'use client'

import { useState, useCallback } from 'react'
import type {
  ThreatWarningLevel,
  ActiveBattleCondition,
  KillzoneRecommendation,
  ReleasedPrisonerEntity,
  RoundStatistics
} from '@/types/campaign'
import { PHASES } from '@/lib/data/campaignData'
import { calculateThreatWarning } from '@/lib/utils/threatWarning'
import { determineActiveCondition, getKillzoneRecommendation } from '@/lib/utils/battleCondition'
import { configurePortalNetwork, toggleHexBlocking } from '@/lib/utils/hexManipulation'
import { calculateRoundStatistics } from '@/lib/utils/roundStatistics'
import { detectMilestones } from '@/lib/utils/milestones'

// Import all campaign hooks
import { useCampaignState } from './campaign/useCampaignState'
import { useAudit } from './campaign/useAudit'
import { useExploration } from './campaign/useExploration'
import { useMovementPhase } from './campaign/useMovementPhase'
import { useBattlePhase } from './campaign/useBattlePhase'
import { useActionPhase } from './campaign/useActionPhase'
import { useThreatPhase } from './campaign/useThreatPhase'
import { useSoloMode } from './campaign/useSoloMode'
import { useVictory } from './campaign/useVictory'
import { useImportExport } from './campaign/useImportExport'

/**
 * Main campaign hook - composes all specialized hooks
 * WHY: Orchestrates campaign state and phase management
 * Refactored from 2,518-line monolith into 10 focused hooks
 */
export function useCampaign() {
  // ============================================================================
  // CORE STATE (Foundation Hook)
  // ============================================================================
  const state = useCampaignState()

  // ============================================================================
  // ADDITIONAL STATE (Not managed by specialized hooks)
  // ============================================================================

  // Threat level state (core campaign mechanic)
  const [threatLevel, setThreatLevel] = useState(1)
  const [threatWarning, setThreatWarning] = useState<ThreatWarningLevel>('none')

  // Solo mode state (initialized by GameSetup component)
  const [soloMode, setSoloMode] = useState(false)
  const [soloSettings, setSoloSettings] = useState<{
    jointOpsMode: boolean
    ignoreConditions: boolean
    resupplyReductionsUsed: number
  }>({
    jointOpsMode: false,
    ignoreConditions: false,
    resupplyReductionsUsed: 0
  })

  // Battle condition state (Issue #40)
  const [conditionEnabled, setConditionEnabled] = useState(true)
  const [selectedOpponentId, setSelectedOpponentId] = useState<number | null>(null)

  // Released Prisoner entities (Issue #59)
  const [releasedPrisoners, setReleasedPrisoners] = useState<ReleasedPrisonerEntity[]>([])

  // Portal and Hex Blocking modal state (Issue #59 - Phase 4)
  const [showPortalConfigModal, setShowPortalConfigModal] = useState(false)
  const [portalHexId, setPortalHexId] = useState<string | null>(null)
  const [showHexBlockSelector, setShowHexBlockSelector] = useState(false)
  const [fulcrumHexId, setFulcrumHexId] = useState<string | null>(null)

  // Round summary modal state (Issue #31 - Phase 2)
  const [showRoundSummary, setShowRoundSummary] = useState(true)
  const [pendingRoundSummary, setPendingRoundSummary] = useState<RoundStatistics | null>(null)

  // Campaign import modal state (Issue #23 - Phase 2)
  const [importModalOpen, setImportModalOpen] = useState(false)

  // ============================================================================
  // THREAT LEVEL MANAGEMENT
  // ============================================================================

  /**
   * WHY: Centralized threat increase with warning calculation
   * Updates threat level, calculates warning, and logs event
   */
  const increaseThreat = useCallback((amount: number, reason: string): void => {
    setThreatLevel(prev => {
      const newThreat = Math.min(prev + amount, 10)
      const warning = calculateThreatWarning(newThreat, state.targetThreatLevel)

      setThreatWarning(warning)
      state.addEvent(`Threat increased by ${amount}: ${reason}`, 'warning')

      return newThreat
    })
  }, [state.targetThreatLevel, state.addEvent])

  // ============================================================================
  // SPECIALIZED HOOKS (Phase-specific logic)
  // ============================================================================

  // Audit trail hook (Issue #23 - Phase 3)
  const audit = useAudit({
    players: state.players,
    currentPlayerIndex: state.currentPlayerIndex,
    currentRound: state.currentRound,
    currentPhase: state.currentPhase,
    hexes: state.hexes,
    addEvent: state.addEvent
  })

  // Exploration hook (D36 rolls, location/condition assignment)
  const exploration = useExploration({
    players: state.players,
    hexes: state.hexes,
    currentRound: state.currentRound,
    currentPhase: state.currentPhase,
    soloMode,
    setHexes: state.setHexes,
    setPlayers: state.setPlayers,
    addEvent: state.addEvent,
    addAudit: audit.addAudit
  })

  // Movement phase hook
  const movement = useMovementPhase({
    players: state.players,
    hexes: state.hexes,
    currentPhase: state.currentPhase,
    setPlayers: state.setPlayers,
    setHexes: state.setHexes,
    addEvent: state.addEvent,
    addAudit: audit.addAudit
  })

  // Battle phase hook
  const battle = useBattlePhase({
    players: state.players,
    hexes: state.hexes,
    currentRound: state.currentRound,
    currentPhase: state.currentPhase,
    conditionEnabled,
    setPlayers: state.setPlayers,
    setConditionEnabled,
    addEvent: state.addEvent
  })

  // Action phase hook
  const action = useActionPhase({
    players: state.players,
    hexes: state.hexes,
    currentRound: state.currentRound,
    currentPhase: state.currentPhase,
    soloMode,
    setPlayers: state.setPlayers,
    setHexes: state.setHexes,
    increaseThreat,
    addEvent: state.addEvent,
    addAudit: audit.addAudit
  })

  // Threat phase hook (Issue #48, #54)
  const threat = useThreatPhase({
    players: state.players,
    hexes: state.hexes,
    threatLevel,
    targetThreatLevel: state.targetThreatLevel,
    currentRound: state.currentRound,
    currentPhase: state.currentPhase,
    soloMode,
    soloSettings,
    releasedPrisoners,
    setPlayers: state.setPlayers,
    setHexes: state.setHexes,
    setSoloSettings,
    setReleasedPrisoners,
    increaseThreat,
    addEvent: state.addEvent,
    addAudit: audit.addAudit
  })

  // Solo mode hook (Issue #54, #55, #56)
  const solo = useSoloMode({
    soloMode,
    soloSettings,
    players: state.players,
    threatLevel,
    targetThreatLevel: state.targetThreatLevel,
    addEvent: state.addEvent
  })

  // Victory hook (Issue #53, #55)
  const victory = useVictory({
    gameEnded: state.gameEnded,
    extendedMode: state.extendedMode,
    soloMode,
    threatLevel,
    targetThreatLevel: state.targetThreatLevel,
    players: state.players,
    addEvent: state.addEvent
  })

  // Import/Export hook (Issue #23 - Phase 2)
  const importExport = useImportExport({
    importModalOpen,
    players: state.players,
    hexes: state.hexes,
    threatLevel,
    targetThreatLevel: state.targetThreatLevel,
    currentRound: state.currentRound,
    currentPhase: state.currentPhase,
    eventLog: state.eventLog,
    auditLog: audit.auditLog,
    setPlayers: state.setPlayers,
    setHexes: state.setHexes,
    setThreatLevel,
    setTargetThreatLevel: state.setTargetThreatLevel,
    setCurrentRound: state.setCurrentRound,
    setCurrentPhase: state.setCurrentPhase,
    setEventLog: state.setEventLog,
    setSoloMode,
    addEvent: state.addEvent
  })

  // ============================================================================
  // PHASE TRANSITION LOGIC
  // ============================================================================

  /**
   * WHY: Advance to next phase with validation and milestone detection
   * Enforces phase order: Movement → Battle → Action → Threat → (next round)
   */
  const nextPhase = useCallback(() => {
    const currentPhaseIndex = PHASES.indexOf(state.currentPhase)

    // WHY: Validate phase-specific completion requirements
    if (currentPhaseIndex === 0 && movement.movementIndex < state.players.length) {
      state.addEvent('Complete all player movements before advancing', 'warning')
      return
    }

    if (currentPhaseIndex === 2 && action.actionIndex < state.players.length) {
      state.addEvent('Complete all player actions before advancing', 'warning')
      return
    }

    // WHY: Advance phase or start new round
    if (currentPhaseIndex === 3) {
      // End of round - advance to next round
      const nextRound = state.currentRound + 1
      state.setCurrentRound(nextRound)
      state.setCurrentPhase(0) // Reset to Movement

      // WHY: Calculate round statistics and detect milestones (Issue #31)
      const roundStats = calculateRoundStatistics(
        state.players,
        state.hexes,
        nextRound - 1, // Previous round stats
        threatLevel
      )
      const milestones = detectMilestones(roundStats, state.players)

      setPendingRoundSummary(roundStats)

      if (milestones.length > 0) {
        milestones.forEach(m => state.addEvent(m.message, m.type))
      }

      state.addEvent(`Round ${nextRound} - Movement Phase`, 'system')

      // WHY: Check if campaign should end (Issue #53, #55)
      if (victory.checkCampaignEnd()) {
        const result = victory.handleCampaignEnd()
        state.setGameEnded(result.gameEnded)
      }
    } else {
      // Advance to next phase within round
      state.setCurrentPhase(currentPhaseIndex + 1)
      const nextPhaseName = PHASES[currentPhaseIndex + 1]
      state.addEvent(`${nextPhaseName} Phase`, 'system')

      // WHY: Reset phase-specific state on phase transition
      if (nextPhaseName === 'Battle') {
        battle.setBattleCompleted(false)
      }
      if (nextPhaseName === 'Threat') {
        threat.detectThreatRules()
      }
    }
  }, [
    state,
    movement,
    action,
    battle,
    threat,
    victory,
    threatLevel
  ])

  /**
   * WHY: Continue past round summary modal (Issue #31)
   * Hides modal and allows gameplay to continue
   */
  const continuePastRoundSummary = useCallback(() => {
    setShowRoundSummary(false)
  }, [])

  // ============================================================================
  // BATTLE CONDITION HELPERS (Issue #40)
  // ============================================================================

  /**
   * WHY: Get active battle condition for current hex
   * Returns condition object with recommendations
   */
  const getActiveBattleCondition = useCallback((): ActiveBattleCondition | null => {
    if (!selectedOpponentId) return null

    const player = state.players.find(p => p.id === state.currentPlayerIndex)
    const opponent = state.players.find(p => p.id === selectedOpponentId)

    if (!player || !opponent) return null

    const hex = state.hexes[player.position.row + ',' + player.position.col]
    if (!hex || !hex.explored) return null

    const condition = determineActiveCondition(hex, conditionEnabled)
    if (!condition) return null

    const recommendation = getKillzoneRecommendation(
      condition,
      player,
      opponent,
      state.hexes
    )

    return {
      condition,
      recommendation: recommendation as KillzoneRecommendation
    }
  }, [selectedOpponentId, state.players, state.currentPlayerIndex, state.hexes, conditionEnabled])

  // ============================================================================
  // PORTAL AND HEX BLOCKING (Issue #59 - Phase 4)
  // ============================================================================

  /**
   * WHY: Handle portal network configuration
   * Links specified hexes via portal network
   * NOTE: Maintains backward-compatible signature (tombDest, surfaceDest)
   */
  const handlePortalConfig = useCallback((tombDest: string, surfaceDest: string) => {
    if (!portalHexId) return

    const targetHexIds = [tombDest, surfaceDest]
    const updatedHexes = configurePortalNetwork(state.hexes, portalHexId, targetHexIds)
    state.setHexes(updatedHexes)
    state.addEvent('Portal network configured', 'system')
    setShowPortalConfigModal(false)
    setPortalHexId(null)
  }, [portalHexId, state])

  /**
   * WHY: Cancel portal configuration
   */
  const handleCancelPortalConfig = useCallback(() => {
    setShowPortalConfigModal(false)
    setPortalHexId(null)
  }, [])

  /**
   * WHY: Handle hex blocking configuration
   * Blocks specified hex using Fulcrum Hex power
   */
  const handleHexBlock = useCallback((targetHexId: string) => {
    if (!fulcrumHexId) return

    const updatedHexes = toggleHexBlocking(state.hexes, targetHexId, true)
    state.setHexes(updatedHexes)
    state.addEvent(`Hex ${targetHexId} blocked by Fulcrum Hex`, 'system')
    setShowHexBlockSelector(false)
    setFulcrumHexId(null)
  }, [fulcrumHexId, state])

  /**
   * WHY: Cancel hex blocking
   */
  const handleCancelHexBlock = useCallback(() => {
    setShowHexBlockSelector(false)
    setFulcrumHexId(null)
  }, [])

  // ============================================================================
  // RETURN COMBINED INTERFACE (Backward compatible with original hook)
  // ============================================================================

  return {
    // Core state from useCampaignState
    gameStarted: state.gameStarted,
    playerCount: state.playerCount,
    players: state.players,
    hexes: state.hexes,
    currentRound: state.currentRound,
    currentPhase: state.currentPhase,
    currentPlayerIndex: state.currentPlayerIndex,
    targetThreatLevel: state.targetThreatLevel,
    mapConfig: state.mapConfig,
    selectedHex: state.selectedHex,
    gameEnded: state.gameEnded,
    extendedMode: state.extendedMode,
    eventLog: state.eventLog,

    // Additional state
    threatLevel,
    threatWarning,
    soloMode,
    conditionEnabled,
    selectedOpponentId,

    // Movement phase state
    movementOrder: movement.movementOrder,
    movementIndex: movement.movementIndex,
    regroupPath: movement.regroupPath,

    // Battle phase state
    battleCompleted: battle.battleCompleted,

    // Action phase state
    actionOrder: action.actionOrder,
    actionIndex: action.actionIndex,

    // Exploration state
    explorationResult: exploration.explorationResult,

    // Threat phase state
    activeThreatRules: threat.activeThreatRules,
    threatRulesResolved: threat.threatRulesResolved,
    showThreatCheckDialog: threat.showThreatCheckDialog,
    pendingThreatCheck: threat.pendingThreatCheck,
    showThreatPreventionDialog: threat.showThreatPreventionDialog,
    showResupplyReductionDialog: threat.showResupplyReductionDialog,
    pendingResupplyReduction: threat.pendingResupplyReduction,

    // Victory state (computed)
    soloVictory: undefined, // WHY: Computed by victory.handleCampaignEnd()

    // UI modal state
    showPortalConfigModal,
    portalHexId,
    showHexBlockSelector,
    fulcrumHexId,
    showRoundSummary,
    pendingRoundSummary,
    importModalOpen,

    // Audit log
    auditLog: audit.auditLog,

    // ========================================================================
    // SETTERS
    // ========================================================================

    setPlayerCount: state.setPlayerCount,
    setTargetThreatLevel: state.setTargetThreatLevel,
    setSelectedHex: state.setSelectedHex,
    setThreatLevel,
    setConditionEnabled,
    setSelectedOpponentId,

    // ========================================================================
    // ACTIONS - Core
    // ========================================================================

    startGame: state.startGame,
    updatePlayer: state.updatePlayer,
    updatePriorities: state.updatePriorities,
    checkRollOff: state.checkRollOff,
    addEvent: state.addEvent,

    // ========================================================================
    // ACTIONS - Movement Phase
    // ========================================================================

    calculateMovementOrder: movement.calculateMovementOrder,
    movePlayer: movement.movePlayer,
    regroupPlayer: movement.regroupPlayer,
    holdPosition: movement.holdPosition,

    // ========================================================================
    // ACTIONS - Exploration
    // ========================================================================

    exploreHex: exploration.exploreHex,
    clearExplorationResult: exploration.clearExplorationResult,

    // ========================================================================
    // ACTIONS - Battle Phase
    // ========================================================================

    recordBattle: battle.recordBattle,
    recordMissingPlayer: battle.recordMissingPlayer,
    getActiveBattleCondition,

    // ========================================================================
    // ACTIONS - Action Phase
    // ========================================================================

    performAction: action.performAction,
    calculateEncampCost: action.calculateEncampCost,
    validateDemolish: action.validateDemolish,
    advanceActionTurn: action.advanceActionTurn,

    // ========================================================================
    // ACTIONS - Threat Phase
    // ========================================================================

    increaseThreat,
    detectThreatRules: threat.detectThreatRules,
    checkForThreatRules: threat.checkForThreatRules,
    resolveThreatPhaseLocationRules: threat.resolveThreatPhaseLocationRules,
    handleThreatCheckConfirm: threat.handleThreatCheckConfirm,
    handleThreatPrevention: threat.handleThreatPrevention,
    handleThreatAcceptance: threat.handleThreatAcceptance,
    handleResupplyReductionAccept: threat.handleResupplyReductionAccept,
    handleResupplyReductionDecline: threat.handleResupplyReductionDecline,

    // ========================================================================
    // ACTIONS - Victory
    // ========================================================================

    enableExtendedMode: victory.enableExtendedMode,

    // ========================================================================
    // ACTIONS - Import/Export (Issue #23)
    // ========================================================================

    loadCampaign: importExport.loadCampaign,
    setImportModalOpen: (open: boolean) => {
      const newState = importExport.setImportModalOpen(open)
      setImportModalOpen(newState.importModalOpen)
    },

    // ========================================================================
    // ACTIONS - Audit Trail (Issue #23 - Phase 3)
    // ========================================================================

    getHexHistory: audit.getHexHistory,
    getPlayerActions: audit.getPlayerActions,
    exportAuditLog: audit.exportAuditLog,

    // ========================================================================
    // ACTIONS - Portal & Hex Blocking (Issue #59)
    // ========================================================================

    handlePortalConfig,
    handleCancelPortalConfig,
    handleHexBlock,
    handleCancelHexBlock,

    // ========================================================================
    // ACTIONS - Phase Transition & Round Summary
    // ========================================================================

    nextPhase,
    continuePastRoundSummary,
    setShowRoundSummary,

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================

    validateMapState: () => {
      const { validateMapState } = require('@/lib/utils/mapValidation')
      return validateMapState(state.hexes, state.players)
    },
  }
}
