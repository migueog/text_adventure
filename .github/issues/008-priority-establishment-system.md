# Priority Establishment System

## Description

The campaign rules state: "Whenever multiple players would resolve rules at the same time (e.g. move or resolve two camp rules), use the following methods (in order) to establish which player has priority and does so first:
• The player with the least Campaign points.
• The player with the least Supply points.
• Roll-off."

This system is not currently implemented.

**Current Implementation:**
- Turn order is sequential (players take full turns one at a time) ✅
- No priority system for simultaneous actions
- No automatic priority calculation

**What Needs to Be Implemented:**
- Priority calculation function using the three-tier rule
- Visual indicator showing priority order
- Automatic application during simultaneous events (camp actions, etc.)
- Manual priority determination tool for edge cases
- Roll-off mechanism for tiebreakers

## Acceptance Criteria

- [ ] Priority calculation follows official rules (CP → SP → Roll-off)
- [ ] System automatically determines priority when needed
- [ ] UI displays priority order for simultaneous actions
- [ ] Players can manually invoke priority determination if needed
- [ ] Roll-off dialog appears when CP and SP are tied
- [ ] Priority order is shown in player list/panel
- [ ] Unit tests validate priority calculation logic
- [ ] Integration tests verify priority application in gameplay

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add priority calculation function
- `src/components/PhaseTracker.jsx` - Display priority order when relevant
- `src/components/PlayerPanel.jsx` - Show priority indicators
- New component: `src/components/PriorityIndicator.jsx` (optional)
- `src/utils/dice.js` - Roll-off function

**Implementation Considerations:**
- Priority calculation function:
```javascript
function determinePriority(players) {
  // 1. Sort by CP (ascending)
  // 2. If tied, sort by SP (ascending)
  // 3. If still tied, trigger roll-off
  return sortedPlayers;
}
```

- When priority is needed:
  - Multiple camps on same hex (rare but possible with different game modes)
  - Simultaneous movement resolutions
  - Multiple players resolving threat phase effects
  - Tie-breaking in victory conditions

- UI display:
  - Priority badge/number on player panels (1st, 2nd, 3rd, etc.)
  - Highlight current player in priority order
  - Show priority criteria (e.g., "Priority: Lowest CP")

- Roll-off for ties:
  - Modal dialog: "Players tied for priority, roll D6"
  - Each player rolls, show results
  - Highest roll goes first (re-roll ties)

**Related Issues:**
- Related to Base Hex Placement (#007) - uses roll-off
- May affect Camp and Action resolution
- Important for multiplayer balance

## Labels

`enhancement`, `gameplay`, `ui`
