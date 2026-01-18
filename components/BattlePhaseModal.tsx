'use client'

import { useState } from 'react'
import type { Player } from '@/types/campaign'
import type { ActiveBattleCondition, KillzoneRecommendation } from '@/types/battleCondition'
import type { ExtendedBattleRecord } from '@/types/battle'
import BattleForm from '@/components/BattleForm'
import BattleConditionDisplay from '@/components/BattleConditionDisplay'
import MissingPlayerModal from '@/components/MissingPlayerModal'

interface BattlePhaseModalProps {
  isOpen: boolean
  currentPlayer: Player
  players: Player[]
  currentRound: number
  battleCompleted: boolean
  soloMode: boolean
  conditionEnabled: boolean
  selectedOpponentId: number | null
  onConditionEnabledChange: (enabled: boolean) => void
  onOpponentSelect: (opponentId: number | null) => void
  getActiveBattleCondition: (opponentId: number | null) => {
    condition: ActiveBattleCondition
    killzone: KillzoneRecommendation | null
  } | null
  onBattle: (record: Omit<ExtendedBattleRecord, 'round' | 'timestamp'>) => void
  onClose: () => void
  onRecordMissingPlayer?: (presentPlayerId: number, absentPlayerId: number) => void
}

/**
 * WHY: Modal dialog for Battle Phase (extracted from PhaseTracker/BattlePhase.tsx)
 * Displays during Battle phase with battle recording form and condition display
 * Simplified modal version focused on core battle functionality
 */
export default function BattlePhaseModal({
  isOpen,
  currentPlayer,
  players,
  currentRound,
  battleCompleted,
  soloMode,
  conditionEnabled,
  selectedOpponentId,
  onConditionEnabledChange,
  onOpponentSelect,
  getActiveBattleCondition,
  onBattle,
  onClose,
  onRecordMissingPlayer
}: BattlePhaseModalProps) {
  // WHY: Missing player modal state
  const [showMissingPlayerModal, setShowMissingPlayerModal] = useState(false)

  if (!isOpen) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content battle-phase-modal">
        <div className="modal-header">
          <h3>{soloMode ? '🎯 Battle Phase (Solo Campaign)' : '⚔️ Battle Phase'}</h3>
          <button
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {renderBattleInstructions(soloMode)}
          {renderBattleCondition(getActiveBattleCondition, selectedOpponentId, conditionEnabled, onConditionEnabledChange, currentRound)}
          {renderBattleCompletionStatus(battleCompleted)}

          <BattleForm
            currentPlayerId={currentPlayer.id}
            players={players.map(p => ({ id: p.id, name: p.name, color: p.color }))}
            currentRound={currentRound}
            onRecordBattle={onBattle}
            onOpponentSelect={onOpponentSelect}
          />

          {renderMissingPlayerSection(onRecordMissingPlayer, players, () => setShowMissingPlayerModal(true))}
        </div>

        {renderMissingPlayerModal(
          onRecordMissingPlayer,
          showMissingPlayerModal,
          currentPlayer,
          players,
          setShowMissingPlayerModal
        )}
      </div>
    </div>
  )
}

/**
 * WHY: Extract battle instructions to keep main component under 20 lines
 */
function renderBattleInstructions(soloMode: boolean): JSX.Element {
  return (
    <div className="battle-instructions">
      <p><strong>Play against:</strong></p>
      <ul>
        {!soloMode && <li>Another campaign player, OR</li>}
        <li>Any non-campaign opponent, OR</li>
        <li>Joint Ops NPC mission</li>
      </ul>
    </div>
  )
}

/**
 * WHY: Extract battle condition rendering to keep function size under 20 lines
 */
function renderBattleCondition(
  getActiveBattleCondition: (opponentId: number | null) => {
    condition: ActiveBattleCondition
    killzone: KillzoneRecommendation | null
  } | null,
  selectedOpponentId: number | null,
  conditionEnabled: boolean,
  onConditionEnabledChange: (enabled: boolean) => void,
  currentRound: number
): JSX.Element {
  const conditionData = getActiveBattleCondition(selectedOpponentId)
  return (
    <BattleConditionDisplay
      activeCondition={conditionData?.condition ?? null}
      killzoneRecommendation={conditionData?.killzone ?? null}
      conditionEnabled={conditionEnabled}
      onToggleCondition={onConditionEnabledChange}
      round={currentRound}
    />
  )
}

/**
 * WHY: Extract battle completion status to keep function size under 20 lines
 */
function renderBattleCompletionStatus(battleCompleted: boolean): JSX.Element {
  if (!battleCompleted) {
    return (
      <div className="alert alert-warning">
        ⚠️ <strong>Required:</strong> You must record a battle result before advancing to the next phase.
      </div>
    )
  }

  return (
    <div className="alert alert-success">
      ✅ Battle result recorded. You may advance to the next phase.
    </div>
  )
}

/**
 * WHY: Extract missing player section to keep function size under 20 lines
 */
function renderMissingPlayerSection(
  onRecordMissingPlayer: ((presentPlayerId: number, absentPlayerId: number) => void) | undefined,
  players: Player[],
  onOpenModal: () => void
): JSX.Element | null {
  if (!onRecordMissingPlayer || players.length <= 1) {
    return null
  }

  return (
    <div className="missing-opponent-section">
      <button
        type="button"
        className="action-btn secondary"
        onClick={onOpenModal}
      >
        Record Missing Opponent
      </button>
    </div>
  )
}

/**
 * WHY: Extract missing player modal to keep function size under 20 lines
 */
function renderMissingPlayerModal(
  onRecordMissingPlayer: ((presentPlayerId: number, absentPlayerId: number) => void) | undefined,
  showMissingPlayerModal: boolean,
  currentPlayer: Player,
  players: Player[],
  setShowMissingPlayerModal: (show: boolean) => void
): JSX.Element | null {
  if (!onRecordMissingPlayer) {
    return null
  }

  return (
    <MissingPlayerModal
      isOpen={showMissingPlayerModal}
      currentPlayer={{ id: currentPlayer.id, name: currentPlayer.name, color: currentPlayer.color }}
      otherPlayers={players
        .filter(p => p.id !== currentPlayer.id)
        .map(p => ({ id: p.id, name: p.name, color: p.color }))}
      onConfirm={(absentPlayerId) => {
        onRecordMissingPlayer(currentPlayer.id, absentPlayerId)
        setShowMissingPlayerModal(false)
      }}
      onCancel={() => setShowMissingPlayerModal(false)}
    />
  )
}
