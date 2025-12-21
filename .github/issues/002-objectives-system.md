# Objectives System

## Description

The campaign rules state that players need to "achieve your chosen objectives" as part of the expedition. This implies a system for selecting, tracking, and scoring objectives. This feature is not currently implemented.

**Current Implementation:**
- No objectives system exists
- Campaign Points (CP) are tracked but not tied to specific objectives
- Victory is determined only by CP total and category stats

**What Needs to Be Implemented:**
- Objective selection during campaign setup
- Multiple objective types (e.g., explore X hexes, reach specific locations, achieve CP threshold)
- Objective progress tracking throughout the campaign
- Objective completion detection and rewards
- Display of active objectives in UI
- Objective-based victory conditions

## Acceptance Criteria

- [ ] Players can select objectives during campaign setup
- [ ] At least 3-5 different objective types are available
- [ ] Objective progress is tracked and displayed in real-time
- [ ] Completing objectives grants rewards (CP, bonuses, etc.)
- [ ] Objectives are considered in victory calculation
- [ ] UI clearly shows active objectives and their progress
- [ ] Unit tests validate objective tracking and completion logic
- [ ] Integration tests verify objective selection and reward flow

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add objective state, tracking, and completion logic
- `src/components/GameSetup.jsx` - Add objective selection interface
- `src/components/PlayerPanel.jsx` or new component - Display active objectives
- `src/data/campaignData.js` - Define objective types and configurations

**Implementation Considerations:**
- Objective types might include:
  - Exploration: "Explore 10 unique hexes"
  - Location: "Reach the tomb entrance"
  - Combat: "Win 5 battles"
  - Resource: "Accumulate 50 CP"
- Consider primary vs secondary objectives
- Objectives should be trackable across multiple sessions (important for save/load)
- May need event system to trigger objective progress checks

**Related Issues:**
- Related to Narrative System (#003) - objectives can generate narrative
- Will integrate with future save/load functionality

## Labels

`enhancement`, `gameplay`
