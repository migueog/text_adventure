# Auto-Exploration on Movement

## Description

The Movement Phase rules state: "If it [kill team] finishes the move in an unexplored hex, explore it."

This means exploration should happen automatically when a kill team completes movement into an unexplored hex, rather than requiring a separate exploration action.

**Current Implementation:**
- Exploration exists but is typically manual/action-based
- D36 rolls for location and condition ✅
- Hex exploration state tracking exists ✅
- Automatic exploration on movement may not be implemented

**What Needs to Be Implemented:**
- Automatic exploration trigger when movement ends in unexplored hex
- Exploration animation/sequence during movement
- Clear indication that exploration is happening
- Exploration results displayed immediately after movement
- Option to review exploration before continuing
- Event log entry for auto-exploration

## Acceptance Criteria

- [ ] Moving into unexplored hex automatically triggers exploration
- [ ] Exploration happens after movement is confirmed
- [ ] D36 rolls executed automatically for location and condition
- [ ] Exploration results displayed in modal or panel
- [ ] Hex is marked as explored with location/condition recorded
- [ ] Event log shows "Explored Hex X: [Location], [Condition]"
- [ ] Player can review results before continuing to next phase
- [ ] Unit tests validate auto-exploration trigger
- [ ] Integration tests verify exploration during movement

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add auto-exploration trigger on movement
- `src/components/PhaseTracker.jsx` - Handle exploration flow during movement
- New component: `src/components/ExplorationResult.jsx` - Display exploration results
- `src/components/PhaserHexMap/HexMapScene.js` - Visual exploration animation

**Implementation Considerations:**

- Movement completion flow:
```javascript
function completeMovement(player, destinationHex) {
  // 1. Move kill team
  player.currentHex = destinationHex;
  player.sp -= movementCost;

  // 2. Check if hex is unexplored
  const hex = gameState.hexes[destinationHex];
  if (!hex.explored) {
    // 3. Trigger automatic exploration
    const explorationResult = exploreHex(destinationHex);

    // 4. Display results
    showExplorationModal(explorationResult);

    // 5. Mark hex as explored
    hex.explored = true;
    hex.location = explorationResult.location;
    hex.condition = explorationResult.condition;
  }

  // 6. Log movement and exploration
  logEvent(`${player.name} moved to Hex ${destinationHex}`);
  if (hex.explored) {
    logEvent(`Explored: ${hex.location}, ${hex.condition}`);
  }
}
```

- Exploration modal/panel:
  - Title: "Hex Explored!"
  - Hex number displayed
  - D36 roll animation (optional)
  - Location revealed with description
  - Condition revealed with effect description
  - "Continue" button to close and proceed
  - Auto-close after 5 seconds (optional)

- Visual sequence:
  1. Kill team moves to hex (animated movement)
  2. Hex pulses or glows (exploration trigger)
  3. Dice roll animation (D36 x2)
  4. Location and condition text appear
  5. Hex updates with new information
  6. Modal shows full details

- Exploration during REGROUP:
  - REGROUP can also trigger exploration
  - If destination base/camp is in unexplored hex (edge case)
  - Same auto-exploration behavior

- Multiple explorations:
  - If player moves 3 hexes through multiple unexplored hexes
  - Only final destination hex is explored (per rules: "finishes the move")
  - Passing through unexplored hex doesn't trigger exploration

- Exploration result display:
```javascript
{
  hexId: "14",
  hexNumber: 14,
  location: {
    name: "Thermal Vent",
    description: "A heat source that can provide energy...",
    effects: ["Resupply +1 SP"]
  },
  condition: {
    name: "Blizzard",
    description: "Heavy snow reduces visibility...",
    effects: ["Movement +1 SP per hex"]
  },
  rollResults: {
    locationRoll: 23,
    conditionRoll: 15
  }
}
```

- Event log entries:
  - "Red Player moved to Hex 14 (3 hexes, -3 SP)"
  - "Explored Hex 14: Thermal Vent (Blizzard)"

**Related Issues:**
- Related to Movement Action Types (#016)
- Related to Hex Types and Exploration (#006)
- Related to Exploration mechanics (may need dedicated issue for Scout action)
- Related to Event Log enhancements

## Labels

`enhancement`, `phase-system`, `hex-map`, `ui`
