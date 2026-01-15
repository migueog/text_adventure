'use client'

import type { Player } from '@/types/campaign'
import { VICTORY_CATEGORIES } from '@/lib/data/campaignData'
import { calculateHeadhunterScore } from '@/lib/utils/operativeKills'
import { useState, useMemo } from 'react'

interface CategoryStandingsProps {
  players: Player[]
  compact?: boolean
}

// WHY: Reuse from VictoryScreen - get stat value (handles calculated stats)
function getStatValue(player: Player, stat: string): number {
  if (stat === 'headhunterScore') {
    return calculateHeadhunterScore(player)
  }
  return (player as any)[stat] || 0
}

interface CategoryLeader {
  categoryName: string
  categoryIcon: string
  description: string
  leader: Player | null
  leaderStat: number
  tied: boolean
  tiedPlayers: Player[]
}

// WHY: Map category IDs to emoji icons
function getCategoryIcon(categoryId: string): string {
  const icons: Record<string, string> = {
    'warlord': '🏆',
    'pioneer': '🏗️',
    'explorer': '🗺️',
    'trooper': '🎮',
    'warrior': '⚔️',
    'headhunter': '💀'
  }
  return icons[categoryId] || '📊'
}

export default function CategoryStandings({ players }: CategoryStandingsProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // WHY: Calculate current leader for each category (Issue #21)
  const standings: CategoryLeader[] = useMemo(() => {
    return VICTORY_CATEGORIES.map(category => {
      if (players.length === 0) {
        return {
          categoryName: category.name,
          categoryIcon: getCategoryIcon(category.id),
          description: category.description,
          leader: null,
          leaderStat: 0,
          tied: false,
          tiedPlayers: []
        }
      }

      // Sort by stat descending
      const sorted = [...players].sort((a, b) => {
        const aStat = getStatValue(a, category.stat)
        const bStat = getStatValue(b, category.stat)
        return bStat - aStat
      })

      const leader = sorted[0]
      if (!leader) {
        return {
          categoryName: category.name,
          categoryIcon: getCategoryIcon(category.id),
          description: category.description,
          leader: null,
          leaderStat: 0,
          tied: false,
          tiedPlayers: []
        }
      }

      const leaderStat = getStatValue(leader, category.stat)

      // Check for ties at top
      const tiedPlayers = sorted.filter(p => getStatValue(p, category.stat) === leaderStat)

      return {
        categoryName: category.name,
        categoryIcon: getCategoryIcon(category.id),
        description: category.description,
        leader,
        leaderStat,
        tied: tiedPlayers.length > 1,
        tiedPlayers
      }
    })
  }, [players])

  return (
    <div className="category-standings">
      <div className="standings-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>Victory Category Leaders</h3>
        <button className="collapse-btn">{isExpanded ? '▼' : '▶'}</button>
      </div>

      {isExpanded && (
        <div className="standings-list">
          {standings.map((standing, idx) => (
            <div key={idx} className="standing-item">
              <div className="standing-category">
                <span className="category-icon">{standing.categoryIcon}</span>
                <span className="category-name">{standing.categoryName}</span>
              </div>

              {standing.leader ? (
                <div className="standing-leader">
                  {standing.tied ? (
                    <div className="tied-leaders">
                      <span className="tie-indicator">TIED: </span>
                      {standing.tiedPlayers.map((p, i) => (
                        <span key={p.id} style={{ color: p.color }}>
                          {p.name}{i < standing.tiedPlayers.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                      <span className="leader-stat"> - {standing.leaderStat}</span>
                    </div>
                  ) : (
                    <>
                      <span className="leader-name" style={{ color: standing.leader.color }}>
                        {standing.leader.name}
                      </span>
                      <span className="leader-stat"> - {standing.leaderStat}</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="no-leader">No data yet</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
