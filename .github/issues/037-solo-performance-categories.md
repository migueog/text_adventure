# Solo Performance Categories and Tracking

## Description

Solo mode tracks performance in five categories:
- **PIONEER**: Number of Supply points spent
- **EXPLORER**: Number of hexes explored
- **TROOPER**: Number of games played
- **WARRIOR**: Number of games won
- **HEADHUNTER**: Number of enemy operatives incapacitated (wound-based)

Note: WARLORD category doesn't exist in solo (no CP competition)

**Current Implementation:**
- Competitive victory categories exist ✅
- Solo performance categories partially implemented
- Performance comparison between campaigns may not exist

**What Needs to Be Implemented:**
- Track all five solo performance categories
- Display performance stats on victory screen
- Save campaign performance for comparison
- "Compare with previous campaigns" feature
- Performance history/records
- Personal best tracking

## Acceptance Criteria

- [ ] All five performance categories tracked
- [ ] Victory screen shows complete performance stats
- [ ] Previous campaign results saved for comparison
- [ ] UI shows current vs best performance
- [ ] Performance history viewable
- [ ] Personal records highlighted (new bests)
- [ ] Unit tests validate performance tracking
- [ ] Integration tests verify stat recording

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Performance tracking
- `src/components/VictoryScreen.jsx` - Performance display
- New component: `src/components/PerformanceHistory.jsx`
- Browser localStorage or file save for campaign history

**Implementation Considerations:**

- Performance structure:
```javascript
soloPerformance = {
  campaignId: "campaign_20250115_001",
  date: "2025-01-15T10:30:00Z",
  success: true,
  finalCP: 12,
  finalThreat: 10,
  rounds: 15,

  categories: {
    pioneer: {
      name: "Supply Points Spent",
      value: 67,
      description: "Total SP spent throughout campaign"
    },
    explorer: {
      name: "Hexes Explored",
      value: 14,
      description: "Unique hexes discovered"
    },
    trooper: {
      name: "Games Played",
      value: 12,
      description: "Total battles fought"
    },
    warrior: {
      name: "Games Won",
      value: 8,
      description: "Victories achieved"
    },
    headhunter: {
      name: "Operatives Eliminated",
      value: 11,
      description: "Enemy operatives incapacitated (weighted)"
    }
  },

  // Additional stats
  stats: {
    winRate: 0.67,  // 8/12
    avgCPPerRound: 0.8,  // 12/15
    spSpentPerRound: 4.47,  // 67/15
    hexesPerRound: 0.93  // 14/15
  }
};
```

- Victory screen performance display:
```
Solo Campaign Complete
Success: ✓ (12 CP / 10 required)
──────────────────────────────────

Performance Categories
──────────────────────────────────
PIONEER: 67 SP spent
  Previous best: 52 SP
  ⭐ NEW RECORD!

EXPLORER: 14 hexes explored
  Previous best: 16 hexes
  (2 hexes short of record)

TROOPER: 12 games played
  Previous best: 15 games

WARRIOR: 8 games won
  Previous best: 9 wins
  Win rate: 67%

HEADHUNTER: 11 operatives
  Previous best: 11 operatives
  (Tied record)

[View Campaign History] [New Campaign]
```

- Performance history view:
```
Solo Campaign History
──────────────────────────────────
Campaign 4 (Current) - Success ✓
  CP: 12, Threat: 10, Rounds: 15
  Pioneer: 67 SP (BEST) ⭐
  Explorer: 14 hexes
  Trooper: 12 games
  Warrior: 8 wins
  Headhunter: 11 ops

Campaign 3 - Failed ✗
  CP: 8, Threat: 10, Rounds: 12
  Pioneer: 45 SP
  Explorer: 10 hexes
  ...

Campaign 2 - Success ✓
  CP: 11, Threat: 10, Rounds: 18
  Explorer: 16 hexes (BEST) ⭐
  ...

Campaign 1 - Success ✓
  CP: 10, Threat: 10, Rounds: 14
  ...

[Export History] [Clear History]
```

- Personal records:
```javascript
personalBests = {
  highestCP: { value: 15, campaignId: "campaign_5" },
  lowestThreatAtVictory: { value: 7, campaignId: "campaign_2" },
  mostSPSpent: { value: 72, campaignId: "campaign_6" },
  mostHexesExplored: { value: 18, campaignId: "campaign_3" },
  mostGamesPlayed: { value: 20, campaignId: "campaign_4" },
  mostGamesWon: { value: 15, campaignId: "campaign_4" },
  mostOperatives: { value: 14, campaignId: "campaign_5" },
  shortestVictory: { rounds: 10, campaignId: "campaign_7" },
  longestVictory: { rounds: 22, campaignId: "campaign_1" }
};
```

- Comparison with previous:
```
Performance Comparison
──────────────────────────────────
          Current  |  Best  | Diff
──────────────────────────────────
CP:          12    |   15   |  -3
Threat:      10    |   10   |   0
Rounds:      15    |   14   |  +1
SP Spent:    67    |   67   |   0 ⭐
Hexes:       14    |   16   |  -2
Games:       12    |   15   |  -3
Wins:         8    |    9   |  -1
Ops:         11    |   11   |   0 ⭐
──────────────────────────────────
```

- Storage implementation:
```javascript
// Save to localStorage
function saveSoloCampaignResult(performance) {
  const history = JSON.parse(localStorage.getItem('soloHistory') || '[]');
  history.push(performance);
  localStorage.setItem('soloHistory', JSON.stringify(history));

  updatePersonalBests(performance);
}

// Load history
function loadSoloCampaignHistory() {
  return JSON.parse(localStorage.getItem('soloHistory') || '[]');
}

// Get personal bests
function getPersonalBests() {
  const history = loadSoloCampaignHistory();

  return {
    highestCP: Math.max(...history.map(c => c.finalCP)),
    mostSPSpent: Math.max(...history.map(c => c.categories.pioneer.value)),
    mostHexesExplored: Math.max(...history.map(c => c.categories.explorer.value)),
    // ... etc
  };
}
```

- Export performance data:
```
Solo Campaign Performance Export
─────────────────────────────────
Campaign #4 - 2025-01-15

Result: SUCCESS ✓
Final CP: 12 / 10 required
Threat: 10 (Maximum)
Rounds: 15

Performance:
- Pioneer: 67 SP spent
- Explorer: 14 hexes explored
- Trooper: 12 games played
- Warrior: 8 games won (67% win rate)
- Headhunter: 11 operatives eliminated

Notable Achievements:
⭐ New record: Most SP spent (67)
⭐ Tied record: Most operatives (11)

[Copy to Clipboard] [Save as Text]
```

**Related Issues:**
- Related to Solo Victory Condition (#036)
- Related to Victory Categories Tracking (#031)
- Related to Campaign Log (#009)
- Related to Save/Load functionality (future)

## Labels

`enhancement`, `gameplay`, `ui`
