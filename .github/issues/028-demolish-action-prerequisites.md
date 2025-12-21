# Demolish Action with Prerequisites

## Description

The Demolish action rules: "Cost: 3 SP. Effect: Remove an opponent's camp in the hex your kill team is in. You cannot perform this action unless you won a game against that opponent during this campaign round. However, if you challenged them to a game and it didn't happen (e.g. they refused or couldn't play), then you can perform this action."

**Current Implementation:**
- Demolish action exists ✅
- May not enforce battle prerequisite
- Refused/missing opponent exception may not be implemented

**What Needs to Be Enhanced:**
- Strict prerequisite: must have won against camp owner this round
- Exception: can demolish if challenged but game didn't happen
- Multiple camps: choose which to demolish
- Visual confirmation before demolishing
- Track battle history for prerequisite validation
- Clear messaging when action is unavailable

## Acceptance Criteria

- [ ] Demolish costs exactly 3 SP
- [ ] Can only demolish if won against camp owner this round
- [ ] Alternative: Can demolish if challenged but game didn't happen
- [ ] If multiple opponent camps in hex, choose which to demolish
- [ ] Confirmation dialog before demolishing
- [ ] Camp is removed from hex after action
- [ ] UI clearly shows prerequisites
- [ ] Cannot demolish if prerequisites not met
- [ ] Unit tests validate prerequisite logic
- [ ] Integration tests verify demolish action flow

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Enhanced demolish logic with prerequisite checking
- `src/components/PhaseTracker.jsx` - Demolish UI with validation
- New component: `src/components/DemolishConfirmation.jsx`

**Implementation Considerations:**

- Prerequisite validation:
```javascript
function canDemolish(player, currentHex, gameState) {
  const hex = gameState.hexes[currentHex];

  // Must have 3+ SP
  if (player.sp < 3) {
    return {
      valid: false,
      reason: "Insufficient SP (need 3)"
    };
  }

  // Find opponent camps in current hex
  const opponentCampsHere = [];
  for (const opponent of gameState.players) {
    if (opponent.id === player.id) continue;

    if (opponent.camps.includes(currentHex)) {
      opponentCampsHere.push({
        owner: opponent,
        hex: currentHex
      });
    }
  }

  if (opponentCampsHere.length === 0) {
    return {
      valid: false,
      reason: "No opponent camps in this hex"
    };
  }

  // Check battle prerequisites
  const validTargets = opponentCampsHere.filter(camp => {
    const battleHistory = player.battleHistory[gameState.currentRound];

    // Check if won against camp owner
    const wonAgainst = battleHistory?.some(
      battle => battle.opponent === camp.owner.id && battle.result === 'win'
    );

    // Check if challenged but didn't play
    const challengedButNoGame = battleHistory?.some(
      battle => battle.opponent === camp.owner.id && battle.status === 'refused'
    );

    return wonAgainst || challengedButNoGame;
  });

  if (validTargets.length === 0) {
    return {
      valid: false,
      reason: "Must win against camp owner to demolish"
    };
  }

  return {
    valid: true,
    targets: validTargets
  };
}
```

- Demolish UI:
```
Demolish Action (3 SP)
Current Location: Hex 14

Opponent Camps Here:
┌─────────────────────────────────┐
│ Blue Player's Camp              │
│ ✓ You won against Blue this     │
│   round - can demolish!         │
│                                  │
│ [Demolish Blue's Camp] (3 SP)   │
└─────────────────────────────────┘
```

- Unavailable state:
```
Demolish Action (3 SP)
Current Location: Hex 14

Opponent Camps Here:
┌─────────────────────────────────┐
│ Red Player's Camp               │
│ ✗ You did not win against Red   │
│   this round - cannot demolish  │
│                                  │
│ [Demolish] (Disabled)           │
└─────────────────────────────────┘
```

- Confirmation dialog:
```
Demolish Camp?
─────────────────────────────────
Remove Blue Player's camp at Hex 14?

This costs 3 SP.
This cannot be undone.

[Confirm Demolish] [Cancel]
```

- Multiple camps scenario:
  - If 2 opponent camps in same hex
  - List both with prerequisite status
  - Player chooses which to demolish
  - Only pay 3 SP once (demolish one camp)

- Refused/missing game tracking:
```javascript
// During battle phase, option to mark game as refused
player.battleHistory[round].push({
  opponent: opponentId,
  result: null,
  status: 'refused',  // or 'missing'
  reason: "Opponent declined challenge"
});

// This allows demolish without winning
```

- Refused game UI:
  - Battle Phase: Option to mark opponent as refused
  - "Challenge declined" button
  - Records challenge for demolish eligibility
  - Event log: "Red Player challenged Blue Player (declined)"

- Strategic implications:
  - Demolish disrupts opponent's resupply
  - Increases future Encamp costs for opponent
  - Powerful but requires winning battle
  - Costs 3 SP (significant investment)
  - Risk: opponent may retaliate

- Event log:
  - "Red Player demolished Blue Player's camp at Hex 14"
  - "Blue Player lost camp (Hex 14)"

- Edge cases:
  - Player wins against opponent, but opponent has no camps: Demolish unavailable
  - Multiple wins against same opponent: Can still only demolish once per round (one action)
  - Camp owner wins back: Can't demolish (didn't win against them)

**Related Issues:**
- Related to Encamp Action (#027)
- Related to Battle Phase Integration (#015)
- Related to Battle History tracking
- Related to Action Phase Turn Order (#023)

## Labels

`enhancement`, `actions`, `phase-system`, `combat`
