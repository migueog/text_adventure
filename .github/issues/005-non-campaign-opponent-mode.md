# Non-Campaign Opponent Mode

## Description

The campaign rules explicitly state: "Unlike most traditional campaign systems, it's designed so that players can take part regardless of whether their opponent is also participating in the campaign."

This means a player in the campaign can play against opponents who are NOT participating in the campaign, and the system should handle this appropriately.

**Current Implementation:**
- Assumes all players are participating in the campaign
- No mechanism to track campaign vs non-campaign opponents
- Battle results treat all opponents equally

**What Needs to Be Implemented:**
- Track which players are in the campaign vs playing one-off games
- Option to record battles against non-campaign opponents
- Different consequence/scoring rules for non-campaign battles
- UI to indicate when playing against non-campaign opponent
- Battle history showing campaign vs non-campaign games

## Acceptance Criteria

- [ ] Players can mark a battle as "vs non-campaign opponent"
- [ ] Non-campaign battles are recorded but scored differently
- [ ] Battle phase UI clearly indicates campaign vs non-campaign mode
- [ ] Battle history distinguishes between campaign and non-campaign games
- [ ] Non-campaign battles still count for certain stats (e.g., games played)
- [ ] Non-campaign battles may have reduced CP rewards or different consequences
- [ ] Unit tests validate scoring differences for non-campaign battles
- [ ] Integration tests verify non-campaign battle flow

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add battle type tracking and differential scoring
- `src/components/PhaseTracker.jsx` - Add non-campaign opponent option in Battle Phase
- `src/components/EventLog.jsx` - Display battle type in history
- `src/data/campaignData.js` - Add scoring rules for non-campaign battles

**Implementation Considerations:**
- Non-campaign battle behavior:
  - Still earns CP but possibly reduced amount
  - Still counts for "games played" victory category
  - May not trigger certain campaign events or threat increases
  - Opponent's kill team doesn't need to be tracked
- UI options:
  - Checkbox: "Opponent is not in campaign"
  - Or dropdown: "Campaign Battle" vs "Non-Campaign Battle"
- Battle results might be:
  - Win vs campaign opponent: +2 CP
  - Win vs non-campaign opponent: +1 CP
- Consider if non-campaign battles affect threat level differently
- Important for flexible campaign participation

**Related Issues:**
- Related to Combat system enhancements
- May affect Victory Screen calculations

## Labels

`enhancement`, `gameplay`, `combat`, `ui`
