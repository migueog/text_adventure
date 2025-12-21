# Scout Action Implementation

## Description

The Scout action rules: "Cost: 1-3 SP. Effect: Select one unexplored hex (excluding blocked hexes) within a number of hexes of your kill team equal to the number of Supply points spent. Explore that hex."

**Current Implementation:**
- Scout action exists ✅
- Basic exploration logic exists ✅
- Variable SP cost may not be implemented
- Range validation may not match rules

**What Needs to Be Enhanced:**
- Variable SP cost (1-3 SP) selection
- Range = SP spent (1 SP = 1 hex range, 2 SP = 2 hex range, 3 SP = 3 hex range)
- Cannot scout blocked hexes
- Must be unexplored hex
- Visual range indicator based on selected SP
- Clear cost/benefit display

## Acceptance Criteria

- [ ] Scout action allows choosing 1, 2, or 3 SP to spend
- [ ] Range equals SP spent (1-3 hexes)
- [ ] Only unexplored, non-blocked hexes can be selected
- [ ] Visual indicator shows valid scout range
- [ ] Selected hex is explored (D36 rolls)
- [ ] SP cost deducted after confirmation
- [ ] Cannot scout if insufficient SP
- [ ] Unit tests validate range and cost logic
- [ ] Integration tests verify scout action flow

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Enhanced scout action logic
- `src/components/PhaseTracker.jsx` - Scout UI with SP selection
- `src/components/PhaserHexMap/HexMapScene.js` - Visual range indicator

**Implementation Considerations:**

- Scout UI flow:
  1. Player clicks "Scout" action
  2. UI: "Choose SP to spend: [1] [2] [3]"
  3. Player selects SP amount
  4. Map highlights valid hexes within range
  5. Player clicks hex to scout
  6. Exploration executes (D36 rolls)
  7. Results displayed
  8. SP deducted

- SP selection interface:
```
Scout Action
Choose Supply Points to spend:
┌───┬───┬───┐
│ 1 │ 2 │ 3 │  ← SP buttons
└───┴───┴───┘
Range: X hexes
Cost: X SP (you have Y SP)
```

- Range validation:
```javascript
function getScoutableHexes(currentHex, spToSpend, gameState) {
  const range = spToSpend; // 1, 2, or 3
  const hexesInRange = getHexesWithinDistance(currentHex, range);

  return hexesInRange.filter(hex => {
    const hexData = gameState.hexes[hex];
    return !hexData.explored && hexData.type !== 'blocked';
  });
}
```

- Visual feedback:
  - Highlight scoutable hexes in blue
  - Show range circle/outline
  - Grayed out: explored hexes
  - Red X: blocked hexes
  - Distance indicator on each valid hex

- Cost validation:
  - 1 SP option: Always available if player has 1+ SP
  - 2 SP option: Available if player has 2+ SP
  - 3 SP option: Available if player has 3+ SP
  - Disable buttons for unaffordable options

- Strategic considerations:
  - Scout 1 SP: Cheapest, shortest range (adjacent hexes)
  - Scout 2 SP: Medium cost, good range
  - Scout 3 SP: Expensive, maximum range
  - Players balance cost vs information gain

- Exploration result:
  - Same as movement exploration (D36 for location/condition)
  - Display in modal/panel
  - Hex marked as explored
  - Location and condition recorded

- Edge cases:
  - No unexplored hexes in range: Disable scout
  - All nearby hexes explored: Must spend more SP for farther hexes
  - Scout from blocked hex: Still works (just can't scout TO blocked)

**Related Issues:**
- Related to Auto-Exploration on Movement (#018)
- Related to Hex Types and Exploration (#006)
- Related to Action Phase Turn Order (#023)

## Labels

`enhancement`, `actions`, `phase-system`, `hex-map`
