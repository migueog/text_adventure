import React, { useState } from 'react';
import { MAP_CONFIGS, PLAYER_COLORS } from '../data/campaignData';

export default function GameSetup({ onStartGame }) {
  const [playerCount, setPlayerCount] = useState(4);
  const [targetThreat, setTargetThreat] = useState(7);
  const [soloMode, setSoloMode] = useState(false);
  const [playerNames, setPlayerNames] = useState(
    Array(6).fill('').map((_, i) => `Player ${i + 1}`)
  );

  const config = MAP_CONFIGS[playerCount];

  const handleStart = () => {
    onStartGame(playerCount, soloMode, targetThreat, playerNames.slice(0, playerCount));
  };

  return (
    <div className="game-setup">
      <div className="setup-header">
        <h1>Ctesiphus Expedition</h1>
        <h2>Kill Team Campaign Manager</h2>
      </div>

      <div className="setup-content">
        <div className="setup-section">
          <h3>Campaign Settings</h3>

          <div className="setting-group">
            <label>Number of Players:</label>
            <div className="button-group">
              {[2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  className={`setting-btn ${playerCount === num ? 'active' : ''}`}
                  onClick={() => setPlayerCount(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <label>Target Threat Level (Campaign Length):</label>
            <div className="button-group">
              {[5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  className={`setting-btn ${targetThreat === num ? 'active' : ''}`}
                  onClick={() => setTargetThreat(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="setting-hint">
              Standard campaign: 7 rounds. Shorter: 5-6. Longer: 8-10.
            </p>
          </div>

          <div className="setting-group">
            <label>Game Mode:</label>
            <div className="button-group">
              <button
                className={`setting-btn ${!soloMode ? 'active' : ''}`}
                onClick={() => setSoloMode(false)}
              >
                Competitive
              </button>
              <button
                className={`setting-btn ${soloMode ? 'active' : ''}`}
                onClick={() => setSoloMode(true)}
              >
                Solo/Co-op
              </button>
            </div>
            {soloMode && (
              <p className="setting-hint">
                Solo/Co-op mode has different threat mechanics.
              </p>
            )}
          </div>
        </div>

        <div className="setup-section">
          <h3>Player Names</h3>
          <div className="player-inputs">
            {Array(playerCount).fill(null).map((_, idx) => (
              <div key={idx} className="player-input-row">
                <div
                  className="player-color-preview"
                  style={{ backgroundColor: PLAYER_COLORS[idx] }}
                />
                <input
                  type="text"
                  value={playerNames[idx]}
                  onChange={(e) => {
                    const newNames = [...playerNames];
                    newNames[idx] = e.target.value;
                    setPlayerNames(newNames);
                  }}
                  placeholder={`Player ${idx + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="setup-section">
          <h3>Map Preview</h3>
          <div className="map-preview-info">
            <p><strong>{config.name}</strong></p>
            <p>Grid Size: {config.rows} x {config.cols} hexes</p>
            <p>Surface Rows: {config.surfaceRows}</p>
            <p>Tomb Rows: {config.tombRows}</p>
          </div>
        </div>

        <button className="start-btn" onClick={handleStart}>
          Start Campaign
        </button>
      </div>

      <div className="setup-footer">
        <h4>Quick Reference</h4>
        <div className="reference-grid">
          <div className="reference-item">
            <strong>Movement:</strong> 1-3 hexes, costs 1 SP per hex
          </div>
          <div className="reference-item">
            <strong>Victory:</strong> Battle win = +1 CP, Loss/Draw = +1 SP
          </div>
          <div className="reference-item">
            <strong>Resupply:</strong> Base = 10 SP, Camp = D3+3, Other = 1
          </div>
          <div className="reference-item">
            <strong>Encamp:</strong> Cost = distance to nearest base/camp
          </div>
        </div>
      </div>
    </div>
  );
}
