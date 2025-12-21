# Hex Types and Exploration Mechanics

## Description

The campaign rules define three hex types (Surface, Tomb, Blocked) with specific exploration and recording mechanics. When a hex is explored, it must record: (1) Location, (2) Condition, and (3) Hex number with optional flag for bases/camps.

**Current Implementation:**
- Surface and Tomb hexes are implemented ✅
- D36 exploration rolls for location and condition ✅
- Hex numbers exist ✅
- Blocked hexes are partially implemented (data exists but mechanics incomplete)
- Base/camp markers are shown but may not follow all official rules

**What Needs to Be Implemented:**
- Full blocked hex mechanics (cannot be explored, forced movement)
- Visual distinction between hex types (Surface vs Tomb vs Blocked)
- Proper hex number display on all hexes
- Flag/marker system for bases and camps
- Exploration state tracking (unexplored vs explored)
- Validation that blocked hexes cannot be explored

## Acceptance Criteria

- [ ] Three hex types are visually distinct: Surface, Tomb, Blocked
- [ ] Blocked hexes cannot be explored (validation prevents it)
- [ ] If a kill team is in a blocked hex, they must move out in next Movement phase
- [ ] Hex numbers are clearly visible on all hexes
- [ ] Explored hexes display location and condition information
- [ ] Unexplored hexes are visually different from explored hexes
- [ ] Base and camp flags/markers are clearly visible
- [ ] Unit tests validate hex type restrictions
- [ ] Integration tests verify exploration flow for each hex type

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add blocked hex validation and forced movement logic
- `src/components/PhaserHexMap/HexMapScene.js` - Visual rendering for hex types and states
- `src/data/campaignData.js` - Ensure blocked hex data is complete
- `src/components/HexDetails.jsx` - Display hex type and exploration state

**Implementation Considerations:**
- Hex visual states:
  - Unexplored: Dimmed or different color
  - Explored: Full color with location/condition info
  - Blocked: Special pattern (hatched, X'd out, red border)
- Blocked hex behavior:
  - Cannot be clicked for exploration
  - Players in blocked hex get warning
  - Movement phase must include validation
- Hex numbers should be small and unobtrusive but readable
- Base flag: ⌂ symbol (currently implemented)
- Camp flag: ⛺ symbol (currently implemented)
- Consider hex info tooltip on hover

**Related Issues:**
- Related to Base Hex Placement Rules (#007)
- Related to Map Management (#004)

## Labels

`enhancement`, `hex-map`, `ui`, `data`
