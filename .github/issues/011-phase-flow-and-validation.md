# Phase Flow and Validation

## Description

The campaign rules state: "The campaign consists of numerous rounds, and each round has four phases that must be completed. Once a campaign round is completed, repeat it unless the threat level has reached its maximum."

The four phases must be completed in strict order:
1. Movement Phase
2. Battle Phase
3. Action Phase
4. Threat Phase

**Current Implementation:**
- Four-phase system exists ✅
- Phase progression is tracked ✅
- Sequential flow is generally enforced ✅

**What Needs to Be Enhanced:**
- Strict validation that phases are completed in order
- Clear indication when a phase is "complete" and ready to advance
- Prevent skipping phases without completing required actions
- Round counter tracking (distinct from turn/phase tracking)
- Clear messaging about phase requirements
- Option to go back to previous phase if mistake made (with confirmation)

## Acceptance Criteria

- [ ] Phases must be completed in strict order (1→2→3→4)
- [ ] Cannot advance to next phase without meeting requirements
- [ ] Phase completion is clearly indicated in UI
- [ ] Round counter tracks total campaign rounds completed
- [ ] Each phase shows what actions are required vs optional
- [ ] Warning shown if attempting to skip required actions
- [ ] Undo/back to previous phase with confirmation (prevents mistakes)
- [ ] Unit tests validate phase progression rules
- [ ] Integration tests verify complete round flow

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add phase validation logic and round counter
- `src/components/PhaseTracker.jsx` - Enhanced UI with completion indicators
- New component: `src/components/PhaseRequirements.jsx` (optional help panel)

**Implementation Considerations:**

- Phase completion criteria:
  - **Movement Phase**: Must attempt movement OR explicitly skip
  - **Battle Phase**: Must record battle result (Win/Loss/Draw/Bye)
  - **Action Phase**: Must choose an action OR explicitly skip
  - **Threat Phase**: Automatically completes when threat is increased

- Phase validation:
```javascript
const phaseRequirements = {
  movement: {
    required: false,  // Can skip movement
    check: () => playerMoved || confirmedSkip
  },
  battle: {
    required: true,   // Must record result
    check: () => battleResultRecorded
  },
  action: {
    required: false,  // Can skip action
    check: () => actionTaken || confirmedSkip
  },
  threat: {
    required: true,   // Auto-completes
    check: () => threatIncreased
  }
}
```

- Round vs Phase tracking:
  - **Phase**: Current step within a round (1-4)
  - **Round**: Complete cycle of all 4 phases
  - Display: "Round 3, Phase 2 (Battle)"

- UI indicators:
  - ✅ Phase complete (green checkmark)
  - ⏳ Phase in progress (yellow indicator)
  - 🔒 Phase locked (gray, cannot access yet)
  - Phase requirements shown as checklist

- Skip confirmation:
  - "Skip Movement Phase? You will not move your kill team this round."
  - "Skip Action Phase? You will not perform any campaign action."

**Related Issues:**
- Related to Phase-Specific UI and Guidance (#014)
- Related to Campaign End Condition (#013)
- Foundation for undo/redo functionality

## Labels

`enhancement`, `phase-system`, `ui`, `gameplay`
