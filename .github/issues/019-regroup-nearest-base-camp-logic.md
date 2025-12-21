# Regroup: Nearest Base/Camp Logic

## Description

The REGROUP movement action rules state: "Move your kill team to your nearest base or camp. If it's already in one, move it to the next nearest, if any (if two or more are equally close, you can choose which one). Note that this doesn't cost Supply points."

**Current Implementation:**
- REGROUP action does NOT exist
- Base and camp tracking exists ✅
- Distance calculation exists ✅

**What Needs to Be Implemented:**
- Calculate nearest base or camp from current position
- Handle "already at nearest" scenario (move to next nearest)
- Handle ties (multiple equally close destinations)
- Free movement (no SP cost)
- Clear UI showing destination before confirming
- Path visualization for REGROUP movement

## Acceptance Criteria

- [ ] REGROUP calculates nearest base/camp correctly
- [ ] If already at nearest, calculates next nearest
- [ ] If multiple destinations are equidistant, player can choose
- [ ] REGROUP is completely free (0 SP cost)
- [ ] UI shows destination and path before confirmation
- [ ] Movement is automatic after confirmation
- [ ] Edge case: No bases/camps available - REGROUP disabled
- [ ] Unit tests validate nearest calculation logic
- [ ] Integration tests verify REGROUP movement flow

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add REGROUP logic
- `src/utils/hexUtils.js` - Add nearest base/camp calculation
- `src/components/PhaseTracker.jsx` - REGROUP UI and confirmation
- `src/components/PhaserHexMap/HexMapScene.js` - Visualize REGROUP path

**Implementation Considerations:**

- Nearest base/camp calculation:
```javascript
function findRegroupDestinations(player, currentHex, gameState) {
  // Get all player's bases and camps
  const destinations = [];

  // Add bases
  for (const base of player.bases) {
    destinations.push({
      hex: base,
      type: 'base',
      distance: calculateHexDistance(currentHex, base)
    });
  }

  // Add camps
  for (const camp of player.camps) {
    destinations.push({
      hex: camp,
      type: 'camp',
      distance: calculateHexDistance(currentHex, camp)
    });
  }

  // If no destinations, return null
  if (destinations.length === 0) return null;

  // Sort by distance
  destinations.sort((a, b) => a.distance - b.distance);

  // If at nearest (distance 0), remove it and get next
  if (destinations[0].distance === 0) {
    destinations.shift();
    if (destinations.length === 0) return null;
  }

  // Get all destinations at minimum distance
  const minDistance = destinations[0].distance;
  const nearestDestinations = destinations.filter(d => d.distance === minDistance);

  return {
    destinations: nearestDestinations,
    distance: minDistance,
    requiresChoice: nearestDestinations.length > 1
  };
}
```

- REGROUP UI flow:
  1. Player clicks "Regroup" button
  2. System calculates destinations
  3. If no destinations: Show "No bases or camps available"
  4. If one destination: Show "Regroup to [Base/Camp] at Hex X (Y hexes away)"
  5. If multiple tied: Show selection UI "Choose destination:"
  6. Show path visualization on map
  7. Confirm button executes movement
  8. No SP deducted

- Multiple destination selection:
  - Modal or dropdown: "Choose Regroup Destination"
  - List each option: "Base at Hex 5 (4 hexes)" "Camp at Hex 12 (4 hexes)"
  - Highlight each on map when hovering option
  - Confirm selection

- Visual feedback:
  - Draw path from current hex to destination
  - Different color for REGROUP path (e.g., green vs blue for manoeuvre)
  - Show "FREE" or "0 SP" badge
  - Pulse destination hex

- Edge cases:
  - **No bases/camps**: Disable REGROUP, show tooltip "Build a camp first"
  - **Already at all bases/camps**: Disable REGROUP, show "Already at all bases/camps"
  - **Blocked path**: Still allowed (REGROUP finds shortest path, may go around)
  - **Camp destroyed during planning**: Recalculate before execution

- Path respects movement restrictions:
  - Cannot move through blocked hexes (use pathfinding)
  - Distance is actual path distance, not straight line
  - If no valid path exists, REGROUP to that location is invalid

- Event log:
  - "Red Player regrouped to Base at Hex 5 (3 hexes, FREE)"
  - "Blue Player regrouped to Camp at Hex 14 (1 hex, FREE)"

**Related Issues:**
- Related to Movement Action Types (#016)
- Related to Movement Validation (#017)
- Related to Camp system (Action Phase)
- Related to Base Hex Placement (#007)

## Labels

`enhancement`, `phase-system`, `actions`, `gameplay`
