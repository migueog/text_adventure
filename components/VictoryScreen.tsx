'use client'

import type { Player, Hex } from '@/types/campaign'
import { VICTORY_CATEGORIES } from '@/lib/data/campaignData'
import { calculateTotalHexesExplored, calculateTotalBattles, generateNarrativeSummary } from '@/lib/utils/campaignStatistics'
import { calculateHeadhunterScore } from '@/lib/utils/operativeKills'  // WHY: Issue #50 - Calculate wound-based score

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
}

interface OverallScore {
  player: Player
  points: number
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
  // Calculate winners for each category
  const results: CategoryResult[] = VICTORY_CATEGORIES.map(category => {
    const sorted = [...players].sort((a, b) => {
      // WHY: Issue #50 - Handle calculated stats like headhunterScore
      let aStat: number
      let bStat: number

      if (category.stat === 'headhunterScore') {
        aStat = calculateHeadhunterScore(a)
        bStat = calculateHeadhunterScore(b)
      } else {
        aStat = (a as any)[category.stat] || 0
        bStat = (b as any)[category.stat] || 0
      }

      return bStat - aStat
    })
    return {
      ...category,
      winner: sorted[0] as Player,
      standings: sorted
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
                  {result.winner.name}
                </div>
                <div className="category-value">
                  {/* WHY: Issue #50 - Show calculated score for headhunterScore */}
                  {result.stat === 'headhunterScore'
                    ? calculateHeadhunterScore(result.winner)
                    : (result.winner as any)[result.stat]}
                </div>
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
