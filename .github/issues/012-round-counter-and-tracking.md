# Round Counter and Tracking

## Description

The campaign rules state: "The campaign consists of numerous rounds, and each round has four phases that must be completed. Once a campaign round is completed, repeat it unless the threat level has reached its maximum."

This implies tracking of campaign rounds as complete cycles of the four phases.

**Current Implementation:**
- Phase tracking exists (which phase player is in) ✅
- Turn tracking exists (which player's turn) ✅
- No explicit "round counter" that tracks completed rounds

**What Needs to Be Implemented:**
- Round counter showing total rounds completed
- Round history showing what happened in each round
- Visual display of current round number
- Round summary at the end of each round
- Round milestones or markers (every 5 rounds, etc.)
- Correlation between round number and threat level

## Acceptance Criteria

- [ ] Round counter increments after all players complete Threat Phase
- [ ] Current round number is prominently displayed
- [ ] Round history available showing summary of each round
- [ ] Round summary shown between rounds (optional, can be dismissed)
- [ ] UI shows "Round X of ~Y" (estimated based on threat target)
- [ ] Event log can be filtered by round number
- [ ] Unit tests validate round counting logic
- [ ] Integration tests verify round progression

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add round counter and increment logic
- `src/components/PhaseTracker.jsx` - Display current round number
- `src/components/EventLog.jsx` - Add round filtering
- New component: `src/components/RoundSummary.jsx` (optional modal between rounds)

**Implementation Considerations:**

- Round completion:
  - In multiplayer: Round completes when all players finish Threat Phase
  - In solo: Round completes when solo player finishes Threat Phase
  - Round increments at start of next Movement Phase

- Display format:
  - "Round 5" (simple)
  - "Round 5 / ~7" (estimated total based on threat target)
  - "Round 5 - Threat Level: 4/7"

- Round summary (optional feature):
  - Shows at end of round (after all Threat Phases)
  - Summary includes:
    - Hexes explored this round
    - Battles fought (results)
    - Actions taken
    - SP/CP changes
    - Threat increase
  - Can be enabled/disabled in settings
  - "Continue to Round X" button

- Round history:
```javascript
roundHistory: [
  {
    round: 1,
    threat: 1→2,
    playersActive: 4,
    hexesExplored: 6,
    battles: 3,
    majorEvents: ["Red found Tomb Entrance", "Blue built Camp"]
  },
  ...
]
```

- Milestones:
  - Every 5 rounds: Achievement or special event
  - Halfway to threat target: Notification
  - Final round: Special marking

**Related Issues:**
- Related to Phase Flow and Validation (#011)
- Related to Campaign Log (#009)
- Related to Threat Level Meter (#010)

## Labels

`enhancement`, `phase-system`, `ui`
