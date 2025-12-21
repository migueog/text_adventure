import React, { useState } from 'react';

function PlayerCard({ player, isActive, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [editTeamName, setEditTeamName] = useState(player.killTeamName);

  const handleSave = () => {
    onUpdate(player.id, { name: editName, killTeamName: editTeamName });
    setEditing(false);
  };

  return (
    <div
      className={`player-card ${isActive ? 'active' : ''}`}
      style={{ borderLeftColor: player.color }}
    >
      <div className="player-header">
        <div
          className="player-color-badge"
          style={{ backgroundColor: player.color }}
        >
          {player.id + 1}
        </div>
        {editing ? (
          <div className="player-edit-form">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Player Name"
            />
            <input
              type="text"
              value={editTeamName}
              onChange={(e) => setEditTeamName(e.target.value)}
              placeholder="Kill Team Name"
            />
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </div>
        ) : (
          <div className="player-names" onClick={() => setEditing(true)}>
            <div className="player-name">{player.name}</div>
            <div className="kill-team-name">{player.killTeamName}</div>
          </div>
        )}
      </div>

      <div className="player-stats">
        <div className="stat">
          <span className="stat-label">SP</span>
          <span className="stat-value supply">{player.supplyPoints}/10</span>
          <div className="stat-bar">
            <div
              className="stat-fill supply"
              style={{ width: `${player.supplyPoints * 10}%` }}
            />
          </div>
        </div>

        <div className="stat">
          <span className="stat-label">CP</span>
          <span className="stat-value campaign">{player.campaignPoints}</span>
        </div>

        <div className="stat-row">
          <div className="mini-stat">
            <span className="mini-label">Position</span>
            <span className="mini-value">{player.position}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-label">Hexes</span>
            <span className="mini-value">{player.hexesExplored}</span>
          </div>
        </div>

        <div className="stat-row">
          <div className="mini-stat">
            <span className="mini-label">Games</span>
            <span className="mini-value">
              {player.gamesWon}/{player.gamesPlayed}
            </span>
          </div>
          <div className="mini-stat">
            <span className="mini-label">Kills</span>
            <span className="mini-value">{player.operativesKilled}</span>
          </div>
        </div>

        <div className="player-assets">
          <span className="asset-label">Bases: {player.bases.length}</span>
          <span className="asset-label">Camps: {player.camps.length}</span>
        </div>
      </div>
    </div>
  );
}

export default function PlayerPanel({
  players,
  currentPlayerIndex,
  onUpdatePlayer
}) {
  return (
    <div className="player-panel">
      <h3>Players</h3>
      <div className="player-list">
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            isActive={player.id === currentPlayerIndex}
            onUpdate={onUpdatePlayer}
          />
        ))}
      </div>
    </div>
  );
}
