# Victory Tie-Breaking System

## Description

The rules specify: "If players are tied on an award, use the following sorters. In order of priority, a player wins that award if they have the:
• Most Campaign points.
• Most games won.
• Most Supply points.
• Most hexes explored."

Note: This appears to be "Most Supply points" as current SP, but could also mean "Most SP spent" - needs clarification.

**Current Implementation:**
- Victory categories calculated ✅
- Tie-breaking may not be implemented
- Tie-breaking order may not follow official rules

**What Needs to Be Implemented:**
- Four-tier tie-breaking system in strict order
- Automatic tie resolution when awards are calculated
- Clear indication when tie-breaking is applied
- Handle multi-way ties (3+ players)
- Display tie-breaker explanation on victory screen
- Edge case: Ultimate tie (all sorters equal)

## Acceptance Criteria

- [ ] When multiple players tied for an award, apply tie-breaking
- [ ] Tie-breaker order: CP → Games Won → SP → Hexes Explored
- [ ] First tie-breaker that produces unique winner determines award
- [ ] If all tie-breakers equal, award is shared (or use final roll-off)
- [ ] Victory screen shows tie-breaker used
- [ ] Multi-way ties handled correctly
- [ ] Unit tests validate all tie-breaking scenarios
- [ ] Integration tests verify tie resolution

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Tie-breaking logic
- `src/components/VictoryScreen.jsx` - Display tie-breaker information
- New utility: `src/utils/tieBreaker.js` - Reusable tie-breaking logic

**Implementation Considerations:**

- Tie-breaking function:
```javascript
function resolveTie(tiedPlayers, awardName) {
  const tieBreakers = [
    {
      name: "Campaign Points",
      getter: p => p.stats.campaignPoints
    },
    {
      name: "Games Won",
      getter: p => p.stats.gamesWon
    },
    {
      name: "Supply Points",
      getter: p => p.sp  // Current SP (or could be spSpent?)
    },
    {
      name: "Hexes Explored",
      getter: p => p.stats.explorationCount
    }
  ];

  let candidates = [...tiedPlayers];
  let tieBreakerUsed = null;

  for (const tieBreaker of tieBreakers) {
    const maxValue = Math.max(...candidates.map(tieBreaker.getter));
    const newCandidates = candidates.filter(p => tieBreaker.getter(p) === maxValue);

    if (newCandidates.length === 1) {
      // Tie broken!
      return {
        winner: newCandidates[0],
        tieBreaker: tieBreaker.name,
        tiedWith: tiedPlayers.filter(p => p.id !== newCandidates[0].id)
      };
    }

    if (newCandidates.length < candidates.length) {
      // Tie partially resolved, continue with remaining candidates
      candidates = newCandidates;
      tieBreakerUsed = tieBreaker.name;
    }
  }

  // Ultimate tie - all sorters equal
  // Either share award or roll-off
  return {
    winner: null,  // Shared
    sharedWinners: candidates,
    reason: "All tie-breakers equal"
  };
}
```

- Victory screen with tie-breaker display:
```
🏆 EXPLORER (Most Hexes)
   Green Player: 8 hexes explored

   Tied with Blue Player (8 hexes)
   Won by tie-breaker: Most Campaign Points
   (Green: 12 CP, Blue: 10 CP)
```

- Shared award display:
```
🏆 PIONEER (Most SP Spent)
   Red Player: 45 SP (shared)
   Blue Player: 45 SP (shared)

   Could not break tie - all sorters equal
```

- Multi-way tie example:
  - 3 players tied for TROOPER (all played 8 games)
  - Check CP: Player A (12), Player B (12), Player C (10)
  - Player C eliminated, continue with A and B
  - Check Games Won: Player A (6), Player B (5)
  - Player A wins TROOPER
  - Display: "Won by tie-breaker: Most Games Won"

- Tie-breaking scenarios:
```javascript
// Scenario 1: Simple two-way tie broken by first sorter
{
  category: "EXPLORER",
  stat: "hexesExplored",
  tied: [PlayerA: 6, PlayerB: 6],
  tieBreaker1_CP: [PlayerA: 12, PlayerB: 10],
  winner: PlayerA,
  breaker: "Campaign Points"
}

// Scenario 2: Need multiple tie-breakers
{
  category: "TROOPER",
  stat: "gamesPlayed",
  tied: [PlayerA: 8, PlayerB: 8],
  tieBreaker1_CP: [PlayerA: 10, PlayerB: 10],  // Still tied
  tieBreaker2_GamesWon: [PlayerA: 6, PlayerB: 5],  // Broken!
  winner: PlayerA,
  breaker: "Games Won"
}

// Scenario 3: Ultimate tie
{
  category: "WARRIOR",
  stat: "gamesWon",
  tied: [PlayerA: 5, PlayerB: 5],
  tieBreaker1_CP: [PlayerA: 10, PlayerB: 10],
  tieBreaker2_GamesWon: [N/A - same as primary stat],
  tieBreaker3_SP: [PlayerA: 7, PlayerB: 7],
  tieBreaker4_Hexes: [PlayerA: 6, PlayerB: 6],
  winner: null,
  sharedWinners: [PlayerA, PlayerB]
}
```

- SP clarification note:
  - Rules say "Most Supply points"
  - Could mean: Current SP (at end of campaign)
  - Or could mean: Total SP spent (PIONEER stat)
  - Recommendation: Use current SP (simpler, matches wording)
  - Document in rules or add option

- Ultimate tie resolution options:
  1. **Share award**: Both players get title (recommended)
  2. **Roll-off**: D6 roll, highest wins
  3. **Co-winners**: Display both equally
  4. **Use order**: Player who achieved stat first

- Event log for ties:
  - "Green Player wins EXPLORER (8 hexes)"
  - "Tie-breaker: Most Campaign Points (Green: 12, Blue: 10)"

**Related Issues:**
- Related to Victory Categories Tracking (#031)
- Related to Priority Establishment System (#008)
- Related to Victory Screen (#013)

## Labels

`enhancement`, `gameplay`, `ui`
