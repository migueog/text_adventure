# Campaign Log and Player Tracking

## Description

The campaign rules state: "Each player keeps a campaign log to manage their kill team's progress. They start with 10 Supply points and 0 Campaign points, and their kill team's base hex is their starting hex. This information will change as the campaign progresses, so record it with a pencil or digitally."

**Current Implementation:**
- Supply Points (SP) tracking exists ✅
- Campaign Points (CP) tracking exists ✅
- Starting values: 10 SP, 0 CP ✅
- Player panel displays current stats ✅
- Event log records actions ✅
- Base hex is tracked ✅

**What Needs to Be Improved:**
- Campaign log structure and display could be enhanced
- Historical tracking of SP/CP changes over time
- Better visualization of resource trends
- Campaign statistics and analytics
- Export/print campaign log
- SP min (0) and max (10) enforcement with clear UI feedback

## Acceptance Criteria

- [ ] Campaign log shows complete player history
- [ ] SP and CP changes are tracked with timestamps
- [ ] SP is enforced between 0 and 10 (with warning messages)
- [ ] Kill team name is prominently displayed
- [ ] Base hex location is clearly shown
- [ ] Campaign statistics available (total games, wins, exploration count, etc.)
- [ ] Trend graphs for SP/CP over time (optional enhancement)
- [ ] Export campaign log to text/CSV format
- [ ] Unit tests validate SP min/max enforcement
- [ ] Integration tests verify campaign log accuracy

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add SP min/max validation, historical tracking
- `src/components/PlayerPanel.jsx` - Enhanced display with statistics
- `src/components/EventLog.jsx` - Add filtering and campaign log view
- New component: `src/components/CampaignStats.jsx` or enhanced PlayerPanel

**Implementation Considerations:**
- SP enforcement:
  - Validate on all SP changes (movement, scouting, camping)
  - Show warning if action would exceed max (10) or go below min (0)
  - Prevent action if insufficient SP
  - Display "SP: 7/10" format showing current/max

- Historical tracking:
  - Track each SP/CP change with timestamp and reason
  - Store as array: `[{turn: 1, sp: 10→7, reason: "Moved 3 hexes"}, ...]`
  - Filter event log by player for individual campaign log

- Campaign statistics:
  - Total games played
  - Win/Loss/Draw record
  - Hexes explored
  - Camps built
  - CP earned from different sources
  - SP spending breakdown

- Export format:
```
Kill Team Campaign Log
======================
Team: Blood Ravens
Base: Hex 14 (Landing Site)

Turn 1:
  SP: 10 → 7 (Moved 3 hexes to Hex 23)
  Action: Scout (Discovered Thermal Vent)
  CP: 0 → 1 (Exploration bonus)
...
```

**Related Issues:**
- Related to Narrative System (#003) - campaign log feeds narrative
- Related to Map Management (#004) - base hex tracking
- Foundation for save/load functionality

## Labels

`enhancement`, `ui`, `resources`, `gameplay`
