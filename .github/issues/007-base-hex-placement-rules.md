# Base Hex Placement Rules

## Description

The campaign rules specify: "Before the campaign begins, all players roll-off to establish an order, then each player selects a different surface hex to become their base hex in that order. It must be more than 2 hexes from each other player's base hex."

Additionally: "Base hexes cannot be explored. Enemy kill teams can move into an opponent's base hex, but a player's base hex will always remain theirs (unless otherwise specified)."

**Current Implementation:**
- Players can select starting hexes during setup ✅
- Base hexes are marked on the map ✅
- Distance validation between bases is NOT enforced
- Base hex special rules (cannot be explored, always remains yours) may not be enforced
- Roll-off system for selection order is NOT implemented

**What Needs to Be Implemented:**
- Roll-off system to establish base selection order
- Validation: base hex must be Surface type only
- Validation: base hex must be more than 2 hexes from all other bases
- Base hexes cannot be explored (prevent exploration action)
- Base hex ownership is permanent (display player name/team in hex)
- Enemy players can enter opponent's base hex but cannot claim it
- Clear UI showing selection order during setup

## Acceptance Criteria

- [ ] Roll-off system determines base hex selection order
- [ ] Players select base hexes in roll-off order
- [ ] System validates base must be Surface hex
- [ ] System enforces minimum 2-hex distance between all bases
- [ ] Base hexes are marked with player name and kill team
- [ ] Base hexes cannot be explored (action blocked with explanation)
- [ ] Opponents can move into base hex but cannot change ownership
- [ ] UI clearly shows whose turn it is to select base
- [ ] Unit tests validate distance calculation and restrictions
- [ ] Integration tests verify full base placement flow

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add roll-off logic, base selection order, validation
- `src/components/GameSetup.jsx` - Implement roll-off UI and ordered base selection
- `src/utils/hexUtils.js` - May need distance validation helper
- `src/components/PhaserHexMap/HexMapScene.js` - Visual feedback during base selection

**Implementation Considerations:**
- Roll-off implementation:
  - Each player rolls D6
  - Ties re-roll
  - Order from highest to lowest
- Distance validation:
  - Use existing hex distance calculation
  - Check all previously placed bases
  - Highlight invalid hexes in red during selection
- Base hex restrictions:
  - Add `isBase: true` flag to hex data
  - Prevent exploration if `isBase === true`
  - Show "This is a base hex" message if exploration attempted
- Base ownership display:
  - Location field: Player name (e.g., "Red Player Base")
  - Condition field: Kill team name
  - Visual: Large base symbol (⌂) in player color
- Consider "auto-suggest" mode that highlights valid base hexes

**Related Issues:**
- Related to Campaign Setup (#001)
- Related to Hex Types and Exploration (#006)
- Related to Priority Establishment System (#008)

## Labels

`enhancement`, `hex-map`, `ui`, `gameplay`
