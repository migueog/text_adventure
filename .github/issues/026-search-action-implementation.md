# Search Action Implementation

## Description

The Search action rules: "Cost: 1 SP. Effect: Resolve the search rule (if any) of the hex your kill team is in."

Each location type has a search rule that provides benefits when the Search action is performed.

**Current Implementation:**
- Search action exists ✅
- May not have complete search rules for all locations
- Search effects may not be implemented

**What Needs to Be Implemented:**
- Complete search rules for all location types (18 surface + 18 tomb)
- Search effect resolution (SP gain, CP gain, special effects)
- Clear display of search rule before action
- Search result display after execution
- Prevent search if hex has no search rule
- Track hexes that have been searched (if search is one-time use)

## Acceptance Criteria

- [ ] Search costs exactly 1 SP
- [ ] Cannot search if player has < 1 SP
- [ ] Search rule from current hex location is resolved
- [ ] UI shows search rule before performing action
- [ ] Search effects are applied (SP, CP, special bonuses)
- [ ] If no search rule, action is disabled or shows "No search available"
- [ ] Search results displayed clearly
- [ ] Event log records search action and results
- [ ] Unit tests validate search rule resolution
- [ ] Integration tests verify search action flow

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Search action logic
- `src/data/campaignData.js` - Add complete search rules for all locations
- `src/components/PhaseTracker.jsx` - Search UI
- New component: `src/components/SearchDisplay.jsx`

**Implementation Considerations:**

- Search rule structure in location data:
```javascript
{
  name: "Supply Cache",
  description: "Emergency supplies left by previous expedition",
  searchRule: {
    effect: "Gain D3 SP",
    type: "sp_gain",
    formula: "D3"
  }
},
{
  name: "Thermal Vent",
  description: "Geothermal heat source",
  searchRule: {
    effect: "Gain 1 CP",
    type: "cp_gain",
    amount: 1
  }
},
{
  name: "Ancient Archive",
  description: "Necron data repository",
  searchRule: {
    effect: "Gain 2 CP if you win next battle",
    type: "conditional_bonus",
    trigger: "next_battle_win",
    reward: { cp: 2 }
  }
}
```

- Search availability check:
```javascript
function canSearch(player, currentHex, gameState) {
  // Must have 1+ SP
  if (player.sp < 1) {
    return { canSearch: false, reason: "Insufficient SP (need 1)" };
  }

  // Must be in explored hex
  const hex = gameState.hexes[currentHex];
  if (!hex.explored) {
    return { canSearch: false, reason: "Hex must be explored first" };
  }

  // Must have search rule
  const location = hex.location;
  if (!location.searchRule) {
    return { canSearch: false, reason: "No search rule at this location" };
  }

  return { canSearch: true, searchRule: location.searchRule };
}
```

- Search UI:
```
Search Action (1 SP)
Current Location: Supply Cache

Search Rule:
"Gain D3 Supply Points"

You have: 5 SP
After search: 4 SP (+ D3)

[Perform Search]
```

- Search execution:
```javascript
function performSearch(player, currentHex, gameState) {
  // Deduct cost
  player.sp -= 1;

  // Get search rule
  const hex = gameState.hexes[currentHex];
  const searchRule = hex.location.searchRule;

  // Resolve effect
  let result;
  switch (searchRule.type) {
    case 'sp_gain':
      const spGained = rollDice(searchRule.formula);
      player.sp = Math.min(10, player.sp + spGained);
      result = `Gained ${spGained} SP`;
      break;

    case 'cp_gain':
      player.cp += searchRule.amount;
      result = `Gained ${searchRule.amount} CP`;
      break;

    case 'conditional_bonus':
      player.pendingBonuses.push(searchRule);
      result = `Bonus: ${searchRule.effect}`;
      break;

    case 'special':
      result = resolveSpecialEffect(searchRule, player, gameState);
      break;
  }

  return result;
}
```

- Search result display:
```
Search Result:
Rolled D3: 2
Gained 2 SP

Supply Points: 4 → 6

[Continue]
```

- Example search rules (need all 36 locations):
  - **Supply Cache**: Gain D3 SP
  - **Equipment Depot**: Gain D3+1 SP
  - **Observation Post**: Gain 1 CP
  - **Ancient Archive**: Gain 2 CP if win next battle
  - **Stasis Chamber**: Revive operative (special)
  - **Power Conduit**: Reduce next Encamp cost by 2
  - Many locations may have no search rule (null)

- Locations without search rules:
  - Show: "This location has no search rule"
  - Disable search action
  - Or show: "Nothing to search here"

- One-time vs repeatable searches:
  - Rules don't specify if search is one-time
  - Assume repeatable (can search same hex multiple times)
  - Could add `searchedThisRound` flag if needed

- Event log:
  - "Red Player searched Supply Cache (Hex 14)"
  - "Search result: Gained 2 SP"

**Related Issues:**
- Related to Action Phase Turn Order (#023)
- Related to Campaign Data completeness
- Related to Hex exploration system (#006)

## Labels

`enhancement`, `actions`, `phase-system`, `data`
