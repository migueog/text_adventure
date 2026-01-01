'use client'

import type { Player, Hex } from '@/types/campaign'
import { VICTORY_CATEGORIES } from '@/lib/data/campaignData'
import { calculateTotalHexesExplored, calculateTotalBattles, generateNarrativeSummary } from '@/lib/utils/campaignStatistics'
import { calculateHeadhunterScore } from '@/lib/utils/operativeKills'  // WHY: Issue #50 - Calculate wound-based score
import { resolveTie, getTiedPlayers } from '@/lib/utils/tieBreaker'  // WHY: Issue #51 - Tie-breaking system

interface VictoryScreenProps {
  players: Player[]
  hexMap?: Record<string, Hex>
  currentRound?: number
  threatLevel?: number
  targetThreatLevel?: number
  onRestart: () => void
  onExport?: () => void
}

interface CategoryResult {
  id: string
  name: string
  description: string
  stat: string
  winner: Player
  standings: Player[]
  tieBreaker?: string | null      // WHY: Issue #51 - Name of tie-breaker used (null if shared)
  tiedPlayers?: Player[]          // WHY: Issue #51 - Players tied at top for UI display
  sharedWin?: boolean             // WHY: Issue #51 - True if ultimate tie (shared victory)
}

interface OverallScore {
  player: Player
  points: number
}

// WHY: Issue #51 - Helper to get stat value (handles calculated stats like headhunterScore)
function getStatValue(player: Player, stat: string): number {
  if (stat === 'headhunterScore') {
    return calculateHeadhunterScore(player)
  }
  return (player as any)[stat] || 0
}

