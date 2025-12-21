# Battle Phase Integration and Result Recording

## Description

The Battle Phase rules state: "Play a game of Kill Team against any opponent and earn Campaign or Supply points based on the result."

**Current Implementation:**
- Battle phase exists ✅
- Battle result recording (Win/Loss/Draw/Bye) ✅
- CP awarded based on result ✅

**What Needs to Be Enhanced:**
- Clarify CP/SP rewards for each battle result
- Integration with actual Kill Team game (external)
- Opponent tracking (campaign vs non-campaign)
- Battle details recording (mission, score, casualties, etc.)
- Battle history with statistics
- Mission selector/randomizer integration

## Acceptance Criteria

- [ ] Clear display of CP/SP rewards for each battle result
- [ ] Battle result recording includes opponent name/team
- [ ] Option to mark opponent as campaign/non-campaign participant
- [ ] Additional battle details can be recorded (optional):
  - Mission type
  - Victory points scored
  - Operatives killed/lost
  - Special achievements
- [ ] Battle history viewable with filters
- [ ] Statistics: Win rate, favorite opponent, etc.
- [ ] Integration point for future mission generator
- [ ] Unit tests validate battle result processing
- [ ] Integration tests verify CP/SP awards

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Enhanced battle result processing
- `src/components/PhaseTracker.jsx` - Enhanced Battle Phase UI
- New component: `src/components/BattleRecorder.jsx` - Detailed battle entry
- New component: `src/components/BattleHistory.jsx` - View past battles
- `src/data/campaignData.js` - Add battle reward configurations

**Implementation Considerations:**

- Battle rewards (may vary based on rules, needs clarification):
```javascript
const battleRewards = {
  win: { cp: +2, sp: 0 },      // Example values
  loss: { cp: 0, sp: +1 },     // Consolation SP?
  draw: { cp: +1, sp: 0 },     // Shared result
  bye: { cp: 0, sp: 0 }        // No game played
}
```

- Battle record structure:
```javascript
{
  round: 5,
  turn: 15,
  opponent: "Red Team" | "Non-campaign opponent",
  opponentInCampaign: boolean,
  result: "win" | "loss" | "draw" | "bye",
  cpEarned: 2,
  spEarned: 0,
  // Optional details:
  missionType: "Secure Vantage",
  vpScored: 12,
  vpOpponent: 8,
  operativesKilled: 3,
  operativesLost: 2,
  notes: "Hard-fought victory at the Thermal Vent"
}
```

- Battle recorder UI:
  - **Basic mode**: Just Win/Loss/Draw/Bye buttons (current)
  - **Detailed mode**: Expanded form with all fields
  - Toggle between modes
  - Quick entry for experienced players
  - Detailed entry for narrative tracking

- Battle history:
  - List all battles chronologically
  - Filter by: Round, Opponent, Result
  - Sort by: Date, CP earned, VP scored
  - Statistics panel:
    - Win/Loss/Draw record
    - Total CP from battles
    - Average VP scored
    - Most common opponent
    - Longest win streak

- Non-campaign opponent handling:
  - Checkbox: "Opponent is participating in campaign"
  - If unchecked: Different CP rewards (see issue #005)
  - Track separately in statistics

- Future mission generator integration:
  - Button: "Generate Random Mission"
  - Displays mission name and objectives
  - Player can accept or reroll
  - Mission recorded with battle result

**Related Issues:**
- Related to Non-Campaign Opponent Mode (#005)
- Related to Campaign Log (#009)
- Related to Narrative System (#003)
- Foundation for mission generator feature

## Labels

`enhancement`, `combat`, `phase-system`, `ui`
