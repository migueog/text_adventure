# Narrative System

## Description

The campaign rules mention that the system "allows you to build your own narrative for your kill team as it conducts an expedition on Ctesiphus VII." Currently, there's no way for players to record or track their campaign narrative beyond the event log.

**Current Implementation:**
- Event log exists but only shows mechanical events
- No narrative recording or story building features
- No campaign timeline or story progression

**What Needs to Be Implemented:**
- Kill team narrative/backstory input
- Campaign story timeline showing key events
- Ability to add custom narrative entries
- Auto-generated narrative text for game events
- Campaign story export/sharing functionality
- Visual timeline or story journal UI

## Acceptance Criteria

- [ ] Players can enter kill team name and backstory during setup
- [ ] Campaign timeline displays narrative-enriched events
- [ ] Players can add custom narrative entries at any point
- [ ] Mechanical events auto-generate narrative descriptions (e.g., "Squad discovered ancient cryptek workshop")
- [ ] Narrative can be exported as readable format (text, markdown, etc.)
- [ ] UI provides dedicated narrative/story view separate from event log
- [ ] Unit tests validate narrative generation logic
- [ ] Integration tests verify narrative entry and display

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add narrative state and entry management
- `src/components/GameSetup.jsx` - Add kill team name/backstory input
- `src/components/EventLog.jsx` - Enhance with narrative mode or create new NarrativeTimeline component
- `src/data/campaignData.js` - Add narrative templates for locations/events
- New component: `src/components/NarrativePanel.jsx` or `NarrativeTimeline.jsx`

**Implementation Considerations:**
- Narrative templates: "Your kill team discovered {location} in the {terrain}"
- Timeline should distinguish between:
  - Mechanical events (movement, battles)
  - Exploration events (discoveries)
  - Custom narrative entries
- Consider narrative tags/categories (exploration, combat, discovery, etc.)
- Export could be markdown, PDF, or shareable HTML
- Narrative should persist with save/load functionality

**Related Issues:**
- Related to Objectives System (#002) - objective completion can trigger narrative
- Related to Event Log enhancement

## Labels

`enhancement`, `narrative`, `ui`
