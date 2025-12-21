# Campaign Continuation and Legacy System

## Description

The rules state: "The next time you play a Ctesiphus Expedition, you can compare your performance with previous campaigns. You can even continue the narrative by using the same campaign map – leaving the explored hexes as they are – and selecting any surface hex (excluding blocked hexes) to become your new base hex. If you don't select the previous campaign's base hex, it becomes an Abandoned Camp location (SL22) instead, and you roll D36 on the relevant table to determine its condition. A new kill team then begins an expedition in the footsteps of the kill team that went before it, operating with increased knowledge of the area, but potentially less available from hexes the previous kill team interacted with."

**Current Implementation:**
- Campaign state exists ✅
- Map exploration tracking exists ✅
- Campaign continuation/legacy system NOT implemented

**What Needs to Be Implemented:**
- Option to continue previous campaign's map
- Keep explored hexes in same state
- Previous base becomes Abandoned Camp (SL22) location
- New base hex selection (any surface hex)
- Narrative continuity features
- Map state preservation between campaigns
- Legacy campaign display showing previous expedition

## Acceptance Criteria

- [ ] Option at campaign setup: "Start new map" vs "Continue previous expedition"
- [ ] Previous campaign's map loaded with explored hexes intact
- [ ] Old base hex converted to Abandoned Camp (SL22) with rolled condition
- [ ] Player selects new base hex (any surface hex except blocked)
- [ ] Narrative text shows continuity ("Following in footsteps of...")
- [ ] Map shows which hexes were explored by previous team
- [ ] Legacy campaign information accessible during play
- [ ] Unit tests validate map state preservation
- [ ] Integration tests verify legacy campaign flow

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Legacy campaign loading
- `src/components/GameSetup.jsx` - Legacy campaign option
- New component: `src/components/LegacyCampaignSetup.jsx`
- Browser localStorage or file save for map state

**Implementation Considerations:**

- Campaign setup legacy option:
```
New Solo Campaign
──────────────────────────────────
Map Selection:
○ Generate New Map
  Fresh start on unexplored Ctesiphus

● Continue Previous Expedition
  Build on Campaign #3's exploration
  (12 hexes already explored)

[Configure Legacy Campaign]
```

- Legacy campaign setup flow:
  1. Load previous campaign's final map state
  2. Convert old base hex to Abandoned Camp
  3. Roll D36 for Abandoned Camp condition
  4. Player selects new base hex
  5. Initialize new campaign with legacy map
  6. Display narrative connection

- Map state preservation:
```javascript
legacyMapState = {
  previousCampaignId: "campaign_003",
  previousKillTeam: "Blood Ravens Squad Titus",
  exploredHexes: [
    { id: 5, location: "Landing Site", condition: "Clear", exploredBy: "previous" },
    { id: 8, location: "Thermal Vent", condition: "Blizzard", exploredBy: "previous" },
    { id: 14, location: "Tomb Entrance", condition: "Awakening", exploredBy: "previous" },
    // ... 12 total
  ],
  previousBaseHex: 5,
  abandonedCampHex: 5,  // Converted from previous base
  abandonedCampCondition: "Ice Storm",  // Rolled D36

  // Track which hexes were already searched, etc.
  interactedHexes: {
    5: { searched: true, camped: true },
    8: { searched: true },
    14: { searched: false }
  }
};
```

- Abandoned Camp conversion:
```javascript
function convertOldBaseToAbandonedCamp(oldBaseHex, mapState) {
  const hex = mapState.hexes[oldBaseHex];

  // Change location to Abandoned Camp (SL22)
  hex.location = {
    id: "SL22",
    name: "Abandoned Camp",
    type: "surface",
    description: "Remnants of a previous expedition's camp",
    searchRule: { effect: "Gain D3 SP", type: "sp_gain", formula: "D3" },
    campRule: null  // Abandoned camps provide no benefit
  };

  // Roll for condition
  const conditionRoll = rollD36();
  hex.condition = getSurfaceCondition(conditionRoll);

  // Mark as explored
  hex.explored = true;
  hex.exploredBy = "previous";

  logEvent(`Old base converted to Abandoned Camp (${hex.condition})`);
}
```

- New base selection UI:
```
Legacy Campaign - Select New Base
──────────────────────────────────
Your new kill team arrives at Ctesiphus,
following in the footsteps of:
"Blood Ravens Squad Titus"

Previous Expedition Results:
• Campaign Points: 11 (Success)
• Hexes Explored: 12
• Threat: 10

Map Status:
✓ 12 hexes already explored
⚠ Old base (Hex 5) now Abandoned Camp

Select your new base hex:
(Any surface hex except blocked)

[Click map to select base]
```

- Narrative continuity:
```
Campaign Narrative
──────────────────────────────────
Following the expedition of Squad Titus,
your kill team has been dispatched to
continue exploration of Ctesiphus VII.

You arrive with intelligence from the
previous mission - 12 hexes have been
charted, though conditions may have
changed.

The old base at Hex 5 now stands
abandoned, a reminder of the previous
team's hasty withdrawal as threat
levels became critical...

[Begin Campaign]
```

- Visual indicators for legacy hexes:
  - Explored hexes show "Explored by previous expedition"
  - Different color tint for legacy explored vs newly explored
  - Abandoned Camp hex has special marker
  - Tooltip: "Previously explored by Squad Titus"

- Strategic implications:
  - **Advantage**: Start with knowledge of 12+ hexes
  - **Disadvantage**: May have been searched already
  - **Consideration**: Some locations may be "depleted"
  - **Narrative**: Continue the story

- Interacted hex tracking:
```javascript
// Track what previous campaign did to each hex
const hexInteractions = {
  5: {
    explored: true,
    searched: true,      // Search used up
    camped: true,        // Was a camp (now abandoned)
    battles: 2           // Battles fought here
  },
  8: {
    explored: true,
    searched: true,
    camped: false,
    battles: 1
  }
};

// Future: Could limit re-searching same hexes
// Or: Searched hexes provide reduced rewards
```

- Map legacy display:
```
[Hex 5: Abandoned Camp]
──────────────────────────────────
Previously: Landing Site
Previous base of Squad Titus

Condition: Ice Storm
Status: Explored by previous expedition
Searched: Yes (by previous team)

This hex was thoroughly explored.
Further searches may yield less.
```

- Multiple legacy campaigns:
  - Campaign 1 → Campaign 2 (legacy)
  - Campaign 2 → Campaign 3 (double legacy?)
  - Could track multiple abandoned camps
  - Narrative: "Third expedition to Ctesiphus"

**Related Issues:**
- Related to Solo Performance Categories (#037)
- Related to Campaign Setup (#001)
- Related to Hex Exploration (#006)
- Related to Save/Load functionality (future)
- Related to Narrative System (#003)

## Labels

`enhancement`, `gameplay`, `narrative`, `ui`