export default function VictoryScreen({
  players,
  hexMap,
  currentRound,
  threatLevel,
  targetThreatLevel,
  onRestart,
  onExport
}: VictoryScreenProps) {
  // WHY: Issue #51 - Calculate winners for each category with tie-breaking
  const results: CategoryResult[] = VICTORY_CATEGORIES.map(category => {
    // WHY: Sort players by category stat (descending)
    const sorted = [...players].sort((a, b) => {
      const aStat = getStatValue(a, category.stat)
      const bStat = getStatValue(b, category.stat)
      return bStat - aStat
    })

    // WHY: Issue #51 - Check if top players are tied and apply tie-breaking
    const topPlayers = getTiedPlayers(sorted, p => getStatValue(p, category.stat))

    let tieBreaker: string | null = null
    let winner: Player
    let sharedWin = false

    if (topPlayers.length > 1) {
      // WHY: Multiple players tied - apply tie-breaking algorithm
      const result = resolveTie(topPlayers, p => getStatValue(p, category.stat))
      winner = result.winners[0]
      tieBreaker = result.tieBreaker
      sharedWin = result.winners.length > 1
    } else {
      // WHY: No tie - single winner
      winner = sorted[0]
    }

    return {
      ...category,
      winner,
      standings: sorted,
      tieBreaker,
      tiedPlayers: topPlayers,
      sharedWin
    }
  })

  // Calculate overall scores (simple point system)
  const overallScores: OverallScore[] = players.map(player => {
    let points = 0
    results.forEach(result => {
      const idx = result.standings.findIndex(p => p.id === player.id)
      points += (players.length - idx)
    })
    return { player, points }
  }).sort((a, b) => b.points - a.points)

  const champion = overallScores[0]
  if (!champion) return null

  // Calculate campaign statistics
  const totalHexesExplored = hexMap ? calculateTotalHexesExplored(hexMap) : 0
  const totalBattles = calculateTotalBattles(players)
  const victoryCategory = results.find(r => r.winner.id === champion.player.id)?.name || 'Champion'
  const narrativeSummary = generateNarrativeSummary(champion.player, victoryCategory)

  return (
    <div className="victory-screen">
      <div className="victory-header">
        <h1>Campaign Complete!</h1>
        <h2>The Ctesiphus Expedition Has Concluded</h2>
      </div>

      <div className="victory-content">
        <div className="overall-winner">
          <h3>Overall Champion</h3>
          <div
            className="winner-card"
            style={{ borderColor: champion.player.color }}
          >
            <div
              className="winner-badge"
              style={{ backgroundColor: champion.player.color }}
            >
              👑
            </div>
            <div className="winner-name">{champion.player.name}</div>
            <div className="winner-team">{champion.player.killTeamName}</div>
            <div className="winner-points">{champion.points} points</div>
          </div>
          <div className="narrative-summary">
            <p>{narrativeSummary}</p>
          </div>
        </div>

        {(currentRound || threatLevel) && (
          <div className="campaign-statistics">
            <h3>Campaign Statistics</h3>
            <div className="stats-grid">
              {currentRound && (
                <div className="stat-item">
                  <span className="stat-label">Total Rounds:</span>
                  <span className="stat-value">{currentRound}</span>
                </div>
              )}
              {(threatLevel && targetThreatLevel) && (
                <div className="stat-item">
                  <span className="stat-label">Final Threat:</span>
                  <span className="stat-value">{threatLevel} / {targetThreatLevel}</span>
                </div>
              )}
              {hexMap && (
                <div className="stat-item">
                  <span className="stat-label">Hexes Explored:</span>
                  <span className="stat-value">{totalHexesExplored} / {Object.keys(hexMap).length}</span>
                </div>
              )}
              <div className="stat-item">
                <span className="stat-label">Total Battles:</span>
                <span className="stat-value">{totalBattles}</span>
              </div>
            </div>
          </div>
        )}

        <div className="category-results">
          <h3>Category Winners</h3>
          <div className="categories-grid">
            {results.map(result => (
              <div key={result.id} className="category-card">
                <div className="category-title">{result.name}</div>
                <div className="category-desc">{result.description}</div>
                <div
                  className="category-winner"
                  style={{ color: result.winner.color }}
                >
                  {/* WHY: Issue #51 - Show "(Shared)" prefix for shared victories */}
                  {result.sharedWin ? '(Shared) ' : ''}{result.winner.name}
                </div>
                <div className="category-value">
                  {/* WHY: Issue #50/#51 - Show calculated score for headhunterScore */}
                  {getStatValue(result.winner, result.stat)}
                </div>

                {/* WHY: Issue #51 - Display tie-breaker information when tie exists */}
                {result.tieBreaker && (
                  <div className="tie-breaker-info">
                    <div className="tie-breaker-label">Tie-breaker:</div>
                    <div className="tie-breaker-text">{result.tieBreaker}</div>
                    <div className="tied-players">
                      Tied with: {result.tiedPlayers
                        ?.filter(p => p.id !== result.winner.id)
                        .map(p => p.name)
                        .join(', ')}
                    </div>
                  </div>
                )}

                {/* WHY: Issue #51 - Display shared victory notice for ultimate ties */}
                {result.sharedWin && (
                  <div className="shared-win-notice">
                    All tie-breakers equal - shared victory
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="final-standings">
          <h3>Final Standings</h3>
          <table className="standings-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>CP</th>
                <th>SP</th>
                <th>Hexes</th>
                <th>Kills</th>
                <th>Games</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {overallScores.map((score, idx) => (
                <tr key={score.player.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <span
                      className="player-dot"
                      style={{ backgroundColor: score.player.color }}
                    />
                    {score.player.name}
                  </td>
                  <td>{score.player.campaignPoints}</td>
                  <td>{score.player.supplyPoints}</td>
                  <td>{score.player.exploredHexes}</td>
                  <td>{score.player.operativesKilled}</td>
                  <td>{score.player.gamesWon}/{score.player.gamesPlayed}</td>
                  <td><strong>{score.points}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="victory-actions">
          {onExport && (
            <button className="export-btn" onClick={onExport}>
              Export Campaign Data
            </button>
          )}
          <button className="restart-btn" onClick={onRestart}>
            Start New Campaign
          </button>
        </div>
      </div>
    </div>
  )
}
