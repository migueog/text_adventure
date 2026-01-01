'use client'

import { useState, useMemo } from 'react'
import type { Player, Hex, SearchRule, HexPosition, ThreatWarningLevel, ActiveThreatPhaseRule } from '@/types/campaign'
import { PHASES, SURFACE_LOCATIONS, TOMB_LOCATIONS, SURFACE_CONDITIONS, TOMB_CONDITIONS } from '@/lib/data/campaignData'
import { hexDistance, hexId, isPlayerInBlockedHex } from '@/lib/utils/hexUtils'
import type { ExtendedBattleRecord } from '@/types/battle'
import type { ActiveBattleCondition, KillzoneRecommendation } from '@/types/battleCondition'
import BattleForm from './BattleForm'
import BattleConditionDisplay from './BattleConditionDisplay'
import MissingPlayerModal from './MissingPlayerModal'
import ScoutConfirmDialog from './ScoutConfirmDialog'
import CampSelectionModal from './CampSelectionModal'
import DemolishConfirmationModal from './DemolishConfirmationModal'

interface PhaseTrackerProps {
  currentPhase: string
  currentRound: number
  currentPlayer: Player | null
  players: Player[]
  hexes: Record<string, Hex>
  threatLevel: number
  targetThreatLevel: number
  threatWarning: ThreatWarningLevel
  battleCompleted: boolean
  movementOrder: number[]
  movementIndex: number
  actionOrder: number[] | null
  actionIndex: number
  onNextPhase: () => void
  onMove: (playerIndex: number, targetHex: string, cost: number) => void
  onAction: (action: string, params?: any) => void
  onBattle: (record: Omit<ExtendedBattleRecord, 'round' | 'timestamp'>) => void
  calculateEncampCost: (playerIndex: number) => number
  validateDemolish: (playerIndex: number) => {
    valid: boolean
    reason?: string
    targets?: Array<{ playerId: number; playerName: string }>
    cost: number
  }
  // WHY: Battle condition props for Issue #40
  conditionEnabled: boolean
  selectedOpponentId: number | null
  onConditionEnabledChange: (enabled: boolean) => void
  onOpponentSelect: (opponentId: number | null) => void
  getActiveBattleCondition: (opponentId: number | null) => {
    condition: ActiveBattleCondition
    killzone: KillzoneRecommendation | null
  } | null
  // WHY: Issue #41 - Missing player handling
  onRecordMissingPlayer?: (presentPlayerId: number, absentPlayerId: number) => void
  // WHY: Issue #48 - Threat Phase location rules
  activeThreatRules?: ActiveThreatPhaseRule[]
  threatRulesResolved?: boolean
  onResolveThreatRules?: () => void
  checkForThreatRules?: () => boolean
  // WHY: Issue #59 - Threat Phase attacks (Beast Lair, Released Prisoner)
  hasActiveThreatAttacks?: boolean
  onResolveThreatAttacks?: () => void
}

interface MovementOption {
  hex: Hex
  distance: number
  cost: number
}

