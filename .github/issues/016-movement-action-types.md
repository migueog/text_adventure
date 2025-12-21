# Movement Action Types (Regroup, Manoeuvre, Hold)

## Description

The Movement Phase rules specify three distinct movement actions that players must choose from:
1. **REGROUP**: Move to nearest base/camp for free (no SP cost)
2. **MANOEUVRE**: Move up to 3 hexes, costs 1 SP per hex
3. **HOLD**: Stay in current hex

**Current Implementation:**
- Movement phase exists ✅
- MANOEUVRE is partially implemented (move up to 3 hexes with SP cost) ✅
- REGROUP is NOT implemented
- HOLD is implicit but not explicit option
- No UI to select between the three actions

**What Needs to Be Implemented:**
- Three distinct movement action buttons/options
- REGROUP action with nearest base/camp calculation
- Explicit HOLD action button
- Clear indication of which action is being taken
- Free movement for REGROUP (no SP cost)
- Visual preview of movement before confirming

## Acceptance Criteria

- [ ] Movement Phase UI shows three action options: Regroup, Manoeuvre, Hold
- [ ] REGROUP calculates and moves to nearest base/camp automatically
- [ ] REGROUP is free (no SP cost)
- [ ] REGROUP handles "next nearest" logic if already at nearest
- [ ] MANOEUVRE allows manual hex selection up to 3 hexes
- [ ] MANOEUVRE costs 1 SP per hex moved
- [ ] HOLD explicitly keeps kill team in current position
- [ ] Selected action is recorded in event log
- [ ] Unit tests validate each movement action type
- [ ] Integration tests verify action selection and execution

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add movement action types and REGROUP logic
- `src/components/PhaseTracker.jsx` - Add movement action selection UI
- `src/utils/hexUtils.js` - Add nearest base/camp calculation
- `src/components/PhaserHexMap/HexMapScene.js` - Visual feedback for movement types

**Implementation Considerations:**

- Movement action structure:
```javascript
const movementActions = {
  REGROUP: {
    name: "Regroup",
    description: "Move to nearest base/camp (free)",
    cost: 0,
    automatic: true
  },
  MANOEUVRE: {
    name: "Manoeuvre",
    description: "Move up to 3 hexes (1 SP per hex)",
    cost: "variable",
    automatic: false
  },
  HOLD: {
    name: "Hold",
    description: "Stay in current hex",
    cost: 0,
    automatic: true
  }
}
```

- REGROUP logic:
```javascript
function findNearestBaseOrCamp(currentHex, player) {
  // Get all player's bases and camps
  const destinations = [...player.bases, ...player.camps];

  // Calculate distance to each
  const distances = destinations.map(hex => ({
    hex,
    distance: calculateHexDistance(currentHex, hex)
  }));

  // If currently at nearest, find next nearest
  const current = distances.find(d => d.distance === 0);
  if (current) {
    distances = distances.filter(d => d.distance > 0);
  }

  // Sort by distance, return closest
  distances.sort((a, b) => a.distance - b.distance);
  return distances[0]?.hex || null;
}
```

- UI flow:
  1. Movement Phase starts
  2. Show three action buttons
  3. User selects action:
     - **REGROUP**: Auto-calculate and show destination, confirm button
     - **MANOEUVRE**: Enable hex selection on map, show SP cost preview
     - **HOLD**: Immediate confirmation
  4. Confirm and execute
  5. Log action in event log

- Visual feedback:
  - REGROUP: Draw path to nearest base/camp, highlight destination
  - MANOEUVRE: Show valid hexes within 3 distance, show SP cost on hover
  - HOLD: No movement, show "Holding position" indicator

- Edge cases:
  - REGROUP when no bases/camps exist: Disable button, show tooltip
  - REGROUP when already at all bases/camps: Can still select to "stay"
  - MANOEUVRE with 0 SP: Disable or show "Insufficient SP" warning
  - HOLD: Always available

**Related Issues:**
- Related to Movement Validation and Restrictions (#017)
- Related to Priority Establishment System (#008)
- Related to Auto-Exploration on Movement (#018)

## Labels

`enhancement`, `phase-system`, `actions`, `ui`
