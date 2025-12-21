# Map Management & Responsibilities

## Description

The campaign rules state: "Information is recorded on the map, so ensure it's accurate and that all players are informed. If multiple players are taking part in the campaign, it's recommended that one player takes responsibility for keeping the map up-to-date."

**Current Implementation:**
- Map state exists but no formal "map keeper" role
- No audit log for map changes
- No validation or synchronization system
- All players can modify the map equally

**What Needs to Be Implemented:**
- Map keeper role assignment
- Audit log tracking all map changes (who changed what, when)
- Map validation and consistency checks
- Change notifications to all players
- Optional "map keeper only" edit mode
- Map state versioning for conflict resolution

## Acceptance Criteria

- [ ] One player can be designated as map keeper during setup
- [ ] Map keeper role can be transferred to another player
- [ ] All map changes are logged with timestamp and player name
- [ ] Audit log is viewable by all players
- [ ] Map validation detects inconsistencies (e.g., overlapping bases)
- [ ] Option to restrict map editing to map keeper only
- [ ] Change notifications displayed to all players
- [ ] Unit tests validate audit logging and permissions
- [ ] Integration tests verify map keeper workflows

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add map keeper role state, audit logging
- `src/components/GameSetup.jsx` - Add map keeper selection
- `src/components/PhaserHexMap/HexMapScene.js` - Implement edit permissions
- `src/components/EventLog.jsx` - Display map audit entries
- New component: `src/components/MapAuditLog.jsx` (optional)

**Implementation Considerations:**
- Map keeper role is optional - if not assigned, all players have equal access
- Audit log entries should include:
  - Player name
  - Timestamp
  - Change type (exploration, camp placement, etc.)
  - Hex coordinates
  - Previous and new state
- Validation checks:
  - No overlapping bases/camps on same hex
  - Player movement within valid range
  - Resource constraints (SP for actions)
- Consider "approval mode" where map keeper must approve changes
- Important for multiplayer and async play

**Related Issues:**
- Related to Campaign Setup (#001)
- Critical for future multiplayer/async functionality
- Will integrate with save/load system

## Labels

`enhancement`, `ui`, `hex-map`, `gameplay`
