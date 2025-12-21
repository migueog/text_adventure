# Battle Phase Rewards and Special Cases

## Description

The Battle Phase rules specify several reward scenarios and edge cases:

**Rewards:**
- Win: +1 Campaign Point
- Draw or Loss: +1 Supply Point

**Special Cases:**
- **Bye**: Player doesn't play, gains 2 SP
- **Extra games**: Player can play extra game to help odd player, but only counts one game for points
- **Missing player**: Record as loss for missing player, win for opponent

**Current Implementation:**
- Basic battle rewards exist (Win = CP, others = SP) ✅
- Bye option exists ✅
- Special cases may not be fully implemented

**What Needs to Be Implemented:**
- Clear reward display for each battle result
- Bye system with 2 SP reward
- Extra game mechanism (one player plays twice but chooses which counts)
- Missing player handling with sporting loss/win recording
- Clear messaging about reward rules
- Battle result validation

## Acceptance Criteria

- [ ] Win grants exactly 1 CP
- [ ] Draw or Loss grants exactly 1 SP
- [ ] Bye option available, grants 2 SP
- [ ] Extra game option allows player to play twice
- [ ] Player playing extra game chooses which result counts for points
- [ ] Missing player can be recorded with automatic loss/win
- [ ] UI clearly shows rewards before recording result
- [ ] Rewards are applied immediately upon result confirmation
- [ ] Event log shows reward details
- [ ] Unit tests validate all reward scenarios
- [ ] Integration tests verify special case handling

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Enhanced battle reward logic
- `src/components/PhaseTracker.jsx` - Battle result UI with reward display
- New component: `src/components/BattleRewardsDisplay.jsx`
- New component: `src/components/SpecialBattleOptions.jsx`

**Implementation Considerations:**

- Battle rewards structure:
```javascript
const battleRewards = {
  win: {
    cp: 1,
    sp: 0,
    description: "Victory! Gain 1 Campaign Point"
  },
  draw: {
    cp: 0,
    sp: 1,
    description: "Draw. Gain 1 Supply Point"
  },
  loss: {
    cp: 0,
    sp: 1,
    description: "Defeat. Gain 1 Supply Point (consolation)"
  },
  bye: {
    cp: 0,
    sp: 2,
    description: "Bye. Gain 2 Supply Points"
  }
};
```

- Battle result UI with rewards:
```
Select Battle Result:
┌─────────────────────────────────────┐
│ [Win]   Victory! → +1 CP            │
│ [Draw]  Draw     → +1 SP            │
│ [Loss]  Defeat   → +1 SP            │
│ [Bye]   No Game  → +2 SP            │
└─────────────────────────────────────┘
```

- Bye system:
  - Available when odd number of players
  - One player selects "Bye"
  - Automatically grants 2 SP
  - Treated as "draw" for Action Phase order
  - Cannot win/lose if took bye
  - Event log: "Red Player took a bye this round (+2 SP)"

- Extra game mechanism:
  - Scenario: 5 players, one would have bye
  - One player volunteers to play twice
  - Play first game → record result
  - Play second game → record result
  - Before Action Phase: "Choose which game counts for points"
  - Other game result is tracked but doesn't grant rewards
  - UI: "You played 2 games. Which result counts for points?"
    - Game 1: vs Blue (Win) → +1 CP
    - Game 2: vs Red (Loss) → +1 SP

- Extra game implementation:
```javascript
playerState = {
  ...playerState,
  battleResults: [
    { opponent: "Blue", result: "win", countsForPoints: false },
    { opponent: "Red", result: "loss", countsForPoints: false }
  ],
  mustChooseGameResult: true
};

function chooseBattleResult(player, gameIndex) {
  player.battleResults[gameIndex].countsForPoints = true;
  const result = player.battleResults[gameIndex].result;
  applyBattleReward(player, result);
  player.mustChooseGameResult = false;
}
```

- Missing player handling:
  - Option: "Opponent couldn't attend"
  - Confirmation dialog: "Record as loss for [opponent], win for you?"
  - Sporting rule reminder shown
  - Applied only if confirmed
  - Event log: "Blue Player absent, recorded as win for Red Player"

- UI flow for missing player:
  1. Battle Phase starts
  2. Button: "Record Missing Opponent"
  3. Select opponent from list
  4. Confirm dialog with explanation
  5. Record win for present player, loss for absent
  6. Apply rewards accordingly

- Reward validation:
  - SP cannot exceed 10 (enforce max)
  - If SP reward would exceed max, cap at 10
  - Show message: "SP capped at maximum (10)"
  - CP has no maximum

**Related Issues:**
- Related to Battle Phase Integration (#015)
- Related to Campaign Log (#009)
- Related to Action Phase Turn Order (#023)

## Labels

`enhancement`, `combat`, `phase-system`, `resources`, `ui`
