'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useCampaign } from '@/hooks/useCampaign'
import { useCampaignRole } from '@/hooks/useCampaignRole'
import { useCampaignStore } from '@/store/campaign'
import { MAP_CONFIGS } from '@/lib/data/campaignData'
import { generateExportData, exportCampaignJSON } from '@/lib/utils/campaignExport'
import type { Phase } from '@/types/campaign'
import CampaignList from '@/components/CampaignList'
import CampaignLobby from '@/components/CampaignLobby'
import CampaignSettings from '@/components/CampaignSettings'
import GameSetup from '@/components/GameSetup'
import VictoryScreen from '@/components/VictoryScreen'
import CampaignEndModal from '@/components/CampaignEndModal'
import ExplorationResultModal from '@/components/ExplorationResultModal'
import RoundSummaryModal from '@/components/RoundSummaryModal'
import ThreatCheckDialog from '@/components/ThreatCheckDialog'
import ThreatPreventionDialog from '@/components/ThreatPreventionDialog'
// WHY: New collapsible menu components
import EnhancedHeader from '@/components/EnhancedHeader'
import CollapsibleMenu from '@/components/CollapsibleMenu'
import LeftMenuTabs from '@/components/LeftMenuTabs'
// WHY: Phase-specific modals
import BattlePhaseModal from '@/components/BattlePhaseModal'
import ThreatPhaseModal from '@/components/ThreatPhaseModal'
// import ResupplyReductionDialog from '@/components/ResupplyReductionDialog' // Commented out until useThreatPhase implements resupply reduction
import HexContextMenu from '@/components/HexContextMenu'
import PlayerSelectorModal from '@/components/PlayerSelectorModal'
import Toast, { type ToastType } from '@/components/Toast'
import { getPlayersInHex, selectPlayerInHex, calculateHexCenter } from '@/lib/utils/hexClickHelpers'
import { getAvailableActions } from '@/lib/utils/hexActionValidation'
import { filterActionsByPhase, filterActionsByOwnership, filterActionsByState } from '@/lib/utils/contextMenuFilters'

// Dynamically import Phaser component with no SSR
const PhaserHexMap = dynamic(() => import('@/components/PhaserHexMap'), {
  ssr: false,
  loading: () => <div className="phaser-loading">Loading map...</div>
})

/**
 * WHY: Main game page with campaign selection and game UI
 *
 * Flow:
 * 1. Show campaign dashboard (selectedCampaignId === null)
 * 2. Show GameSetup when creating new (selectedCampaignId === 'new')
 * 3. Show game UI when campaign loaded (selectedCampaignId === number)
 */
