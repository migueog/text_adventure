import React, { useState } from 'react';
import { PHASES, BATTLE_RESULTS, ACTIONS } from '../data/campaignData';
import { hexDistance, hexId } from '../utils/hexUtils';

export default function PhaseTracker({
  currentPhase,
  currentRound,
  currentPlayer,
  players,
  hexes,
  mapConfig,
  threatLevel,
  targetThreatLevel,
  onNextPhase,
  onMove,
  onAction,
  onBattle,
  calculateEncampCost,
  selectedHex
}) {
  const [moveTarget, setMoveTarget] = useState(null);
  const [scoutTarget, setScoutTarget] = useState(null);
  const [battleResult, setBattleResult] = useState('WIN');
  const [operativesKilled, setOperativesKilled] = useState(0);

  if (!currentPlayer) return null;

  const currentHex = hexes[currentPlayer.position];
  const [currentRow, currentCol] = currentPlayer.position.split(',').map(Number);

  // Calculate movement options
  const getMovementOptions = () => {
    const options = [];
    Object.values(hexes).forEach(hex => {
      if (hex.blocked) return;
      const dist = hexDistance(currentRow, currentCol, hex.row, hex.col);
      if (dist > 0 && dist <= 3) {
        options.push({ hex, distance: dist, cost: dist });
      }
    });
    return options.sort((a, b) => a.distance - b.distance);
  };

  // Calculate scout options
  const getScoutOptions = () => {
    const options = [];
    Object.values(hexes).forEach(hex => {
      if (hex.explored || hex.blocked) return;
      const dist = hexDistance(currentRow, currentCol, hex.row, hex.col);
      if (dist > 0 && dist <= 3) {
        options.push({ hex, distance: dist, cost: dist });
      }
    });
    return options;
  };

  const encampCost = calculateEncampCost(currentPlayer.id);

  const handleMove = () => {
    if (moveTarget) {
      const dist = hexDistance(currentRow, currentCol, moveTarget.row, moveTarget.col);
      onMove(currentPlayer.id, moveTarget.id, dist);
      setMoveTarget(null);
    }
  };

  const handleScout = () => {
    if (scoutTarget) {
      const dist = hexDistance(currentRow, currentCol, scoutTarget.row, scoutTarget.col);
      onAction('SCOUT', { targetHex: scoutTarget.id, distance: dist });
      setScoutTarget(null);
    }
  };

  const handleBattle = () => {
    const result = BATTLE_RESULTS[battleResult];
    onBattle(result, null, operativesKilled);
    setOperativesKilled(0);
  };

  const movementOptions = getMovementOptions();
  const scoutOptions = getScoutOptions();

  return (
    <div className="phase-tracker">
      {/* Phase indicator */}
      <div className="phase-indicator">
        <div className="round-info">
          Round {currentRound} - {currentPlayer.name}'s Turn
        </div>
        <div className="phase-tabs">
          {PHASES.map((phase, idx) => (
            <div
              key={phase}
              className={`phase-tab ${idx === currentPhase ? 'active' : ''} ${idx < currentPhase ? 'completed' : ''}`}
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
        {currentPhase === 0 && (
          <div className="movement-phase">
            <h4>Movement Phase</h4>
            <p>Current Position: {currentPlayer.position}</p>
            <p>Supply Points: {currentPlayer.supplyPoints}</p>

            <div className="movement-options">
              <h5>Move Options (cost = distance in SP)</h5>
              <div className="option-grid">
                {movementOptions.slice(0, 12).map(opt => (
                  <button
                    key={opt.hex.id}
                    className={`option-btn ${moveTarget?.id === opt.hex.id ? 'selected' : ''}`}
                    onClick={() => setMoveTarget(opt.hex)}
                    disabled={currentPlayer.supplyPoints < opt.cost}
                  >
                    {opt.hex.id} ({opt.cost} SP)
                  </button>
                ))}
              </div>
              {moveTarget && (
                <button className="action-btn primary" onClick={handleMove}>
                  Move to {moveTarget.id} (-{hexDistance(currentRow, currentCol, moveTarget.row, moveTarget.col)} SP)
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
                  const bases = currentPlayer.bases;
                  if (bases.length > 0) {
                    onMove(currentPlayer.id, bases[0], 0);
                  }
                }}
              >
                Regroup to Base (Free)
              </button>
            </div>
          </div>
        )}

        {currentPhase === 1 && (
          <div className="battle-phase">
            <h4>Battle Phase</h4>
            <p>Record the result of your battle this round.</p>

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

        {currentPhase === 2 && (
          <div className="action-phase">
            <h4>Action Phase</h4>
            <p>Choose one action to perform:</p>

            <div className="action-list">
              {/* Resupply */}
              <div className="action-item">
                <h5>Resupply</h5>
                <p className="action-desc">
                  {currentHex?.hasBase && currentHex.baseOwner === currentPlayer.id
                    ? 'At your base: Gain 10 SP'
                    : currentHex?.hasCamp && currentHex.campOwner === currentPlayer.id
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
                  {scoutOptions.slice(0, 6).map(opt => (
                    <button
                      key={opt.hex.id}
                      className={`option-btn small ${scoutTarget?.id === opt.hex.id ? 'selected' : ''}`}
                      onClick={() => setScoutTarget(opt.hex)}
                      disabled={currentPlayer.supplyPoints < opt.cost}
                    >
                      {opt.hex.id} ({opt.cost} SP)
                    </button>
                  ))}
                </div>
                {scoutTarget && (
                  <button className="action-btn" onClick={handleScout}>
                    Scout {scoutTarget.id}
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="action-item">
                <h5>Search</h5>
                <p className="action-desc">
                  Search current hex for resources.
                  {currentHex?.location?.effect?.includes('search')
                    ? ` This location has searchable resources!`
                    : ' No searchable resources here.'}
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
                  Build a camp here.
                  {currentHex?.location?.effect === 'freeEncamp'
                    ? ' This location allows free camping!'
                    : ` Cost: ${encampCost} SP (distance to nearest base/camp)`}
                </p>
                <button
                  className="action-btn"
                  onClick={() => onAction('ENCAMP', { cost: encampCost })}
                  disabled={
                    currentHex?.hasCamp ||
                    currentHex?.hasBase ||
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
                  Destroy an opponent's camp.
                  {currentPlayer.canDemolish
                    ? ' You won a battle - demolish is available!'
                    : ' Requires winning a battle first.'}
                </p>
                <button
                  className="action-btn danger"
                  onClick={() => onAction('DEMOLISH')}
                  disabled={
                    !currentPlayer.canDemolish ||
                    !currentHex?.hasCamp ||
                    currentHex?.campOwner === currentPlayer.id
                  }
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

        {currentPhase === 3 && (
          <div className="threat-phase">
            <h4>Threat Phase</h4>
            <p>The tomb stirs...</p>

            <div className="threat-info">
              <p>
                Current Threat Level: <strong>{threatLevel}</strong>
              </p>
              <p>
                At the end of this phase, threat will increase and the next
                player's turn will begin.
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
      {currentPhase < 3 && (
        <div className="phase-nav">
          <button className="next-phase-btn" onClick={onNextPhase}>
            Next Phase →
          </button>
        </div>
      )}
    </div>
  );
}
