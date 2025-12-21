# Encamp Action and Camp Management

## Description

The Encamp action rules: "Cost: The number of hexes to your nearest base or camp (excluding blocked hexes). Effect: Gain a camp in the hex your kill team is in. While you have a camp in a hex, you gain its camp rule (if any). You cannot have more than two camps at once, but you can remove one of your camps whenever you perform this action (after determining the Supply points cost). You cannot perform this action if the hex is blocked or contains an opponent's base or camp."

**Current Implementation:**
- Encamp action exists ✅
- Camp placement logic exists ✅
- Camp limit (max 2) may not be enforced
- Dynamic cost calculation may not match rules
- Camp removal option may not be implemented
- Camp rules (benefits) may not be implemented

**What Needs to Be Implemented:**
- Dynamic cost = distance to nearest base/camp
- Strict 2-camp maximum enforcement
- Camp removal option when at limit
- Validation: cannot encamp in blocked hex or opponent's base/camp
- Camp rule benefits for each location type
- Clear display of camp cost before action
- Visual camp markers on map

## Acceptance Criteria

- [ ] Encamp cost equals distance to nearest base or camp
- [ ] Cannot encamp if > 2 camps already exist
- [ ] If at 2 camps, option to remove one before camping
- [ ] Cannot encamp in blocked hex
- [ ] Cannot encamp in opponent's base or camp hex
- [ ] Camp marker placed on hex after action
- [ ] Camp rules (benefits) are activated
- [ ] UI shows cost calculation and restrictions
- [ ] Unit tests validate cost and restrictions
- [ ] Integration tests verify camp management flow

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Enhanced encamp logic
- `src/data/campaignData.js` - Add camp rules for all locations
- `src/components/PhaseTracker.jsx` - Encamp UI with camp management
- `src/components/PhaserHexMap/HexMapScene.js` - Camp markers
- New component: `src/components/CampManager.jsx`

**Implementation Considerations:**

- Encamp cost calculation:
```javascript
function calculateEncampCost(player, currentHex, gameState) {
  const destinations = [
    ...player.bases,
    ...player.camps
  ];

  if (destinations.length === 0) {
    // No bases or camps - cannot calculate distance
    // This shouldn't happen (player always has base)
    return Infinity;
  }

  // Find nearest (excluding blocked hexes in path)
  const distances = destinations.map(dest =>
    calculateHexDistance(currentHex, dest)
  );

  return Math.min(...distances);
}
```

- Encamp validation:
```javascript
function canEncamp(player, currentHex, gameState) {
  const hex = gameState.hexes[currentHex];

  // Cannot encamp in blocked hex
  if (hex.type === 'blocked') {
    return { valid: false, reason: "Cannot camp in blocked hex" };
  }

  // Cannot encamp in opponent's base or camp
  for (const opponent of gameState.players) {
    if (opponent.id === player.id) continue;

    if (opponent.bases.includes(currentHex)) {
      return { valid: false, reason: "Opponent's base here" };
    }
    if (opponent.camps.includes(currentHex)) {
      return { valid: false, reason: "Opponent's camp here" };
    }
  }

  // Calculate cost
  const cost = calculateEncampCost(player, currentHex, gameState);

  // Must have enough SP
  if (player.sp < cost) {
    return { valid: false, reason: `Insufficient SP (need ${cost}, have ${player.sp})` };
  }

  return { valid: true, cost };
}
```

- Camp limit management UI:
```
Encamp Action
Current Location: Hex 14 (Thermal Vent)

Cost: 3 SP (3 hexes to nearest camp)
You have: 7 SP

Your Camps (2/2 MAX):
┌─────────────────────────────┐
│ [X] Camp 1: Hex 8 (Landing) │
│ [X] Camp 2: Hex 12 (Vent)   │
└─────────────────────────────┘

You must remove a camp to build another.
Select a camp to remove:

[Build Camp] (after removing one)
```

- Camp removal flow:
  1. Player has 2 camps
  2. Clicks "Encamp"
  3. UI shows: "You have 2 camps (maximum). Remove one?"
  4. Shows list of camps with locations
  5. Player selects camp to remove
  6. Cost is calculated AFTER removal
  7. New camp built
  8. Event log: "Removed camp at Hex 8, built camp at Hex 14"

- Camp rules structure:
```javascript
{
  name: "Thermal Vent",
  campRule: {
    effect: "While camped here, gain +1 SP from Resupply actions",
    type: "resupply_bonus",
    bonus: 1
  }
},
{
  name: "Observation Post",
  campRule: {
    effect: "Scout actions from here cost -1 SP (minimum 1)",
    type: "action_cost_reduction",
    action: "scout",
    reduction: 1
  }
},
{
  name: "Landing Site",
  campRule: {
    effect: "Camping here is always free (0 SP)",
    type: "free_camp",
    // Special: Encamp cost is 0 regardless of distance
  }
}
```

- Camp rule activation:
  - Camp rules are passive benefits
  - Active while player has camp in that hex
  - Don't need to be at camp to get benefit (rules vary)
  - Some rules apply "while here", others are always active

- Visual camp markers:
  - Camp symbol: ⛺ (tent emoji)
  - Colored by player (red player = red tent)
  - Smaller than base symbol
  - Hex background slightly different to show camp

- Strategic value of camps:
  - Resupply point (D3+3 SP)
  - Reduces Encamp cost for future camps
  - Location-specific camp rules
  - Can be destroyed by opponents (Demolish action)

- Event log:
  - "Red Player built camp at Hex 14 (3 SP)"
  - "Camp removed at Hex 8"

**Related Issues:**
- Related to Encamp cost calculation
- Related to Demolish Action (#028)
- Related to Resupply Action (#025)
- Related to Regroup movement (#019)

## Labels

`enhancement`, `actions`, `phase-system`, `hex-map`, `resources`
