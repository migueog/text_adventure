# Campaign End Condition and Victory Processing

## Description

The campaign rules state: "Once a campaign round is completed, repeat it unless the threat level has reached its maximum (pg 5)." And from the Threat Phase: "Raise the threat level. Once it reaches its maximum, the campaign ends."

**Current Implementation:**
- Threat level tracking exists ✅
- Target threat level configurable ✅
- Victory screen exists ✅
- Victory categories calculated (5 types) ✅

**What Needs to Be Enhanced:**
- Clear end-of-campaign trigger when threat reaches maximum
- Automatic transition to victory screen
- Option to continue playing beyond maximum threat (extended campaign)
- Campaign end notification/ceremony
- Final statistics and achievements
- Campaign summary export

## Acceptance Criteria

- [ ] Campaign automatically ends when threat reaches maximum
- [ ] Clear notification: "Campaign Complete! Threat Level Maximum Reached"
- [ ] Automatic transition to victory screen with final scores
- [ ] Option to "Continue Campaign" beyond maximum threat (optional mode)
- [ ] Campaign end shows comprehensive statistics
- [ ] Final narrative summary generated
- [ ] Campaign can be exported/saved as completed
- [ ] Unit tests validate end condition detection
- [ ] Integration tests verify victory screen transition

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add campaign end detection and state
- `src/components/PhaseTracker.jsx` - Detect and trigger end condition
- `src/components/VictoryScreen.jsx` - Enhanced with final statistics
- New component: `src/components/CampaignEndModal.jsx` (optional celebration/transition)

**Implementation Considerations:**

- End condition check:
  - After Threat Phase, check if `threatLevel >= targetThreat`
  - If true, set `campaignEnded: true` state
  - Show campaign end modal/notification
  - Transition to victory screen

- Campaign end modal:
  - "Campaign Complete!"
  - "The Necron threat has fully awakened..."
  - Show final threat level
  - Show round completed
  - Options:
    - "View Final Scores" → Victory Screen
    - "Continue Campaign" → Extended mode (optional)
    - "Export Campaign Log"

- Victory screen enhancements:
  - Highlight overall winner
  - Show final round number
  - Display comprehensive stats:
    - Total hexes explored
    - Total battles
    - Total distance traveled
    - Total SP spent/earned
    - Narrative summary
  - Achievements or highlights

- Extended campaign mode:
  - Allow playing beyond maximum threat
  - Threat keeps increasing
  - Victory scores freeze at maximum threat
  - Useful for narrative completion or exploration

- Campaign state:
```javascript
{
  campaignEnded: boolean,
  endRound: number,
  finalThreatLevel: number,
  winnerData: {...},
  extendedMode: boolean
}
```

**Related Issues:**
- Related to Victory Screen enhancements
- Related to Campaign Log (#009)
- Related to Narrative System (#003)
- Related to Threat Level Meter (#010)

## Labels

`enhancement`, `phase-system`, `threat`, `ui`
