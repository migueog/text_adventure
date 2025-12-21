# Phase-Specific UI and Guidance

## Description

Each of the four campaign phases has specific purposes:
1. **Movement Phase**: Move your kill team around the hex map
2. **Battle Phase**: Play a game of Kill Team against any opponent and earn Campaign or Supply points based on the result
3. **Action Phase**: Spend your Supply points on campaign actions
4. **Threat Phase**: Raise the threat level. Once it reaches its maximum, the campaign ends.

**Current Implementation:**
- Phase names are displayed ✅
- Basic phase progression exists ✅
- Action buttons available in appropriate phases ✅

**What Needs to Be Enhanced:**
- Clear, prominent display of what to do in each phase
- Phase-specific UI showing available actions
- Contextual help and tooltips
- Visual focus on relevant UI elements per phase
- Disable/hide irrelevant actions during each phase
- New player guidance system
- Phase-specific quick reference

## Acceptance Criteria

- [ ] Each phase displays clear instructions (e.g., "Move your kill team")
- [ ] Available actions for current phase are highlighted
- [ ] Unavailable actions are disabled/grayed out
- [ ] Phase-specific help text or tooltips available
- [ ] First-time players get guidance popups (dismissible)
- [ ] Visual focus guides player attention (highlights, arrows, etc.)
- [ ] Quick reference panel shows phase rules
- [ ] Unit tests validate phase-specific UI states
- [ ] Accessibility: Screen readers announce phase changes

## Technical Notes

**Files to Modify:**
- `src/components/PhaseTracker.jsx` - Enhanced with phase descriptions and help
- `src/components/PhaserHexMap/index.jsx` - Phase-aware interactions
- `src/App.jsx` - Coordinate phase-specific UI states
- New component: `src/components/PhaseGuide.jsx` - Contextual help panel
- New component: `src/components/TutorialTooltips.jsx` - First-time guidance

**Implementation Considerations:**

- Phase-specific messaging:
```javascript
const phaseDescriptions = {
  movement: {
    title: "Movement Phase",
    instruction: "Move your kill team up to 3 hexes away (costs 1 SP per hex)",
    actions: ["Click a hex to move", "You can also skip movement"],
    highlight: ["hex-map", "sp-counter"]
  },
  battle: {
    title: "Battle Phase",
    instruction: "Play a Kill Team game and record your result",
    actions: ["Select Win/Loss/Draw/Bye", "Earn CP based on result"],
    highlight: ["battle-result-buttons"]
  },
  action: {
    title: "Action Phase",
    instruction: "Choose one campaign action to perform",
    actions: ["Scout", "Resupply", "Search", "Encamp", "Demolish"],
    highlight: ["action-buttons", "sp-counter"]
  },
  threat: {
    title: "Threat Phase",
    instruction: "The Necron threat increases",
    actions: ["Click to increase threat and end round"],
    highlight: ["threat-meter", "end-round-button"]
  }
}
```

- Visual focus system:
  - Dim/disable UI elements not relevant to current phase
  - Pulse/glow effect on active elements
  - Arrow pointing to what to do next (for new players)
  - "Focus mode" that hides advanced features during each phase

- Tutorial/guidance system:
  - First campaign: Show tooltips for each phase
  - Tooltips explain what to do with "Got it" button
  - Can be re-enabled in settings
  - Store `tutorialCompleted` flag in state/localStorage

- Quick reference panel (collapsible):
  - Shows current phase rules
  - Lists available actions
  - Shows keyboard shortcuts (if any)
  - Can be toggled on/off

- Phase-specific button states:
  - **Movement Phase**: Hex map interactive, action buttons disabled
  - **Battle Phase**: Battle result buttons enabled, others disabled
  - **Action Phase**: Action buttons enabled, hex map less interactive
  - **Threat Phase**: Only "End Round" button enabled

- Accessibility:
  - Announce phase changes: "Entering Movement Phase"
  - ARIA labels on all phase-specific actions
  - Keyboard navigation through phases
  - High contrast mode for phase indicators

**Related Issues:**
- Related to Phase Flow and Validation (#011)
- Related to Tutorial/Onboarding system (future)
- Improves usability for Campaign Setup (#001)

## Labels

`enhancement`, `phase-system`, `ui`, `accessibility`
