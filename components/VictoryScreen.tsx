'use client'

import { useState, useEffect } from 'react'
import type { Player, Hex } from '@/types/campaign'
import { VICTORY_CATEGORIES } from '@/lib/data/campaignData'
import { calculateTotalHexesExplored, calculateTotalBattles, generateNarrativeSummary } from '@/lib/utils/campaignStatistics'
import { calculateHeadhunterScore } from '@/lib/utils/operativeKills'  // WHY: Issue #50 - Calculate wound-based score
import { resolveTie, getTiedPlayers } from '@/lib/utils/tieBreaker'  // WHY: Issue #51 - Tie-breaking system
import { buildPerformanceRecord } from '@/lib/utils/performanceCalculations'  // WHY: Issue #56 - Build current performance
import { loadPerformanceHistory } from '@/lib/utils/performanceStorage'  // WHY: Issue #56 - Load history from localStorage
import type { SoloPerformanceHistory, SoloPerformanceRecord } from '@/types/soloPerformance'  // WHY: Issue #56 - Performance types
import PerformanceHistory from './PerformanceHistory'  // WHY: Issue #56 - Performance history viewer modal

interface VictoryScreenProps {
  players: Player[]
  hexMap?: Record<string, Hex>
  currentRound?: number
  threatLevel?: number
  targetThreatLevel?: number
  onRestart: () => void
  onExport?: () => void
  soloMode?: boolean           // WHY: Determine display mode (Issue #53)
  soloVictory?: boolean        // WHY: Solo success/failure state (Issue #53)
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
  onExport,
  soloMode,
  soloVictory
}: VictoryScreenProps) {
  // WHY: Issue #56 - Solo performance tracking state
  const [performanceHistory, setPerformanceHistory] = useState<SoloPerformanceHistory | null>(null)
  const [currentRecord, setCurrentRecord] = useState<SoloPerformanceRecord | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // WHY: Issue #56 - Load performance history and build current record on mount
  useEffect(() => {
    if (soloMode && players.length === 1 && players[0]) {
      const history = loadPerformanceHistory()
      setPerformanceHistory(history)

      // WHY: Build current campaign record for comparison
      const record = buildPerformanceRecord(
        `current-${Date.now()}`,
        soloVictory ?? false,
        threatLevel ?? 0,
        currentRound ?? 0,
        players[0]
      )
      setCurrentRecord(record)
    }
  }, [soloMode, players, soloVictory, threatLevel, currentRound])

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
  if (!champion || !champion.player) return null

  // Calculate campaign statistics
  const totalHexesExplored = hexMap ? calculateTotalHexesExplored(hexMap) : 0
  const totalBattles = calculateTotalBattles(players)
  const victoryCategory = results.find(r => r.winner.id === champion.player.id)?.name || 'Champion'
  const narrativeSummary = generateNarrativeSummary(champion.player, victoryCategory)

  // WHY: Issue #56 - Helper to check if current value is a new record
  const isNewRecord = (bestKey: keyof SoloPerformanceHistory['personalBests'], value: number): boolean => {
    if (!performanceHistory) return false
    const best = performanceHistory.personalBests[bestKey]
    if (!best) return true  // First campaign is always a record
    return value > best.value
  }

  // WHY: Issue #56 - Helper to format comparison text
  const getComparisonText = (bestKey: keyof SoloPerformanceHistory['personalBests'], currentValue: number): string => {
    if (!performanceHistory) return 'First campaign!'
    const best = performanceHistory.personalBests[bestKey]
    if (!best) return 'First campaign!'

    const diff = currentValue - best.value
    if (diff > 0) return `⭐ NEW RECORD! (+${diff})`
    if (diff === 0) return `Tied record`
    return `Previous best: ${best.value} (${Math.abs(diff)} short)`
  }

  // WHY: Solo mode shows success/failure, not rankings (Issue #53)
  if (soloMode) {
    const soloPlayer = players[0]
    if (!soloPlayer) return null

    return (
      <div className="victory-screen solo-victory-screen">
        {soloVictory ? (
          <div className="solo-success">
            <h2>✅ CAMPAIGN SUCCESSFUL</h2>
            <p className="solo-subtitle">Ctesiphus Expedition Complete</p>

            <div className="solo-final-status">
              <h3>Final Status</h3>
              <div className="solo-stat-row">
                <label>Campaign Points:</label>
                <span className="success">{soloPlayer.campaignPoints}/10 ✓</span>
              </div>
              <div className="solo-stat-row">
                <label>Threat Level:</label>
                <span>{threatLevel}/10</span>
              </div>
              <div className="solo-stat-row">
                <label>Rounds Survived:</label>
                <span>{currentRound}</span>
              </div>
            </div>

            {/* WHY: Issue #56 - Detailed performance categories */}
            {currentRecord && (
              <div className="solo-performance-categories">
                <h3>Performance Categories</h3>

                {/* PIONEER */}
                <div className={`performance-card ${isNewRecord('mostSPSpent', currentRecord.categories.pioneer.value) ? 'new-record' : ''}`}>
                  <div className="category-header">
                    <span className="category-icon">💎</span>
                    <span className="category-name">{currentRecord.categories.pioneer.name}</span>
                  </div>
                  <div className="category-value">{currentRecord.categories.pioneer.value} SP spent</div>
                  <div className="category-comparison">{getComparisonText('mostSPSpent', currentRecord.categories.pioneer.value)}</div>
                </div>

                {/* EXPLORER */}
                <div className={`performance-card ${isNewRecord('mostHexesExplored', currentRecord.categories.explorer.value) ? 'new-record' : ''}`}>
                  <div className="category-header">
                    <span className="category-icon">🗺️</span>
                    <span className="category-name">{currentRecord.categories.explorer.name}</span>
                  </div>
                  <div className="category-value">{currentRecord.categories.explorer.value} hexes explored</div>
                  <div className="category-comparison">{getComparisonText('mostHexesExplored', currentRecord.categories.explorer.value)}</div>
                </div>

                {/* TROOPER */}
                <div className={`performance-card ${isNewRecord('mostGamesPlayed', currentRecord.categories.trooper.value) ? 'new-record' : ''}`}>
                  <div className="category-header">
                    <span className="category-icon">⚔️</span>
                    <span className="category-name">{currentRecord.categories.trooper.name}</span>
                  </div>
                  <div className="category-value">{currentRecord.categories.trooper.value} battles fought</div>
                  <div className="category-comparison">{getComparisonText('mostGamesPlayed', currentRecord.categories.trooper.value)}</div>
                </div>

                {/* WARRIOR */}
                <div className={`performance-card ${isNewRecord('mostGamesWon', currentRecord.categories.warrior.value) ? 'new-record' : ''}`}>
                  <div className="category-header">
                    <span className="category-icon">🏆</span>
                    <span className="category-name">{currentRecord.categories.warrior.name}</span>
                  </div>
                  <div className="category-value">{currentRecord.categories.warrior.value} victories ({currentRecord.stats.winRate > 0 ? Math.round(currentRecord.stats.winRate * 100) : 0}% win rate)</div>
                  <div className="category-comparison">{getComparisonText('mostGamesWon', currentRecord.categories.warrior.value)}</div>
                </div>

                {/* HEADHUNTER */}
                <div className={`performance-card ${isNewRecord('mostOperatives', currentRecord.categories.headhunter.value) ? 'new-record' : ''}`}>
                  <div className="category-header">
                    <span className="category-icon">💀</span>
                    <span className="category-name">{currentRecord.categories.headhunter.name}</span>
                  </div>
                  <div className="category-value">{currentRecord.categories.headhunter.value} operative wounds</div>
                  <div className="category-comparison">{getComparisonText('mostOperatives', currentRecord.categories.headhunter.value)}</div>
                </div>

                {/* Campaign Statistics */}
                <div className="campaign-stats">
                  <h4>Campaign Statistics</h4>
                  <div className="stat-grid">
                    <div className="stat-item">
                      <span className="stat-label">Avg CP/Round:</span>
                      <span className="stat-value">{currentRecord.stats.avgCPPerRound.toFixed(2)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">SP Spent/Round:</span>
                      <span className="stat-value">{currentRecord.stats.spSpentPerRound.toFixed(2)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Hexes/Round:</span>
                      <span className="stat-value">{currentRecord.stats.hexesPerRound.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {narrativeSummary && (
              <div className="solo-narrative">
                <h3>Expedition Summary</h3>
                <p>{narrativeSummary}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="solo-failure">
            <h2>❌ CAMPAIGN FAILED</h2>
            <p className="solo-subtitle">Threat Level Reached Maximum</p>

            <div className="solo-final-status">
              <h3>Final Status</h3>
              <div className="solo-stat-row">
                <label>Campaign Points:</label>
                <span className="failure">{soloPlayer.campaignPoints}/10 ✗</span>
              </div>
              <div className="solo-stat-row">
                <label>Threat Level:</label>
                <span className="danger">10/10 ✗</span>
              </div>
              <div className="solo-stat-row">
                <label>Rounds Survived:</label>
                <span>{currentRound}</span>
              </div>
            </div>

            {/* WHY: Issue #56 - Detailed performance categories (same for failure) */}
            {currentRecord && (
              <div className="solo-performance-categories">
                <h3>Final Performance</h3>

                {/* Render same category cards as success */}
                <div className={`performance-card ${isNewRecord('mostSPSpent', currentRecord.categories.pioneer.value) ? 'new-record' : ''}`}>
                  <div className="category-header">
                    <span className="category-icon">💎</span>
                    <span className="category-name">{currentRecord.categories.pioneer.name}</span>
                  </div>
                  <div className="category-value">{currentRecord.categories.pioneer.value} SP spent</div>
                  <div className="category-comparison">{getComparisonText('mostSPSpent', currentRecord.categories.pioneer.value)}</div>
                </div>

                <div className={`performance-card ${isNewRecord('mostHexesExplored', currentRecord.categories.explorer.value) ? 'new-record' : ''}`}>
                  <div className="category-header">
                    <span className="category-icon">🗺️</span>
                    <span className="category-name">{currentRecord.categories.explorer.name}</span>
                  </div>
                  <div className="category-value">{currentRecord.categories.explorer.value} hexes explored</div>
                  <div className="category-comparison">{getComparisonText('mostHexesExplored', currentRecord.categories.explorer.value)}</div>
                </div>

                <div className={`performance-card ${isNewRecord('mostGamesPlayed', currentRecord.categories.trooper.value) ? 'new-record' : ''}`}>
                  <div className="category-header">
                    <span className="category-icon">⚔️</span>
                    <span className="category-name">{currentRecord.categories.trooper.name}</span>
                  </div>
                  <div className="category-value">{currentRecord.categories.trooper.value} battles fought</div>
                  <div className="category-comparison">{getComparisonText('mostGamesPlayed', currentRecord.categories.trooper.value)}</div>
                </div>

                <div className={`performance-card ${isNewRecord('mostGamesWon', currentRecord.categories.warrior.value) ? 'new-record' : ''}`}>
                  <div className="category-header">
                    <span className="category-icon">🏆</span>
                    <span className="category-name">{currentRecord.categories.warrior.name}</span>
                  </div>
                  <div className="category-value">{currentRecord.categories.warrior.value} victories ({currentRecord.stats.winRate > 0 ? Math.round(currentRecord.stats.winRate * 100) : 0}% win rate)</div>
                  <div className="category-comparison">{getComparisonText('mostGamesWon', currentRecord.categories.warrior.value)}</div>
                </div>

                <div className={`performance-card ${isNewRecord('mostOperatives', currentRecord.categories.headhunter.value) ? 'new-record' : ''}`}>
                  <div className="category-header">
                    <span className="category-icon">💀</span>
                    <span className="category-name">{currentRecord.categories.headhunter.name}</span>
                  </div>
                  <div className="category-value">{currentRecord.categories.headhunter.value} operative wounds</div>
                  <div className="category-comparison">{getComparisonText('mostOperatives', currentRecord.categories.headhunter.value)}</div>
                </div>

                <div className="campaign-stats">
                  <h4>Campaign Statistics</h4>
                  <div className="stat-grid">
                    <div className="stat-item">
                      <span className="stat-label">Avg CP/Round:</span>
                      <span className="stat-value">{currentRecord.stats.avgCPPerRound.toFixed(2)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">SP Spent/Round:</span>
                      <span className="stat-value">{currentRecord.stats.spSpentPerRound.toFixed(2)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Hexes/Round:</span>
                      <span className="stat-value">{currentRecord.stats.hexesPerRound.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="victory-actions">
          {/* WHY: Issue #56 - Button to view performance history */}
          {performanceHistory && performanceHistory.campaigns.length > 0 && (
            <button className="history-btn" onClick={() => setShowHistoryModal(true)}>
              View Performance History ({performanceHistory.campaigns.length} campaigns)
            </button>
          )}

          {onExport && (
            <button className="export-btn" onClick={onExport}>
              Export Campaign Narrative
            </button>
          )}
          <button className="restart-btn" onClick={onRestart}>
            Start New Campaign
          </button>
        </div>
      </div>
    )
  }

  // WHY: Competitive mode shows rankings and category winners (Issue #53)
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

      {/* WHY: Issue #56 - Performance History Modal */}
      {showHistoryModal && performanceHistory && (
        <PerformanceHistory
          history={performanceHistory}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  )
}
