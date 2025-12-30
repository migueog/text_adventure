'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useCampaign } from '@/hooks/useCampaign'
import { useCampaignStore } from '@/store/campaign'
import { generateExportData, exportCampaignJSON } from '@/lib/utils/campaignExport'
import GameSetup from '@/components/GameSetup'
import PlayerPanel from '@/components/PlayerPanel'
import PhaseTracker from '@/components/PhaseTracker'
import DiceRoller from '@/components/DiceRoller'
import EventLog from '@/components/EventLog'
import HexDetails from '@/components/HexDetails'
import VictoryScreen from '@/components/VictoryScreen'
import CampaignEndModal from '@/components/CampaignEndModal'
import ExplorationResultModal from '@/components/ExplorationResultModal'
import ThreatMeter from '@/components/ThreatMeter'

// Dynamically import Phaser component with no SSR
const PhaserHexMap = dynamic(() => import('@/components/PhaserHexMap'), {
  ssr: false,
  loading: () => <div className="phaser-loading">Loading map...</div>
})

/**
 * WHY: Main game page - uses both old hook and new Zustand store during migration
 */
export default function Home() {
  const campaign = useCampaign()

  // WHY: GameSetup uses Zustand for campaign creation
  const gameStarted = useCampaignStore((state) => state.gameStarted)

  // WHY: Campaign end modal and victory screen state management
  const [showEndModal, setShowEndModal] = useState(false)
  const [showVictoryScreen, setShowVictoryScreen] = useState(false)

  // WHY: Show campaign end modal when game ends
  useEffect(() => {
    if (campaign.gameEnded && !showVictoryScreen) {
      setShowEndModal(true)
    } else if (!campaign.gameEnded) {
      // Reset modal state if game continues (extended mode)
      setShowEndModal(false)
    }
  }, [campaign.gameEnded, showVictoryScreen])

  const handleHexClick = (hex: any) => {
    campaign.setSelectedHex(hex.id === campaign.selectedHex ? null : hex.id)
  }

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

  // WHY: Show setup screen if game hasn't started (check Zustand store)
  if (!gameStarted) {
    return <GameSetup />
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
      />
    )
  }

  const currentPlayer = campaign.players[campaign.currentPlayerIndex] || null

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ctesiphus Expedition</h1>
        <div className="header-info">
          <span>Round {campaign.currentRound}</span>
          <span className="divider">|</span>
          <span>Threat: {campaign.threatLevel}/{campaign.targetThreatLevel}</span>
          <span className="divider">|</span>
          <span style={{ color: currentPlayer?.color }}>
            {currentPlayer?.name}&apos;s Turn
          </span>
        </div>
      </header>

      <main className="app-main">
        <aside className="sidebar left">
          <PlayerPanel
            players={campaign.players}
            currentPlayerIndex={campaign.currentPlayerIndex}
            currentPhase={campaign.currentPhase}
            onUpdatePlayer={campaign.updatePlayer}
          />
          <ThreatMeter
            currentThreat={campaign.threatLevel}
            targetThreat={campaign.targetThreatLevel}
            soloMode={campaign.soloMode}
          />
          <DiceRoller />
        </aside>

        <section className="center-content">
          <PhaserHexMap
            hexes={campaign.hexes}
            players={campaign.players}
            mapConfig={campaign.mapConfig}
            selectedHex={campaign.selectedHex}
            onHexClick={handleHexClick}
            currentPlayerIndex={campaign.currentPlayerIndex}
          />
        </section>

        <aside className="sidebar right">
          <PhaseTracker
            currentPhase={campaign.currentPhase}
            currentRound={campaign.currentRound}
            currentPlayer={currentPlayer}
            players={campaign.players}
            hexes={campaign.hexes}
            threatLevel={campaign.threatLevel}
            targetThreatLevel={campaign.targetThreatLevel}
            battleCompleted={campaign.battleCompleted}
            movementOrder={campaign.movementOrder}
            movementIndex={campaign.movementIndex}
            onNextPhase={campaign.nextPhase}
            onMove={campaign.movePlayer}
            onAction={campaign.performAction}
            onBattle={campaign.recordBattle}
            calculateEncampCost={campaign.calculateEncampCost}
          />
          <HexDetails
            hex={campaign.selectedHex ? campaign.hexes[campaign.selectedHex] : undefined}
            players={campaign.players}
          />
        </aside>
      </main>

      <footer className="app-footer">
        <EventLog events={campaign.eventLog} />
      </footer>

      {/* Exploration Result Modal */}
      {campaign.explorationResult && (
        <ExplorationResultModal
          result={campaign.explorationResult}
          onClose={campaign.clearExplorationResult}
        />
      )}
    </div>
  )
}
