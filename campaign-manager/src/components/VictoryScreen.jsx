import React from 'react';
import { VICTORY_CATEGORIES } from '../data/campaignData';

export default function VictoryScreen({ players, onRestart }) {
  // Calculate winners for each category
  const results = VICTORY_CATEGORIES.map(category => {
    const sorted = [...players].sort((a, b) => {
      return b[category.stat] - a[category.stat];
    });
    return {
      ...category,
      winner: sorted[0],
      standings: sorted
    };
  });

  // Calculate overall scores (simple point system)
  const overallScores = players.map(player => {
    let points = 0;
    results.forEach(result => {
      const idx = result.standings.findIndex(p => p.id === player.id);
      points += (players.length - idx);
    });
    return { player, points };
  }).sort((a, b) => b.points - a.points);

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
            style={{ borderColor: overallScores[0].player.color }}
          >
            <div
              className="winner-badge"
              style={{ backgroundColor: overallScores[0].player.color }}
            >
              👑
            </div>
            <div className="winner-name">{overallScores[0].player.name}</div>
            <div className="winner-team">{overallScores[0].player.killTeamName}</div>
            <div className="winner-points">{overallScores[0].points} points</div>
          </div>
        </div>

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
                  {result.winner[result.stat]}
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
                  <td>{score.player.hexesExplored}</td>
                  <td>{score.player.operativesKilled}</td>
                  <td>{score.player.gamesWon}/{score.player.gamesPlayed}</td>
                  <td><strong>{score.points}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="restart-btn" onClick={onRestart}>
          Start New Campaign
        </button>
      </div>
    </div>
  );
}
