'use client'

import { useState } from 'react'
import type { Player } from '@/types/campaign'
import { hexId } from '@/lib/utils/hexUtils'

interface PlayerCardProps {
  player: Player
  isActive: boolean
  onUpdate: (playerId: number, updates: Partial<Player>) => void
}

function PlayerCard({ player, isActive, onUpdate }: PlayerCardProps) {
  const [editing, setEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [editName, setEditName] = useState(player.name)
  const [editTeamName, setEditTeamName] = useState(player.killTeamName)

  const handleSave = () => {
    onUpdate(player.id, { name: editName, killTeamName: editTeamName })
    setEditing(false)
  }

  const recentHistory = (player.history || []).slice(-5).reverse()
  const positionStr = hexId(player.position.row, player.position.col)

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
        {player.priority && player.priority > 0 && (
          <div
            className="priority-badge"
            style={{
              backgroundColor: player.priority === 1 ? '#4CAF50' : player.priority === 2 ? '#FFC107' : '#FF5722',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              marginLeft: '0.5rem'
            }}
            title={`Priority ${player.priority} (${player.priority === 1 ? 'Lowest' : player.priority === 2 ? 'Second' : 'Other'} CP/SP)`}
          >
            P{player.priority}
          </div>
        )}
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
            <span className="mini-value">{positionStr}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-label">Hexes</span>
            <span className="mini-value">{player.exploredHexes}</span>
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

        {(player.history && player.history.length > 0) && (
          <div className="player-history-section">
            <button 
              className="history-toggle"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? '▼' : '▶'} Recent Activity ({player.history.length})
            </button>
            
            {showHistory && (
              <div className="history-list">
                {recentHistory.map((entry, idx) => (
                  <div key={idx} className="history-entry">
                    <div className="history-header">
                      <span className="history-round">R{entry.round}</span>
                      <span className="history-phase">{entry.phase}</span>
                    </div>
                    <div className="history-reason">{entry.action}</div>
                    <div className="history-changes">
                      {(entry.spAfter - entry.spBefore) !== 0 && (
                        <span className={`sp-change ${(entry.spAfter - entry.spBefore) > 0 ? 'positive' : 'negative'}`}>
                          {(entry.spAfter - entry.spBefore) > 0 ? '+' : ''}{entry.spAfter - entry.spBefore} SP
                        </span>
                      )}
                      {(entry.cpAfter - entry.cpBefore) !== 0 && (
                        <span className={`cp-change ${(entry.cpAfter - entry.cpBefore) > 0 ? 'positive' : 'negative'}`}>
                          {(entry.cpAfter - entry.cpBefore) > 0 ? '+' : ''}{entry.cpAfter - entry.cpBefore} CP
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {player.history.length > 5 && (
                  <div className="history-more">
                    ... and {player.history.length - 5} more
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface PlayerPanelProps {
  players: Player[]
  currentPlayerIndex: number
  onUpdatePlayer: (playerId: number, updates: Partial<Player>) => void
}

export default function PlayerPanel({
  players,
  currentPlayerIndex,
  onUpdatePlayer
}: PlayerPanelProps) {
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
  )
}
