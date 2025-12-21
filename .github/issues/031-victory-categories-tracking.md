# Victory Categories Tracking and Calculation

## Description

The campaign defines six victory categories awarded at the end:
1. **WARLORD**: Most Campaign Points
2. **PIONEER**: Most Supply Points spent
3. **EXPLORER**: Most hexes explored
4. **TROOPER**: Most games played
5. **WARRIOR**: Most games won
6. **HEADHUNTER**: Most enemy operatives incapacitated (with wound-based counting)

**Current Implementation:**
- Five victory categories exist ✅
- Basic tracking for CP, SP, hexes, games ✅
- HEADHUNTER (kills tracking) may not use wound-based counting
- SP spent tracking may not exist (only current SP tracked)
- Victory screen shows winners ✅

**What Needs to Be Enhanced:**
- Track SP spent (separate from current SP)
- Implement wound-based operative counting for HEADHUNTER
- All six victory categories properly calculated
- Clear statistics display during campaign
- Enhanced victory screen with all categories
- Real-time category leader updates

## Acceptance Criteria

- [ ] WARLORD: Tracks total CP accumulated
- [ ] PIONEER: Tracks total SP spent (cumulative)
- [ ] EXPLORER: Tracks unique hexes explored
- [ ] TROOPER: Tracks total games played
- [ ] WARRIOR: Tracks total games won
- [ ] HEADHUNTER: Tracks enemy operatives with wound-based counting
- [ ] All statistics updated in real-time
- [ ] Victory screen shows winner for each category
- [ ] Player panel shows current standings
- [ ] Unit tests validate all tracking logic
- [ ] Integration tests verify victory calculations

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Enhanced statistics tracking
- `src/components/VictoryScreen.jsx` - Display all six categories
- `src/components/PlayerPanel.jsx` - Show current category standings
- New component: `src/components/CategoryStandings.jsx` - Live leaderboard

**Implementation Considerations:**

- Player statistics structure:
```javascript
playerStats = {
  // WARLORD
  campaignPoints: 12,

  // PIONEER
  supplyPointsSpent: 45,  // NEW: cumulative SP spent

  // EXPLORER
  hexesExplored: [5, 8, 12, 14, 18, 23],  // Array of unique hex IDs
  explorationCount: 6,  // Derived: length of array

  // TROOPER
  gamesPlayed: 8,

  // WARRIOR
  gamesWon: 5,

  // HEADHUNTER
  operativesIncapacitated: {
    total: 15,  // Raw count
    weighted: 9  // Wound-based count
  },
  killDetails: [
    { operative: "Fire Warrior", wounds: 7, worth: 1 },
    { operative: "Ork Nob", wounds: 12, worth: 2 },
    // ...
  ]
};
```

- SP spent tracking:
```javascript
function spendSupplyPoints(player, amount, reason) {
  // Deduct from current
  player.sp -= amount;

  // Track cumulative spent
  player.stats.supplyPointsSpent += amount;

  // Log
  logEvent(`${player.name} spent ${amount} SP (${reason})`);
}
```

- Operative counting (HEADHUNTER):
```javascript
function calculateOperativeWorth(wounds) {
  if (wounds <= 5) return 0;      // 5 or less = 0
  if (wounds <= 10) return 1;     // 6-10 = 1
  return 2;                        // 11+ = 2
}

function recordOperativeKill(player, operative) {
  const worth = calculateOperativeWorth(operative.wounds);

  player.stats.operativesIncapacitated.total += 1;
  player.stats.operativesIncapacitated.weighted += worth;

  player.stats.killDetails.push({
    operative: operative.name,
    wounds: operative.wounds,
    worth: worth,
    round: gameState.currentRound
  });
}
```

- Victory calculation:
```javascript
function calculateVictoryCategories(players) {
  return {
    WARLORD: findWinner(players, p => p.stats.campaignPoints),
    PIONEER: findWinner(players, p => p.stats.supplyPointsSpent),
    EXPLORER: findWinner(players, p => p.stats.explorationCount),
    TROOPER: findWinner(players, p => p.stats.gamesPlayed),
    WARRIOR: findWinner(players, p => p.stats.gamesWon),
    HEADHUNTER: findWinner(players, p => p.stats.operativesIncapacitated.weighted)
  };
}

function findWinner(players, statGetter) {
  const sorted = [...players].sort((a, b) => statGetter(b) - statGetter(a));
  const maxValue = statGetter(sorted[0]);

  // Get all tied players
  const winners = sorted.filter(p => statGetter(p) === maxValue);

  if (winners.length === 1) {
    return winners[0];
  }

  // Tie-breaking needed (see issue #032)
  return resolveTie(winners);
}
```

- Live category standings:
```
Campaign Standings
──────────────────────────────────
WARLORD (Most CP):
  1. Blue Player: 12 CP
  2. Red Player: 10 CP
  3. Green Player: 8 CP

PIONEER (Most SP Spent):
  1. Red Player: 45 SP
  2. Blue Player: 38 SP
  3. Green Player: 32 SP

EXPLORER (Most Hexes):
  1. Green Player: 8 hexes
  2. Blue Player: 6 hexes
  3. Red Player: 5 hexes

[Show All Categories]
```

- Victory screen enhancements:
```
Campaign Complete!
Threat Level: 7 (Awakened)
Rounds Completed: 12

Victory Categories
──────────────────────────────────
🏆 WARLORD (Most CP)
   Blue Player: 12 CP

🏆 PIONEER (Most SP Spent)
   Red Player: 45 SP

🏆 EXPLORER (Most Hexes)
   Green Player: 8 hexes explored

🏆 TROOPER (Most Games)
   Blue Player: 8 games

🏆 WARRIOR (Most Wins)
   Blue Player: 5 wins

🏆 HEADHUNTER (Most Kills)
   Red Player: 9 operatives

Overall Champion:
Blue Player (3 titles)
```

- Real-time updates:
  - After each action, recalculate standings
  - Show notification when player takes category lead
  - "Red Player is now leading PIONEER (45 SP spent)"
  - Optional: Race for specific titles

**Related Issues:**
- Related to Tie-Breaking System (#032)
- Related to Headhunter Kill Recording (#033)
- Related to Victory Screen (#013)
- Related to Campaign Log (#009)

## Labels

`enhancement`, `gameplay`, `ui`
