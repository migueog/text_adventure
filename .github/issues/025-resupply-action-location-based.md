# Resupply Action with Location-Based Rewards

## Description

The Resupply action rules: "Cost: 0 SP. Effect: Gain a number of Supply points depending on the hex your kill team is in (until you reach 10) as follows:
• Your base: 10
• One of your camps: D3+3
• Blocked hex: 0
• Any other hex: 1"

**Current Implementation:**
- Resupply action exists ✅
- Basic SP gain logic exists ✅
- Location-based rewards may not match official rules exactly
- D3+3 roll for camps may not be implemented

**What Needs to Be Enhanced:**
- Exact reward values per location type
- D3 dice roll for camps (3+3 to 9+3 = 6-9 SP)
- SP cap at 10 enforcement
- Clear display of resupply amount before/after
- Dice roll visualization for camps
- Strategic guidance on when to resupply

## Acceptance Criteria

- [ ] Resupply at base grants 10 SP (fills to max)
- [ ] Resupply at own camp rolls D3+3 (shows result)
- [ ] Resupply at blocked hex grants 0 SP
- [ ] Resupply at any other hex grants 1 SP
- [ ] SP cannot exceed 10 (capped)
- [ ] UI shows expected/actual resupply amount
- [ ] Dice roll displayed for camp resupply
- [ ] Action is free (0 SP cost)
- [ ] Unit tests validate location-based rewards
- [ ] Integration tests verify resupply mechanics

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Enhanced resupply logic
- `src/components/PhaseTracker.jsx` - Resupply UI
- `src/utils/dice.js` - D3 roll for camps
- New component: `src/components/ResupplyDisplay.jsx`

**Implementation Considerations:**

- Resupply calculation:
```javascript
function calculateResupply(player, currentHex, gameState) {
  const hex = gameState.hexes[currentHex];

  // Check location type
  if (player.bases.includes(currentHex)) {
    return { amount: 10, type: 'base', guaranteed: true };
  }

  if (player.camps.includes(currentHex)) {
    const roll = rollDice('D3'); // 1, 2, or 3
    const amount = roll + 3;      // 4, 5, or 6
    return { amount, type: 'camp', roll, guaranteed: false };
  }

  if (hex.type === 'blocked') {
    return { amount: 0, type: 'blocked', guaranteed: true };
  }

  // Any other hex
  return { amount: 1, type: 'other', guaranteed: true };
}
```

- Resupply UI display:
```
Resupply Action (FREE)
Current Location: Hex 14 (Your Camp)

Expected Gain: D3+3 SP (4-6 SP)
Current SP: 3
Maximum SP: 10

[Roll for Resupply]
```

- After roll (camp example):
```
Resupply Result:
Rolled D3: 2
Gain: 2+3 = 5 SP

3 SP → 8 SP ✓

[Confirm]
```

- Location-based messaging:
```javascript
const resupplyMessages = {
  base: {
    preview: "Resupply at Base: +10 SP (fills to maximum)",
    result: "Base resupply: +10 SP"
  },
  camp: {
    preview: "Resupply at Camp: Roll D3+3 SP (4-6 SP)",
    result: "Camp resupply: Rolled {roll}, gained {total} SP"
  },
  blocked: {
    preview: "Blocked hex: No resupply available (0 SP)",
    result: "Cannot resupply in blocked hex"
  },
  other: {
    preview: "Field resupply: +1 SP",
    result: "Field resupply: +1 SP"
  }
};
```

- SP cap enforcement:
  - Calculate amount player would gain
  - Check if current SP + gain > 10
  - If so, cap at 10
  - Show message: "SP capped at maximum (10)"
  - Example: Player has 7 SP, base resupply would give 10 → actually gain 3 to reach 10

- Dice roll for camps:
  - Show D3 die animation (1-3)
  - Display: "D3 roll: 2"
  - Calculate: 2 + 3 = 5
  - Show: "You gain 5 SP"

- Strategic guidance:
  - Base: Best option (full refill) but must be at base
  - Camp: Good option (4-6 SP) and more flexible
  - Other: Minimal (1 SP) but available anywhere
  - Blocked: Useless, don't resupply here

- When to resupply:
  - Low SP (< 3): Consider resupply to enable actions
  - At base: Always good to top up
  - At camp: Good value (D3+3)
  - Elsewhere: Only if desperate

- Edge cases:
  - Already at 10 SP: Resupply does nothing, may want to prevent action
  - Show message: "Already at maximum SP (10)"
  - Or allow but show "No SP gained (already at max)"

**Related Issues:**
- Related to Campaign Log (#009)
- Related to Action Phase Turn Order (#023)
- Related to Encamp Action (#027) - camps enable better resupply

## Labels

`enhancement`, `actions`, `phase-system`, `resources`
