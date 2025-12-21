# Battle Phase Condition Rules and Killzone Integration

## Description

The Battle Phase rules specify how to determine which hex condition applies to the Kill Team game:
- If both players in same hex: use that hex's condition
- Otherwise: use condition from hex of player without initiative (or last in player order for Multiplayer Ops)
- Tomb hex conditions → recommend close quarters killzone (e.g., Killzone: Tomb World)
- Surface hex conditions → recommend any other killzone (e.g., Killzone: Volkus)
- Playing against non-campaign players: condition rules optional

**Current Implementation:**
- Hex conditions exist in data ✅
- Battle phase exists ✅
- No system for determining which condition applies
- No killzone recommendations based on hex type
- No integration guidance for actual Kill Team gameplay

**What Needs to Be Implemented:**
- Automatic determination of which condition applies
- Display the active condition clearly during Battle Phase
- Killzone recommendations based on hex type (Surface vs Tomb)
- Condition rule display for reference during battle
- Option to override condition for non-campaign battles
- Export/print condition rules for use during actual game

## Acceptance Criteria

- [ ] System automatically determines which hex condition applies
- [ ] If both players in same hex, that hex's condition is used
- [ ] If in different hexes, use condition from player without initiative
- [ ] Battle Phase UI prominently displays active condition
- [ ] Condition rules and effects are shown for reference
- [ ] Killzone recommendation displayed (Tomb World vs other)
- [ ] Option to disable condition rules for non-campaign battles
- [ ] Condition can be exported/printed for tabletop reference
- [ ] Unit tests validate condition selection logic
- [ ] Integration tests verify condition display during Battle Phase

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add condition determination logic
- `src/components/PhaseTracker.jsx` - Display active condition in Battle Phase
- New component: `src/components/BattleConditionDisplay.jsx` - Show condition rules
- `src/data/campaignData.js` - Ensure all condition rules are complete

**Implementation Considerations:**

- Condition determination logic:
```javascript
function determineActiveCondition(player1, player2, gameState) {
  const p1Hex = gameState.hexes[player1.currentHex];
  const p2Hex = gameState.hexes[player2.currentHex];

  // Both in same hex
  if (player1.currentHex === player2.currentHex) {
    return {
      condition: p1Hex.condition,
      hex: player1.currentHex,
      reason: "Both players in same hex"
    };
  }

  // Different hexes - use condition from player without initiative
  // For campaign, use player order as proxy for initiative
  const playerWithoutInitiative = determinePlayerWithoutInitiative(player1, player2);
  const relevantHex = gameState.hexes[playerWithoutInitiative.currentHex];

  return {
    condition: relevantHex.condition,
    hex: playerWithoutInitiative.currentHex,
    hexType: relevantHex.type, // surface or tomb
    reason: `${playerWithoutInitiative.name}'s hex (without initiative)`
  };
}
```

- Condition display UI:
  - **Prominent banner**: "Battle Condition: Blizzard"
  - **Hex info**: "From Hex 14 (Surface)"
  - **Effect description**: Full text of condition effects
  - **Killzone recommendation**: "Recommended: Any killzone (Surface hex)"

- Killzone recommendations:
```javascript
const killzoneRecommendations = {
  tomb: {
    name: "Close Quarters Killzone",
    examples: ["Killzone: Tomb World", "Gallowdark"],
    reason: "Tomb conditions suit close combat environments"
  },
  surface: {
    name: "Any Killzone",
    examples: ["Killzone: Volkus", "Killzone: Bheta-Decima", "Chalnath"],
    reason: "Surface conditions work with open battlefields"
  }
};
```

- Condition display sections:
  1. **Condition Name**: Large, prominent
  2. **Source**: Which hex and why
  3. **Effects**: Bulleted list of game impacts
  4. **Killzone**: Recommendation with examples
  5. **Export button**: Print/copy condition rules

- Non-campaign battle option:
  - Checkbox: "Apply hex condition rules"
  - Enabled by default for campaign battles
  - Can be disabled for casual/non-campaign games
  - Still records results normally

- Export/print format:
```
Kill Team Battle - Hex 14
========================
Condition: Blizzard
Type: Surface Hex
Killzone: Any killzone (Volkus, Chalnath, etc.)

Effects:
• Movement +1 AP per operative
• Visibility reduced - no LOF beyond 6"
• Wind: Add 1 to Ballistic tests

Reference: Campaign Map Hex 14
```

- Initiative determination:
  - For now, use priority order (CP/SP/roll-off)
  - Player with priority = has initiative
  - Other player's hex condition applies
  - Future: Could integrate with actual Kill Team initiative roll

**Related Issues:**
- Related to Battle Phase Integration (#015)
- Related to Hex Types and Exploration (#006)
- Related to Non-Campaign Opponent Mode (#005)

## Labels

`enhancement`, `combat`, `phase-system`, `data`, `ui`
