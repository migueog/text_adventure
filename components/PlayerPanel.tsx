'use client'

import { useState, useEffect } from 'react'
import type { Player, Hex } from '@/types/campaign'
import type { ExtendedBattleRecord } from '@/types/battle'
import { hexId } from '@/lib/utils/hexUtils'
import { SURFACE_LOCATIONS, TOMB_LOCATIONS } from '@/lib/data/campaignData'
import BattleHistory from './BattleHistory'

interface PlayerCardProps {
  player: Player
  allPlayers: Player[]
  isActive: boolean
  currentPhase: string
  hexes: Record<string, Hex>
  onUpdate: (playerId: number, updates: Partial<Player>) => void
  soloMode?: boolean  // WHY: Issue #55 - Show CP progress in solo mode
}

function PlayerCard({ player, allPlayers, isActive, currentPhase, hexes, onUpdate, soloMode }: PlayerCardProps) {
  const [editing, setEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [editName, setEditName] = useState(player.name)
  const [editTeamName, setEditTeamName] = useState(player.killTeamName)

  // WHY: Determine if player is waiting for their turn during Movement Phase
  const isWaiting = !isActive && currentPhase === 'Movement'

  const handleSave = () => {
    onUpdate(player.id, { name: editName, killTeamName: editTeamName })
    setEditing(false)
  }

  const recentHistory = (player.history || []).slice(-5).reverse()
  const positionStr = player.position ? hexId(player.position.row, player.position.col) : 'Not placed'

  return (
    <div
      className={`player-card ${isActive ? 'active' : ''} ${isWaiting ? 'waiting' : ''}`}
      style={{
        borderLeftColor: player.color,
        borderColor: isActive ? player.color : 'transparent'
      }}
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

      {/* WHY: Show active player badge during Movement Phase */}
      {isActive && currentPhase === 'Movement' && (
        <div className="player-active-badge">
          <span className="active-icon">▶️</span>
          <span className="active-text">YOUR TURN TO MOVE</span>
        </div>
      )}

      {/* WHY: Show waiting state badge for non-active players during Movement Phase */}
      {isWaiting && (
        <div className="player-waiting-badge">
          <span className="waiting-icon">⏳</span>
          <span className="waiting-text">Waiting for turn...</span>
        </div>
      )}

      {/* WHY: Issue #55 - Solo mode CP progress tracking */}
      {soloMode && (() => {
        const cpGoal = 10
        const cpProgress = Math.min(player.campaignPoints, cpGoal)
        const cpNeeded = Math.max(0, cpGoal - player.campaignPoints)
        const cpPercentage = (cpProgress / cpGoal) * 100

        let cpStatus = ''
        let cpStatusClass = ''
        if (player.campaignPoints >= cpGoal) {
          cpStatus = '✅ Victory goal achieved!'
          cpStatusClass = 'success'
        } else if (player.campaignPoints >= 6) {
          cpStatus = `📊 ${cpNeeded} CP needed for victory`
          cpStatusClass = 'warning'
        } else {
          cpStatus = `⚠️ ${cpNeeded} CP needed for victory`
          cpStatusClass = 'critical'
        }

        return (
          <div className="solo-cp-progress">
            <div className="cp-goal-label">Campaign Goal: {cpGoal} CP</div>
            <div className="cp-progress-bar">
              <div
                className="cp-progress-fill"
                style={{ width: `${cpPercentage}%` }}
              />
            </div>
            <div className="cp-progress-text">
              {player.campaignPoints}/{cpGoal} CP
            </div>
            <div className={`cp-status ${cpStatusClass}`}>
              {cpStatus}
            </div>
          </div>
        )
      })()}

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
          <span className="asset-label">Camps: {player.camps.length}/2</span>
        </div>

        {/* Camp List */}
        {player.camps.length > 0 && (
          <div className="player-section">
            <div className="structure-list">
              {player.camps.map((camp, idx) => {
                const campHexId = hexId(camp.row, camp.col)
                const campHex = hexes[campHexId]
                return (
                  <div key={idx} className="structure-item">
                    <span className="structure-emoji">⛺</span>
                    <div className="structure-info">
                      <strong>Camp {idx + 1}</strong>
                      <div className="structure-hex">{campHexId}</div>
                      {campHex?.location && (
                        <div className="structure-location">
                          {campHex.type === 'surface'
                            ? SURFACE_LOCATIONS[campHex.location]?.name
                            : TOMB_LOCATIONS[campHex.location]?.name}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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

        {/* WHY: Battle history accordion (Issue #34) */}
        {player.battleHistory && player.battleHistory.length > 0 && (
          <BattleHistory
            history={player.battleHistory as ExtendedBattleRecord[]}
            players={allPlayers.map(p => ({ id: p.id, name: p.name }))}
          />
        )}
      </div>
    </div>
  )
}

interface PlayerPanelProps {
  players: Player[]
  currentPlayerIndex: number
  currentPhase: string
  hexes: Record<string, Hex>
  onUpdatePlayer: (playerId: number, updates: Partial<Player>) => void
  soloMode?: boolean  // WHY: Issue #55 - Pass to PlayerCard for CP progress display
}

export default function PlayerPanel({
  players,
  currentPlayerIndex,
  currentPhase,
  hexes,
  onUpdatePlayer,
  soloMode
}: PlayerPanelProps) {
  // WHY: Diagnostic logging to investigate player panel data flow
  useEffect(() => {
    console.log('[PlayerPanel] Players received:', players)
    console.log('[PlayerPanel] Players count:', players?.length)
    console.log('[PlayerPanel] First player:', players?.[0])
    console.log('[PlayerPanel] Current player index:', currentPlayerIndex)
  }, [players, currentPlayerIndex])

  return (
    <div className="player-panel">
      <h3>Players</h3>
      <div className="player-list">
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            hexes={hexes}
            player={player}
            allPlayers={players}
            isActive={player.id === currentPlayerIndex}
            currentPhase={currentPhase}
            onUpdate={onUpdatePlayer}
            soloMode={soloMode}
          />
        ))}
      </div>
    </div>
  )
}