export default function Home() {
  const campaign = useCampaign()

  // WHY: Campaign selection state - read from URL and persist to URL
  const [selectedCampaignId, setSelectedCampaignId] = useState<null | 'new' | number>(() => {
    // WHY: Initialize from URL parameter on first render
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const campaignId = params.get('campaign')

      if (campaignId === 'new') return 'new'
      if (campaignId) {
        const id = parseInt(campaignId, 10)
        if (!isNaN(id)) return id
      }
    }
    return null
  })

  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false)
  const [campaignLoaded, setCampaignLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // WHY: Update URL when campaign selection changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (selectedCampaignId === null) {
      // WHY: Clear URL when returning to dashboard
      window.history.replaceState({}, '', '/')
    } else if (selectedCampaignId === 'new') {
      // WHY: Show 'new' in URL when creating campaign
      window.history.replaceState({}, '', '/?campaign=new')
    } else {
      // WHY: Keep campaign ID in URL so refreshes work
      window.history.replaceState({}, '', `/?campaign=${selectedCampaignId}`)
    }
  }, [selectedCampaignId])

  // WHY: Access Zustand store for campaign loading
  const loadCampaign = useCampaignStore((state) => state.loadCampaign)

  // WHY: Get Zustand data for PhaserHexMap (needed during migration)
  const zustandPlayerCount = useCampaignStore((state) => state.playerCount)
  const zustandPlayers = useCampaignStore((state) => state.players)
  const zustandHexes = useCampaignStore((state) => state.hexes)
  const zustandCampaignId = useCampaignStore((state) => state.campaignId)

  // WHY: Memoize lengths to prevent creating new objects on every render
  // This prevents the sync effect from running unnecessarily
  const zustandPlayersLength = useMemo(() => zustandPlayers.length, [zustandPlayers])
  const zustandHexesLength = useMemo(() => Object.keys(zustandHexes).length, [zustandHexes])

  // WHY: Load campaign when ID is selected
  useEffect(() => {
    if (typeof selectedCampaignId === 'number') {
      setIsLoadingCampaign(true)
      setCampaignLoaded(false)
      setLoadError(null)

      loadCampaign(selectedCampaignId)
        .then(() => {
          setCampaignLoaded(true)
          setIsLoadingCampaign(false)
        })
        .catch((error) => {
          setLoadError(error.message || 'Failed to load campaign')
          setIsLoadingCampaign(false)
        })
    } else {
      // WHY: Reset state when navigating away from campaign
      setCampaignLoaded(false)
      setLoadError(null)
    }
  }, [selectedCampaignId, loadCampaign])

  // WHY: Sync Zustand store data into local campaign state after load
  // CRITICAL FIX: useCampaign uses local state, but loadCampaign updates Zustand store
  // Without this sync, PlayerPanel and other components show empty data
  // FIX: Always sync when campaign is loaded, don't check if local state is empty
  // This ensures positions persist after page refresh
  useEffect(() => {
    if (!isLoadingCampaign && campaignLoaded && zustandCampaignId === selectedCampaignId) {
      console.log('[App] Syncing Zustand data to local campaign state')
      console.log('[App] Zustand players:', zustandPlayersLength, 'Local players:', campaign.players.length)
      console.log('[App] Zustand hexes:', zustandHexesLength, 'Local hexes:', Object.keys(campaign.hexes).length)

      // WHY: Always sync when campaign is loaded - don't check if local state is empty
      // This fixes position reset bug by ensuring Zustand data (from database) overwrites stale local state
      // Guard: Only update if data is actually different to prevent render-during-render warnings
      if (zustandPlayersLength > 0 && campaign.players.length !== zustandPlayersLength) {
        campaign.setPlayers(zustandPlayers)
      }
      if (zustandHexesLength > 0 && Object.keys(campaign.hexes).length !== zustandHexesLength) {
        campaign.setHexes(zustandHexes)
      }
    }
    // WHY: Use memoized primitive values in dependency array to prevent unnecessary re-renders
    // zustandCampaignId triggers sync when Zustand loads new campaign data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingCampaign, campaignLoaded, zustandCampaignId, selectedCampaignId, zustandPlayersLength, zustandHexesLength])

  // WHY: Solo mode banner data (Issue #53)
  const soloMode = useCampaignStore((state) => state.soloMode)
  const soloBannerPlayers = useCampaignStore((state) => state.players)
  const soloBannerThreat = useCampaignStore((state) => state.threatLevel)

  // WHY: Calculate mapConfig from Zustand playerCount (temporary fix during migration)
  const zustandMapConfig = MAP_CONFIGS[zustandPlayerCount as keyof typeof MAP_CONFIGS] || null

  // WHY: Campaign end modal and victory screen state management
  const [showEndModal, setShowEndModal] = useState(false)
  const [showVictoryScreen, setShowVictoryScreen] = useState(false)

  // WHY: Settings modal state (Phase 3)
  const [showSettings, setShowSettings] = useState(false)

  // WHY: Player selector modal state for multi-player hexes
  const [playerModalOpen, setPlayerModalOpen] = useState(false)
  const [playerModalPlayers, setPlayerModalPlayers] = useState<any[]>([])

  // WHY: Battle phase UI state for condition toggle and opponent selection
  const [conditionEnabled, setConditionEnabled] = useState(true)
  const [selectedOpponentId, setSelectedOpponentId] = useState<number | null>(null)

  // WHY: Toast notification state for user feedback (Phase 1 - Issue #33)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<ToastType>('info')

  // WHY: Fetch user's role, campaign metadata, and players list (Phase 2-3)
  // IMPORTANT: Must be called at top level, not after conditional returns
  const { isOwner, isPlayer, campaign: campaignMeta, players, isLoading: isRoleLoading } = useCampaignRole(
    typeof selectedCampaignId === 'number' ? selectedCampaignId : null
  )

  // WHY: Show campaign end modal when game ends
  useEffect(() => {
    if (campaign.gameEnded && !showVictoryScreen) {
      setShowEndModal(true)
    } else if (!campaign.gameEnded) {
      // Reset modal state if game continues (extended mode)
      setShowEndModal(false)
    }
  }, [campaign.gameEnded, showVictoryScreen])

  /**
   * WHY: Show toast notification to user
   * Used to provide feedback when hex clicks fail validation
   */
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToastMessage(message)
    setToastType(type)
  }, [])

  /**
   * WHY: Dismiss toast notification
   */
  const dismissToast = useCallback(() => {
    setToastMessage(null)
  }, [])

  /**
   * WHY: Handle source hex selection (first click)
   * Auto-selects current player if present, or triggers modal for multi-player hexes
   * Shows toast feedback when clicking empty hex
   */
  const handleSourceHexSelection = useCallback((hexId: string) => {
    const playersInHex = getPlayersInHex(hexId, campaign.players)

    if (playersInHex.length === 0) {
      // WHY: Show toast to guide user when clicking empty hex
      showToast('Select a hex with your player first', 'info')
      campaign.resetHexSelection()
      return
    }

    const setModalState = (open: boolean, players: any[]) => {
      setPlayerModalOpen(open)
      setPlayerModalPlayers(players)
    }

    const selectedPlayer = selectPlayerInHex(
      playersInHex,
      campaign.currentPlayerIndex,
      setModalState
    )

    if (selectedPlayer) {
      const menuPos = calculateHexCenter(hexId)
      campaign.setSourceHex(hexId, selectedPlayer.id, menuPos)
    }
  }, [campaign, showToast])

  /**
   * WHY: Handle target hex selection (second click)
   * Shows context menu with available actions
   */
  const handleTargetHexSelection = useCallback((hexId: string) => {
    if (campaign.hexSelection.sourceHex === hexId) {
      // Toggle off if clicking same hex
      campaign.resetHexSelection()
      return
    }

    const menuPos = calculateHexCenter(hexId)
    campaign.setTargetHex(hexId, menuPos)
  }, [campaign])

  /**
   * WHY: Main hex click handler with dual-selection logic
   * Type fixed: accepts hexId string (from Phaser) instead of Hex object
   * Shows toast feedback for invalid phase clicks
   */
  const handleHexClick = useCallback((hexId: string) => {
    const hex = campaign.hexes[hexId]
    if (!hex) {
      campaign.resetHexSelection()
      return
    }

    // WHY: Prevent hex actions during Battle and Threat phases
    if (campaign.currentPhase === 'Battle' || campaign.currentPhase === 'Threat') {
      showToast(`Hex actions not available in ${campaign.currentPhase} phase`, 'warning')
      return
    }

    if (!campaign.hexSelection.sourceHex) {
      handleSourceHexSelection(hexId)
    } else {
      handleTargetHexSelection(hexId)
    }
  }, [campaign, handleSourceHexSelection, handleTargetHexSelection, showToast])

  /**
   * WHY: Handle player selection from modal
   */
  const handlePlayerSelect = useCallback((playerId: number) => {
    const hexId = campaign.hexSelection.sourceHex
    if (!hexId) return

    const menuPos = calculateHexCenter(hexId)
    campaign.setSourceHex(hexId, playerId, menuPos)
    setPlayerModalOpen(false)
  }, [campaign])

  /**
   * WHY: Calculate available actions for hex context menu
   * Recomputes when selection state or game state changes
   * IMPORTANT: Must be declared before executeHexAction to avoid hoisting error
   */
  const availableActions = useMemo(() => {
    const selection = campaign.hexSelection

    if (!selection.sourceHex || selection.selectedPlayerId === null) {
      return []
    }

    const player = campaign.players[selection.selectedPlayerId]
    if (!player) return []

    // WHY: Get base actions from validation
    let actions = getAvailableActions(
      selection.sourceHex,
      selection.targetHex,
      player,
      campaign.hexes,
      campaign.players,
      campaign.currentPhase
    )

    // WHY: Apply smart filters in sequence
    const sourceHex = campaign.hexes[selection.sourceHex]
    if (!sourceHex) return []

    actions = filterActionsByPhase(actions, campaign.currentPhase as Phase)
    actions = filterActionsByOwnership(actions, player, sourceHex, campaign.hexes)
    actions = filterActionsByState(actions, player, sourceHex, campaign.hexes)

    return actions
  }, [campaign.hexSelection, campaign.players, campaign.hexes, campaign.currentPhase])

  /**
   * WHY: Route action to appropriate hook based on action type
   * Keeps executeHexAction under 20 lines by extracting routing logic
   */
  const routeActionToHook = useCallback((actionType: string, cost: number) => {
    const selection = campaign.hexSelection
    const playerId = selection.selectedPlayerId

    if (playerId === null) return

    switch (actionType) {
      case 'move':
        campaign.movePlayer(playerId, selection.targetHex!, cost)
        break
      case 'hold':
        campaign.holdPosition(playerId)
        break
      case 'scout':
        campaign.performAction('scout', {
          targetHex: selection.targetHex,
          distance: cost,
        })
        break
      case 'search':
        campaign.performAction('search', {})
        break
      case 'encamp':
        campaign.performAction('encamp', {
          options: { cost },
        })
        break
      case 'resupply':
        campaign.performAction('resupply', {})
        break
      case 'regroup':
        campaign.regroupPlayer(playerId)
        break
    }
  }, [campaign])

  /**
   * WHY: Execute hex-based action from context menu
   * Validates action, routes to appropriate hook, updates selection
   * For move/regroup actions, selects the new hex; otherwise resets
   */
  const executeHexAction = useCallback((actionType: string) => {
    const selection = campaign.hexSelection

    if (!selection.sourceHex || selection.selectedPlayerId === null) return

    const player = campaign.players[selection.selectedPlayerId]
    if (!player) return

    const action = availableActions.find(a => a.type === actionType)
    if (!action || !action.valid) return

    routeActionToHook(actionType, action.cost)

    // WHY: After move, select the new hex (where player moved to); otherwise reset
    if (actionType === 'move' && selection.targetHex) {
      const menuPos = calculateHexCenter(selection.targetHex)
      campaign.setSourceHex(selection.targetHex, selection.selectedPlayerId, menuPos)
    } else {
      campaign.resetHexSelection()
    }
  }, [campaign, availableActions, routeActionToHook])

  const handleRestart = () => {
    window.location.reload()
  }

  // WHY: Handler for "View Final Scores" button in campaign end modal
  const handleViewScores = useCallback(() => {
    setShowEndModal(false)
    setShowVictoryScreen(true)
  }, [])

  // WHY: Handler for "Continue Campaign" button - enables extended mode
  const handleContinueCampaign = useCallback(() => {
    campaign.enableExtendedMode()
    setShowEndModal(false)
  }, [campaign])

  // WHY: Export campaign data as JSON file
  const handleExportCampaign = useCallback(() => {
    const victoryCategories = {
      Warlord: campaign.players[0]?.name || '',
      Explorer: campaign.players[0]?.name || '',
      Headhunter: campaign.players[0]?.name || '',
      Pioneer: campaign.players[0]?.name || '',
      Trooper: campaign.players[0]?.name || ''
    }

    const exportData = generateExportData(
      campaign.threatLevel,
      campaign.targetThreatLevel,
      campaign.currentRound,
      campaign.currentPhase,
      campaign.hexes,
      campaign.players,
      campaign.eventLog,
      victoryCategories,
      campaign.players[0]?.name || ''
    )

    exportCampaignJSON(exportData)
  }, [campaign])

  // WHY: Show campaign dashboard when no campaign selected
  if (selectedCampaignId === null) {
    return (
      <CampaignList
        onSelectCampaign={(id) => setSelectedCampaignId(id)}
        onCreateNew={() => setSelectedCampaignId('new')}
      />
    )
  }

  // WHY: Show loading state while campaign is being fetched from database
  if (isLoadingCampaign) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        gap: '1rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid var(--border-color)',
          borderTop: '3px solid var(--accent-blue)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading campaign...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // WHY: Show GameSetup when creating new campaign
  if (selectedCampaignId === 'new') {
    return <GameSetup onCancel={() => setSelectedCampaignId(null)} />
  }

  // WHY: Show error state if campaign failed to load
  if (loadError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        gap: '1rem',
        padding: '2rem'
      }}>
        <div style={{
          fontSize: '2rem',
          color: 'var(--accent-red, #ef4444)'
        }}>⚠️</div>
        <h2 style={{ margin: 0 }}>Failed to Load Campaign</h2>
        <p style={{
          color: 'var(--text-secondary)',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          {loadError}
        </p>
        <button
          onClick={() => setSelectedCampaignId(null)}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--accent-blue, #3b82f6)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Back to Campaign List
        </button>
      </div>
    )
  }

  // WHY: Don't render game UI until campaign is fully loaded
  if (!campaignLoaded) {
    return null
  }

  // WHY: Wait for role information to load
  if (isRoleLoading || !campaignMeta) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}>
        Loading campaign information...
      </div>
    )
  }

  // WHY: Handlers for campaign lobby actions (Phase 3)
  const handleStartCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignMeta.id}/start`, {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start campaign')
      }

      // WHY: Reload to show active campaign state
      window.location.reload()
    } catch (error: any) {
      console.error('Start campaign error:', error)
      alert(error.message || 'Failed to start campaign')
    }
  }

  const handleLeaveCampaign = async () => {
    // TODO: Call API to remove player from campaign
    // For now, just navigate back to dashboard
    setSelectedCampaignId(null)
  }

  // WHY: Show campaign lobby if status is 'setup' (Phase 4)
  if (campaignMeta.status === 'setup') {
    return (
      <CampaignLobby
        campaign={campaignMeta}
        players={players}
        isOwner={isOwner}
        onStartCampaign={handleStartCampaign}
        onLeaveCampaign={handleLeaveCampaign}
        onBackToDashboard={() => setSelectedCampaignId(null)}
      />
    )
  }

  // WHY: Show campaign end modal when game reaches target threat
  if (showEndModal) {
    return (
      <CampaignEndModal
        threatLevel={campaign.threatLevel}
        targetThreatLevel={campaign.targetThreatLevel}
        currentRound={campaign.currentRound}
        onViewScores={handleViewScores}
        onContinue={handleContinueCampaign}
      />
    )
  }

  // WHY: Show victory screen after user clicks "View Final Scores"
  if (showVictoryScreen) {
    return (
      <VictoryScreen
        players={campaign.players}
        hexMap={campaign.hexes}
        currentRound={campaign.currentRound}
        threatLevel={campaign.threatLevel}
        targetThreatLevel={campaign.targetThreatLevel}
        onRestart={handleRestart}
        onExport={handleExportCampaign}
        soloMode={campaign.soloMode}
        soloVictory={campaign.soloVictory}
      />
    )
  }

  const currentPlayer = campaign.players[campaign.currentPlayerIndex] || null

  return (
    <div className="app">
      {/* WHY: Enhanced header consolidates all essential campaign info */}
      <EnhancedHeader
        phase={campaign.currentPhase as Phase}
        currentPlayer={currentPlayer}
        round={campaign.currentRound}
        threatLevel={campaign.threatLevel}
        targetThreat={campaign.targetThreatLevel}
        isOwner={isOwner}
        isSoloMode={campaign.soloMode}
        campaignPoints={campaign.soloMode ? (soloBannerPlayers[0]?.campaignPoints ?? 0) : undefined}
        onSettingsClick={() => setShowSettings(true)}
      />

      {/* WHY: Show solo mode indicator if in solo campaign (Issue #53) */}
      {soloMode && (
        <div className="solo-mode-banner">
          <div className="solo-icon">🎯</div>
          <div className="solo-info">
            <strong>SOLO CAMPAIGN MODE</strong>
            <p className="solo-goal">
              Goal: Reach 10+ CP before Threat Level 10
            </p>
          </div>
          <div className="solo-progress">
            <div className="solo-stat">
              <label>Campaign Points:</label>
              <span className={(soloBannerPlayers[0]?.campaignPoints ?? 0) >= 10 ? 'goal-reached' : ''}>
                {soloBannerPlayers[0]?.campaignPoints ?? 0}/10
              </span>
            </div>
            <div className="solo-stat">
              <label>Threat Level:</label>
              <span className={soloBannerThreat >= 9 ? 'danger' : ''}>
                {soloBannerThreat}/10
              </span>
            </div>
          </div>
        </div>
      )}

      <main className="app-main">
        {/* WHY: Collapsible menu replaces fixed left sidebar */}
        <CollapsibleMenu>
          <LeftMenuTabs
            players={campaign.players}
            selectedHex={campaign.selectedHex ? (campaign.hexes[campaign.selectedHex] ?? null) : null}
            eventLog={campaign.eventLog}
            standings={{}}
            isSoloMode={campaign.soloMode}
          />
        </CollapsibleMenu>

        {/* WHY: Map expands to fill remaining space */}
        <section className="center-content">
          <PhaserHexMap
            hexes={campaign.hexes}
            players={campaign.players}
            mapConfig={zustandMapConfig}
            selectedHex={campaign.selectedHex}
            onHexClick={handleHexClick}
            currentPlayerIndex={campaign.currentPlayerIndex}
            regroupPath={campaign.regroupPath}
            hexSelection={campaign.hexSelection}
          />
        </section>
      </main>

      {/* Exploration Result Modal */}
      {campaign.explorationResult && (
        <ExplorationResultModal
          result={campaign.explorationResult}
          onClose={campaign.clearExplorationResult}
        />
      )}

      {/* Round Summary Modal */}
      {campaign.pendingRoundSummary && (
        <RoundSummaryModal
          roundNumber={campaign.currentRound}
          statistics={campaign.pendingRoundSummary}
          players={campaign.players}
          onContinue={campaign.continuePastRoundSummary}
          onDisable={() => {
            campaign.setShowRoundSummary(false)
            campaign.continuePastRoundSummary()
          }}
        />
      )}

      {/* Threat Check Dialog (Issue #54) */}
      {campaign.showThreatCheckResultDialog && campaign.pendingThreatCheckResult && (
        <ThreatCheckDialog
          isOpen={campaign.showThreatCheckResultDialog}
          result={campaign.pendingThreatCheckResult}
          currentThreat={campaign.threatLevel}
          onConfirm={campaign.handleThreatCheckResultConfirm}
        />
      )}

      {/* Threat Prevention Dialog (Issue #54) */}
      {campaign.showThreatCheckResultDialog && campaign.pendingThreatCheckResult && (
        <ThreatPreventionDialog
          isOpen={campaign.showThreatCheckResultDialog}
          result={campaign.pendingThreatCheckResult}
          currentThreat={campaign.threatLevel}
          playerSP={campaign.players[campaign.currentPlayerIndex]?.supplyPoints || 0}
          onPrevent={campaign.handleThreatPrevention}
          onAccept={campaign.handleThreatCheckResultConfirm}
        />
      )}

      {/* Resupply Reduction Dialog (Issue #54) - COMMENTED OUT: Properties not yet implemented in useThreatPhase
      {campaign.showResupplyReductionDialog && campaign.pendingResupplyReduction && (
        <ResupplyReductionDialog
          isOpen={campaign.showResupplyReductionDialog}
          result={campaign.pendingResupplyReduction}
          currentThreat={campaign.threatLevel}
          onAccept={campaign.handleResupplyReductionAccept}
          onDecline={campaign.handleResupplyReductionDecline}
        />
      )}
      */}

      {/* Battle Phase Modal */}
      {currentPlayer && (
        <BattlePhaseModal
          isOpen={campaign.currentPhase === 'Battle'}
          currentPlayer={currentPlayer}
          players={campaign.players}
          currentRound={campaign.currentRound}
          battleCompleted={campaign.battleCompleted}
          soloMode={campaign.soloMode}
          conditionEnabled={conditionEnabled}
          selectedOpponentId={selectedOpponentId}
          onConditionEnabledChange={setConditionEnabled}
          onOpponentSelect={setSelectedOpponentId}
          getActiveBattleCondition={campaign.getActiveBattleCondition}
          onBattle={campaign.recordBattle}
          onClose={() => {/* WHY: Modal auto-closes when phase advances */}}
          onRecordMissingPlayer={campaign.recordMissingPlayer}
        />
      )}

      {/* Threat Phase Modal */}
      {currentPlayer && (
        <ThreatPhaseModal
          isOpen={campaign.currentPhase === 'Threat'}
          currentPlayer={currentPlayer}
          players={campaign.players}
          threatLevel={campaign.threatLevel}
          targetThreatLevel={campaign.targetThreatLevel}
          threatWarning={campaign.threatWarning}
          soloMode={campaign.soloMode}
          onNextPhase={campaign.nextPhase}
          onClose={() => {/* WHY: Modal auto-closes when phase advances */}}
          activeThreatRules={campaign.activeThreatRules}
          threatRulesResolved={campaign.threatRulesResolved}
          onResolveThreatRules={campaign.resolveThreatPhaseLocationRules}
          hasActiveThreatAttacks={false /* TODO: Implement threat attacks detection */}
          onResolveThreatAttacks={() => {/* TODO: Implement threat attacks in useCampaign */}}
        />
      )}

      {/* Hex Context Menu */}
      {campaign.hexSelection.targetHex && campaign.hexSelection.menuPosition && (
        <HexContextMenu
          position={campaign.hexSelection.menuPosition}
          actions={availableActions}
          onAction={executeHexAction}
          onCancel={campaign.resetHexSelection}
        />
      )}

      {/* Player Selector Modal */}
      {playerModalOpen && (
        <PlayerSelectorModal
          players={playerModalPlayers}
          onSelect={handlePlayerSelect}
          onCancel={() => setPlayerModalOpen(false)}
        />
      )}

      {/* Campaign Settings Modal (Phase 3) */}
      <CampaignSettings
        campaignId={campaignMeta.id}
        currentName={campaignMeta.name}
        currentMaxPlayers={campaignMeta.settings.playerCount}
        currentTargetThreat={campaignMeta.settings.targetThreatLevel}
        currentPlayerCount={campaign.players.length}
        campaignStatus={campaignMeta.status}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSaved={() => {
          setShowSettings(false)
          // Reload campaign data to reflect changes
          window.location.reload()
        }}
      />

      {/* Toast Notification (Phase 1 - Issue #33) */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onDismiss={dismissToast}
        />
      )}
    </div>
  )
}
