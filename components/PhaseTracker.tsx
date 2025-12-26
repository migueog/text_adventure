'use client'

import { useState } from 'react'
import type { Player, Hex } from '@/types/campaign'
import { PHASES, BATTLE_RESULTS, BattleResultInfo } from '@/lib/data/campaignData'
import { hexDistance, hexId, isPlayerInBlockedHex } from '@/lib/utils/hexUtils'

interface PhaseTrackerProps {
  currentPhase: string
  currentRound: number
  currentPlayer: Player | null
  players: Player[]
  hexes: Record<string, Hex>
  threatLevel: number
  targetThreatLevel: number
  battleCompleted: boolean
  onNextPhase: () => void
  onMove: (playerIndex: number, targetHex: string, cost: number) => void
  onAction: (action: string, params?: any) => void
  onBattle: (result: BattleResultInfo, opponentIndex: number | null, operativesKilled: number) => void
  calculateEncampCost: (playerIndex: number) => number
}

interface MovementOption {
  hex: Hex
  distance: number
  cost: number
}

export default function PhaseTracker({
  currentPhase,
  currentRound,
  currentPlayer,
  players,
  hexes,
  threatLevel,
  targetThreatLevel,
  battleCompleted,
  onNextPhase,
  onMove,
  onAction,
  onBattle,
  calculateEncampCost
}: PhaseTrackerProps) {
  const [moveTarget, setMoveTarget] = useState<Hex | null>(null)
  const [scoutTarget, setScoutTarget] = useState<Hex | null>(null)
  const [battleResult, setBattleResult] = useState<string>('WIN')
  const [operativesKilled, setOperativesKilled] = useState(0)

  if (!currentPlayer) return null

  const currentPosId = hexId(currentPlayer.position.row, currentPlayer.position.col)
  const currentRow = currentPlayer.position.row
  const currentCol = currentPlayer.position.col
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
      if (hex.explored) return
      const dist = hexDistance(currentRow, currentCol, hex.row, hex.col)
      if (dist > 0 && dist <= 3) {
        options.push({ hex, distance: dist, cost: dist })
      }
    })
    return options
  }

  const encampCost = calculateEncampCost(currentPlayer.id)

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
      const dist = hexDistance(currentRow, currentCol, scoutTarget.row, scoutTarget.col)
      const targetId = hexId(scoutTarget.row, scoutTarget.col)
      onAction('SCOUT', { targetHex: targetId, distance: dist })
      setScoutTarget(null)
    }
  }

  const handleBattle = () => {
    const result = BATTLE_RESULTS[battleResult]
    if (result) {
      onBattle(result, null, operativesKilled)
      setOperativesKilled(0)
    }
  }

  const movementOptions = getMovementOptions()
  const scoutOptions = getScoutOptions()

  // Check if any player has a camp at current position (not the current player's)
  const hasEnemyCamp = players.some(p =>
    p.id !== currentPlayer.id &&
    p.camps.some(c => c.row === currentPlayer.position.row && c.col === currentPlayer.position.col)
  )

  // Check if player is in blocked hex
  const currentHex = hexes[currentPosId]
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

            <div className="battle-form">
              <div className="form-group">
                <label>Battle Result:</label>
                <select
                  value={battleResult}
                  onChange={(e) => setBattleResult(e.target.value)}
                >
                  <option value="WIN">Victory (+1 CP)</option>
                  <option value="DRAW">Draw (+1 SP)</option>
                  <option value="LOSS">Defeat (+1 SP)</option>
                  <option value="BYE">Bye - No Opponent (+2 SP)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Operatives Killed:</label>
                <input
                  type="number"
                  min="0"
                  value={operativesKilled}
                  onChange={(e) => setOperativesKilled(parseInt(e.target.value) || 0)}
                />
              </div>

              <button className="action-btn primary" onClick={handleBattle}>
                Record Battle
              </button>
            </div>
          </div>
        )}

        {currentPhaseIndex === 2 && (
          <div className="action-phase">
            <h4>Action Phase</h4>
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
                    Scout {hexId(scoutTarget.row, scoutTarget.col)}
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="action-item">
                <h5>Search</h5>
                <p className="action-desc">
                  Search current hex for resources.
                </p>
                <button
                  className="action-btn"
                  onClick={() => onAction('SEARCH')}
                >
                  Search
                </button>
              </div>

              {/* Encamp */}
              <div className="action-item">
                <h5>Encamp</h5>
                <p className="action-desc">
                  Build a camp here. Cost: {encampCost} SP (distance to nearest base/camp)
                </p>
                <button
                  className="action-btn"
                  onClick={() => onAction('ENCAMP', { cost: encampCost })}
                  disabled={
                    currentPlayer.supplyPoints < encampCost
                  }
                >
                  Build Camp ({encampCost} SP)
                </button>
              </div>

              {/* Demolish */}
              <div className="action-item">
                <h5>Demolish</h5>
                <p className="action-desc">
                  Destroy an opponent&apos;s camp.
                </p>
                <button
                  className="action-btn danger"
                  onClick={() => onAction('DEMOLISH')}
                  disabled={!hasEnemyCamp}
                >
                  Demolish Camp
                </button>
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

            <button className="action-btn primary" onClick={onNextPhase}>
              End Turn
            </button>
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
    </div>
  )
}