// WHY: Helper component to render a single group (Winners/Draws/Losses) in the action queue
function ActionGroup({
  label,
  playerIndices,
  currentPlayerId,
  players
}: {
  label: string
  playerIndices: number[]
  currentPlayerId: number | undefined
  players: Player[]
}) {
  // WHY: Don't render empty groups to save space
  if (playerIndices.length === 0) return null

  return (
    <div className="action-group">
      <span className="group-label">{label}</span>
      <div className="player-chips">
        {playerIndices.map(idx => {
          const player = players[idx]
          if (!player) return null

          return (
            <div
              key={idx}
              className={`player-chip ${idx === currentPlayerId ? 'active' : 'waiting'}`}
              style={{ backgroundColor: player.color }}
            >
              {player.name[0]}
              {idx === currentPlayerId && ' ✓'}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// WHY: Visual action queue showing battle result-based turn order
function ActionQueueBanner({
  players,
  actionOrder,
  actionIndex
}: {
  players: Player[]
  actionOrder: number[]
  actionIndex: number
}) {
  // WHY: Group players by battle result for visual organization
  const winners = actionOrder.filter(idx => players[idx]?.battleResult === 'WIN')
  const draws = actionOrder.filter(idx => {
    const result = players[idx]?.battleResult
    return result === 'DRAW' || result === 'BYE' || result === null
  })
  const losses = actionOrder.filter(idx => players[idx]?.battleResult === 'LOSS')

  const currentPlayerId = actionOrder[actionIndex]

  return (
    <div className="action-queue-banner">
      <h3>Action Order</h3>
      <div className="action-queue-groups">
        <ActionGroup
          label="WINNERS"
          playerIndices={winners}
          currentPlayerId={currentPlayerId}
          players={players}
        />
        <ActionGroup
          label="DRAWS"
          playerIndices={draws}
          currentPlayerId={currentPlayerId}
          players={players}
        />
        <ActionGroup
          label="LOSSES"
          playerIndices={losses}
          currentPlayerId={currentPlayerId}
          players={players}
        />
      </div>
    </div>
  )
}

// WHY: Format search rule for preview display
function formatSearchRulePreview(rule: SearchRule | null): string {
  if (!rule) return 'Nothing to search'

  switch (rule.type) {
    case 'sp':
      const spAmount = rule.amount === 'd3' ? 'D3' : rule.amount === 'd3+1' ? 'D3+1' : rule.amount
      return `Search to find ${spAmount} SP`
    case 'cp':
      return `Search to find ${rule.amount} CP`
    case 'both':
      const bothSpAmount = typeof rule.sp === 'string' ? rule.sp.toUpperCase() : rule.sp
      return `Search to find ${bothSpAmount} SP and ${rule.cp} CP`
  }
}

export default function PhaseTracker({
  currentPhase,
  currentRound,
  currentPlayer,
  players,
  hexes,
  threatLevel,
  targetThreatLevel,
  threatWarning,
  battleCompleted,
  movementOrder,
  movementIndex,
  actionOrder,
  actionIndex,
  onNextPhase,
  onMove,
  onAction,
  onBattle,
  calculateEncampCost,
  validateDemolish,
  conditionEnabled,
  selectedOpponentId,
  onConditionEnabledChange,
  onOpponentSelect,
  getActiveBattleCondition,
  onRecordMissingPlayer,
  activeThreatRules,
  threatRulesResolved,
  onResolveThreatRules,
  checkForThreatRules,
  hasActiveThreatAttacks,
  onResolveThreatAttacks
}: PhaseTrackerProps) {
  const [moveTarget, setMoveTarget] = useState<Hex | null>(null)
  // WHY: Issue #41 - Missing player modal state
  const [showMissingPlayerModal, setShowMissingPlayerModal] = useState(false)
  const [scoutTarget, setScoutTarget] = useState<Hex | null>(null)
  const [showScoutConfirm, setShowScoutConfirm] = useState(false)
  const [showCampSelection, setShowCampSelection] = useState(false)
  const [pendingEncampCost, setPendingEncampCost] = useState<number>(0)
  const [showDemolishModal, setShowDemolishModal] = useState(false)
  const [demolishTarget, setDemolishTarget] = useState<{playerId: number, playerName: string} | null>(null)

  if (!currentPlayer) return null

  const currentPosId = hexId(currentPlayer.position.row, currentPlayer.position.col)
  const currentRow = currentPlayer.position.row
  const currentCol = currentPlayer.position.col
  const currentHexId = hexId(currentRow, currentCol)
  const currentHex = hexes[currentHexId]
  const currentPhaseIndex = PHASES.indexOf(currentPhase)

  // Calculate movement options
  const getMovementOptions = (): MovementOption[] => {
    const options: MovementOption[] = []
    Object.values(hexes).forEach(hex => {
      const dist = hexDistance(currentRow, currentCol, hex.row, hex.col)
      if (dist > 0 && dist <= 3) {
        options.push({ hex, distance: dist, cost: dist })
      }
    })
    return options.sort((a, b) => a.distance - b.distance)
  }

  // Calculate scout options
  const getScoutOptions = (): MovementOption[] => {
    const options: MovementOption[] = []
    Object.values(hexes).forEach(hex => {
      // WHY: Skip already explored and blocked hexes
      if (hex.explored) return
      if (hex.type === 'blocked') return

      const dist = hexDistance(currentRow, currentCol, hex.row, hex.col)
      if (dist > 0 && dist <= 3) {
        options.push({ hex, distance: dist, cost: dist })
      }
    })
    return options
  }

  const encampCost = calculateEncampCost(currentPlayer.id)

  // WHY: Get current player's hex and search status
  const playerPosId = hexId(currentPlayer.position.row, currentPlayer.position.col)
  const playerCurrentHex = hexes[playerPosId]
  const currentLocation = playerCurrentHex
    ? (playerCurrentHex.type === 'surface'
        ? SURFACE_LOCATIONS[playerCurrentHex.location]
        : TOMB_LOCATIONS[playerCurrentHex.location])
    : null

  const alreadySearched = currentPlayer.searchedHexes?.includes(playerPosId) || false
  const hasSearchRule = currentLocation?.searchRule !== null && currentLocation?.searchRule !== undefined
  const canSearch = currentPlayer.supplyPoints >= 1 && hasSearchRule && !alreadySearched

  const handleMove = () => {
    if (moveTarget) {
      const dist = hexDistance(currentRow, currentCol, moveTarget.row, moveTarget.col)
      const targetId = hexId(moveTarget.row, moveTarget.col)
      onMove(currentPlayer.id, targetId, dist)
      setMoveTarget(null)
    }
  }

  const handleScout = () => {
    if (scoutTarget) {
      // WHY: Show confirmation dialog instead of executing immediately
      setShowScoutConfirm(true)
    }
  }

  // WHY: Execute scout after user confirms
  const handleScoutConfirm = () => {
    if (scoutTarget) {
      const dist = hexDistance(currentRow, currentCol, scoutTarget.row, scoutTarget.col)
      const targetId = hexId(scoutTarget.row, scoutTarget.col)
      onAction('SCOUT', { targetHex: targetId, distance: dist })
      setScoutTarget(null)
      setShowScoutConfirm(false)
    }
  }

  // WHY: Cancel confirmation and return to selection
  const handleScoutCancel = () => {
    setShowScoutConfirm(false)
  }

  // WHY: Handle camp selection for removal
  const handleCampRemoval = (campToRemove: HexPosition) => {
    setShowCampSelection(false)
    onAction('ENCAMP', {
      options: {
        cost: pendingEncampCost,
        campToRemove
      }
    })
  }

  // WHY: Cancel camp selection
  const handleCampSelectionCancel = () => {
    setShowCampSelection(false)
    setPendingEncampCost(0)
  }

  const movementOptions = getMovementOptions()
  const scoutOptions = getScoutOptions()

  // Check if any player has a camp at current position (not the current player's)
  const hasEnemyCamp = players.some(p =>
    p.id !== currentPlayer.id &&
    p.camps.some(c => c.row === currentPlayer.position.row && c.col === currentPlayer.position.col)
  )

  // WHY: Calculate demolish validation (Issue #47, Phase 4)
  const demolishValidation = useMemo(() => {
    const playerIndex = players.findIndex(p => p.id === currentPlayer.id)
    if (playerIndex === -1) return { valid: false, reason: 'Player not found', cost: 3 }
    return validateDemolish(playerIndex)
  }, [players, currentPlayer.id, validateDemolish])

  // Check if player is in blocked hex
  const inBlockedHex = isPlayerInBlockedHex(currentPlayer.position, currentHex)

  return (
    <div className="phase-tracker">
      {/* Warning for blocked hex */}
      {inBlockedHex && currentPhaseIndex === 0 && (
        <div className="blocked-hex-warning" style={{ backgroundColor: '#ff6b6b', color: 'white', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px' }}>
          ⚠️ WARNING: You are in a BLOCKED HEX! You must move out this turn.
        </div>
      )}

      {/* Phase indicator */}
      <div className="phase-indicator">
        <div className="round-info">
          Round {currentRound} - {currentPlayer.name}&apos;s Turn
        </div>
        <div className="phase-tabs">
          {PHASES.map((phase, idx) => (
            <div
              key={phase}
              className={`phase-tab ${idx === currentPhaseIndex ? 'active' : ''} ${idx < currentPhaseIndex ? 'completed' : ''}`}
            >
              {phase}
            </div>
          ))}
        </div>
      </div>

      {/* Movement Order Banner - Only shown during Movement Phase */}
      {currentPhase === 'Movement' && movementOrder.length > 1 && (
        <div className="movement-order-banner">
          <div className="movement-order-title">Movement Order:</div>
          <div className="movement-order-list">
            {movementOrder.map((playerId, index) => {
              const player = players[playerId]
              if (!player) return null

              const isCurrent = index === movementIndex
              const isCompleted = index < movementIndex
              const isWaiting = index > movementIndex

              return (
                <div
                  key={player.id}
                  className={`movement-order-item ${
                    isCurrent ? 'current' : ''
                  } ${isCompleted ? 'completed' : ''} ${
                    isWaiting ? 'waiting' : ''
                  }`}
                >
                  <span className="movement-position">{index + 1}.</span>
                  <span
                    className="movement-player-indicator"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="movement-player-name">{player.name}</span>
                  {isCurrent && <span className="movement-current-badge">YOUR TURN</span>}
                  {isCompleted && <span className="movement-check">✓</span>}
                  {isWaiting && <span className="movement-waiting">Waiting...</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Threat meter */}
      <div className="threat-meter">
        <div className="threat-label">
          Threat Level: {threatLevel} / {targetThreatLevel}
        </div>
        <div className="threat-bar">
          <div
            className="threat-fill"
            style={{ width: `${(threatLevel / targetThreatLevel) * 100}%` }}
          />
        </div>
      </div>

      {/* Phase-specific controls */}
      <div className="phase-content">
        {currentPhaseIndex === 0 && (
          <div className="movement-phase">
            <h4>Movement Phase</h4>
            <p>Current Position: {currentPosId}</p>
            <p>Supply Points: {currentPlayer.supplyPoints}</p>

            <div className="movement-options">
              <h5>Move Options (cost = distance in SP)</h5>
              <div className="option-grid">
                {movementOptions.slice(0, 12).map(opt => {
                  const optId = hexId(opt.hex.row, opt.hex.col)
                  return (
                    <button
                      key={optId}
                      className={`option-btn ${moveTarget && hexId(moveTarget.row, moveTarget.col) === optId ? 'selected' : ''}`}
                      onClick={() => setMoveTarget(opt.hex)}
                      disabled={currentPlayer.supplyPoints < opt.cost}
                    >
                      {optId} ({opt.cost} SP)
                    </button>
                  )
                })}
              </div>
              {moveTarget && (
                <button className="action-btn primary" onClick={handleMove}>
                  Move to {hexId(moveTarget.row, moveTarget.col)} (-{hexDistance(currentRow, currentCol, moveTarget.row, moveTarget.col)} SP)
                </button>
              )}
            </div>

            <div className="other-options">
              <button className="action-btn" onClick={() => onNextPhase()}>
                Hold Position (No Cost)
              </button>
              <button
                className="action-btn"
                onClick={() => {
                  // Regroup to nearest base/camp for free
                  const bases = currentPlayer.bases
                  if (bases.length > 0) {
                    const basePos = bases[0]
                    if (basePos) {
                      const baseId = hexId(basePos.row, basePos.col)
                      onMove(currentPlayer.id, baseId, 0)
                    }
                  }
                }}
              >
                Regroup to Base (Free)
              </button>
            </div>
          </div>
        )}

        {currentPhaseIndex === 1 && (
          <div className="battle-phase">
            <h4>Battle Phase</h4>
            <p>Record the result of your battle this round.</p>

            {/* WHY: Battle Condition Display (Issue #40) */}
            {(() => {
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
            })()}

            {!battleCompleted && (
              <div style={{ background: '#fff3cd', border: '1px solid #ffc107', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px', color: '#856404' }}>
                ⚠️ <strong>Required:</strong> You must record a battle result before advancing to the next phase.
              </div>
            )}

            {battleCompleted && (
              <div style={{ background: '#d4edda', border: '1px solid #28a745', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px', color: '#155724' }}>
                ✅ Battle result recorded. You may advance to the next phase.
              </div>
            )}

            {/* WHY: Use BattleForm component (Issue #34) */}
            <BattleForm
              currentPlayerId={currentPlayer.id}
              players={players.map(p => ({ id: p.id, name: p.name, color: p.color }))}
              currentRound={currentRound}
              onRecordBattle={onBattle}
              onOpponentSelect={onOpponentSelect}
            />

            {/* WHY: Issue #41 - Missing opponent recording option */}
            {onRecordMissingPlayer && players.length > 1 && (
              <div className="missing-opponent-section">
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={() => setShowMissingPlayerModal(true)}
                >
                  Record Missing Opponent
                </button>
              </div>
            )}

            {/* WHY: Issue #41 - Missing player modal */}
            {onRecordMissingPlayer && (
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
            )}
          </div>
        )}

        {currentPhaseIndex === 2 && (
          <div className="action-phase">
            <h4>Action Phase</h4>

            {/* WHY: Show action queue when order is calculated */}
            {actionOrder && (
              <ActionQueueBanner
                players={players}
                actionOrder={actionOrder}
                actionIndex={actionIndex}
              />
            )}

            <p>Choose one action to perform:</p>

            <div className="action-list">
              {/* Resupply */}
              <div className="action-item">
                <h5>Resupply</h5>
                <p className="action-desc">
                  {currentPlayer.bases.some(b => b.row === currentPlayer.position.row && b.col === currentPlayer.position.col)
                    ? 'At your base: Gain 10 SP'
                    : currentPlayer.camps.some(c => c.row === currentPlayer.position.row && c.col === currentPlayer.position.col)
                    ? 'At your camp: Gain D3+3 SP'
                    : 'At other location: Gain 1 SP'}
                </p>
                <button
                  className="action-btn"
                  onClick={() => onAction('RESUPPLY')}
                >
                  Resupply
                </button>
              </div>

              {/* Scout */}
              <div className="action-item">
                <h5>Scout</h5>
                <p className="action-desc">Explore a hex within 3 hexes (1 SP per hex distance)</p>
                <div className="option-grid small">
                  {scoutOptions.slice(0, 6).map(opt => {
                    const optId = hexId(opt.hex.row, opt.hex.col)
                    return (
                      <button
                        key={optId}
                        className={`option-btn small ${scoutTarget && hexId(scoutTarget.row, scoutTarget.col) === optId ? 'selected' : ''}`}
                        onClick={() => setScoutTarget(opt.hex)}
                        disabled={currentPlayer.supplyPoints < opt.cost}
                      >
                        {optId} ({opt.cost} SP)
                      </button>
                    )
                  })}
                </div>
                {scoutTarget && (
                  <button className="action-btn" onClick={handleScout}>
                    Preview Scout {hexId(scoutTarget.row, scoutTarget.col)}
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="action-item">
                <h5>Search (1 SP)</h5>

                {/* Search Preview */}
                {currentLocation?.searchRule && !alreadySearched ? (
                  <p className="action-desc search-preview">
                    {formatSearchRulePreview(currentLocation.searchRule)}
                  </p>
                ) : alreadySearched ? (
                  <p className="action-desc search-unavailable">
                    Already searched this location
                  </p>
                ) : (
                  <p className="action-desc search-unavailable">
                    Nothing to search here
                  </p>
                )}

                <button
                  className="action-btn"
                  onClick={() => onAction('SEARCH')}
                  disabled={!canSearch}
                  title={
                    currentPlayer.supplyPoints < 1
                      ? 'Requires 1 SP'
                      : !hasSearchRule
                      ? 'Nothing to search at this location'
                      : alreadySearched
                      ? 'Already searched'
                      : 'Perform search'
                  }
                >
                  {canSearch ? 'Search' : 'Cannot Search'}
                </button>
              </div>

              {/* Encamp */}
              <div className="action-item">
                <h5>Encamp</h5>

                <div className="encamp-info">
                  <div className="encamp-cost-row">
                    <span>Base Cost:</span>
                    <strong>{encampCost} SP</strong>
                  </div>

                  {currentHex?.location !== undefined &&
                   (currentHex.type === 'surface'
                     ? SURFACE_LOCATIONS[currentHex.location]?.effect === 'freeEncamp'
                     : TOMB_LOCATIONS[currentHex.location]?.effect === 'freeEncamp') && (
                    <div className="encamp-modifier free">
                      Free Encamp: 0 SP (Landing Site)
                    </div>
                  )}

                  {currentHex?.condition !== undefined &&
                   (currentHex.type === 'surface'
                     ? SURFACE_CONDITIONS[currentHex.condition]?.effect === 'cheapEncamp'
                     : TOMB_CONDITIONS[currentHex.condition]?.effect === 'cheapEncamp') && (
                    <div className="encamp-modifier cheap">
                      Cheap Encamp: -1 SP (Stable Conditions)
                    </div>
                  )}

                  <div className="encamp-camps">
                    <span>Your Camps:</span>
                    <strong className={currentPlayer.camps.length >= 2 ? 'camp-limit-warn' : ''}>
                      {currentPlayer.camps.length}/2
                    </strong>
                  </div>
                </div>

                <button
                  className="action-btn"
                  onClick={() => {
                    const cost = encampCost
                    // WHY: If player has 2 camps, show removal modal first
                    if (currentPlayer.camps.length >= 2) {
                      setPendingEncampCost(cost)
                      setShowCampSelection(true)
                    } else {
                      // WHY: Build camp directly if under limit
                      onAction('ENCAMP', { options: { cost } })
                    }
                  }}
                  disabled={
                    currentPlayer.supplyPoints < encampCost
                  }
                >
                  {currentPlayer.camps.length >= 2 ? 'Replace Camp' : 'Build Camp'} ({encampCost} SP)
                </button>
              </div>

              {/* Demolish (Issue #47, Phase 4) */}
              <div className="action-item">
                <h5>Demolish</h5>
                <p className="action-desc">
                  Destroy an opponent&apos;s camp. (Cost: {demolishValidation.cost} SP)
                </p>

                {/* WHY: Show prerequisite feedback */}
                {!demolishValidation.valid && (
                  <div style={{
                    background: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    color: '#721c24'
                  }}>
                    <strong>✗ Cannot Demolish:</strong> {demolishValidation.reason}
                  </div>
                )}

                {demolishValidation.valid && demolishValidation.targets && (
                  <div style={{
                    background: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    color: '#155724'
                  }}>
                    <strong>✓ You can demolish the following camps:</strong>
                    <div style={{ marginTop: '0.5rem' }}>
                      {demolishValidation.targets.map((target, idx) => (
                        <button
                          key={idx}
                          className="action-btn danger"
                          style={{ marginRight: '0.5rem', marginTop: '0.5rem' }}
                          onClick={() => {
                            setDemolishTarget(target)
                            setShowDemolishModal(true)
                          }}
                        >
                          Demolish {target.playerName}&apos;s Camp ({demolishValidation.cost} SP)
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Skip action */}
              <div className="action-item">
                <button className="action-btn secondary" onClick={onNextPhase}>
                  Skip Action
                </button>
              </div>
            </div>
          </div>
        )}

        {currentPhaseIndex === 3 && (
          <div className="threat-phase">
            <h4>Threat Phase</h4>

            {/* Location Rules Section - shows when rules exist and not yet resolved */}
            {activeThreatRules && activeThreatRules.length > 0 && !threatRulesResolved && (
              <div className="threat-location-rules">
                <h5>Location Rules Resolving</h5>
                <p>The following location effects trigger in priority order:</p>
                <ol className="location-rule-list">
                  {activeThreatRules.map((rule, index) => (
                    <li key={`${rule.player.id}-${rule.hexId}`} className="location-rule-item">
                      <span
                        className="player-indicator"
                        style={{ backgroundColor: rule.player.color }}
                      />
                      <span className="player-name">{rule.player.name}</span>
                      <span className="location-name">({rule.location.name})</span>
                      <span className="rule-effect">{rule.rule.description}</span>
                    </li>
                  ))}
                </ol>
                <button
                  className="action-btn primary"
                  onClick={onResolveThreatRules}
                >
                  Resolve Location Rules
                </button>
              </div>
            )}

            {/* Threat Attacks Section - shows after location rules resolved (Issue #59) */}
            {hasActiveThreatAttacks && onResolveThreatAttacks && (
              <div className="threat-attacks-section">
                <h5>Threat Phase Attacks</h5>
                <p>Beast Lairs and Released Prisoners may attack during Threat Phase.</p>
                <button
                  className="action-btn primary"
                  onClick={onResolveThreatAttacks}
                >
                  Resolve Threat Attacks
                </button>
              </div>
            )}

            {/* Standard threat phase content - shows after rules resolved or no rules */}
            {(!activeThreatRules || activeThreatRules.length === 0 || threatRulesResolved) && !hasActiveThreatAttacks && (
              <>
                <p>The tomb stirs...</p>

                <div className="threat-info">
                  <p>
                    Current Threat Level: <strong>{threatLevel}</strong>
                  </p>
                  <p>
                    At the end of this phase, threat will increase and the next
                    player&apos;s turn will begin.
                  </p>
                  {currentPlayer.id === players.length - 1 && (
                    <p className="warning">
                      This is the last player - threat will increase after this turn!
                    </p>
                  )}
                </div>

                {threatWarning !== 'none' && (
                  <div className={`threat-phase-warning ${threatWarning}`}>
                    {threatWarning === 'critical'
                      ? '⚠️ CRITICAL: Campaign ending next round!'
                      : '⚠️ WARNING: Approaching campaign end'}
                  </div>
                )}

                <button className="action-btn primary" onClick={onNextPhase}>
                  End Turn
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Next phase button (except during threat phase) */}
      {currentPhaseIndex < 3 && (
        <div className="phase-nav">
          <button className="next-phase-btn" onClick={onNextPhase}>
            Next Phase →
          </button>
        </div>
      )}

      {/* Scout confirmation dialog */}
      {showScoutConfirm && scoutTarget && (
        <ScoutConfirmDialog
          targetHex={scoutTarget}
          distance={hexDistance(currentRow, currentCol, scoutTarget.row, scoutTarget.col)}
          currentSP={currentPlayer.supplyPoints}
          onConfirm={handleScoutConfirm}
          onCancel={handleScoutCancel}
        />
      )}

      {showCampSelection && (
        <CampSelectionModal
          camps={currentPlayer.camps}
          hexes={hexes}
          onSelectCamp={handleCampRemoval}
          onCancel={handleCampSelectionCancel}
        />
      )}

      {/* WHY: Demolish confirmation modal (Issue #47, Phase 4) */}
      {showDemolishModal && demolishTarget && (
        <DemolishConfirmationModal
          targetPlayerName={demolishTarget.playerName}
          campPosition={currentPlayer.position}
          cost={demolishValidation.cost}
          onConfirm={() => {
            onAction('DEMOLISH', { targetPlayerId: demolishTarget.playerId })
            setShowDemolishModal(false)
            setDemolishTarget(null)
          }}
          onCancel={() => {
            setShowDemolishModal(false)
            setDemolishTarget(null)
          }}
        />
      )}
    </div>
  )
}
