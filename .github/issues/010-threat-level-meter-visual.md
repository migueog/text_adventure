# Threat Level Meter Visual Enhancement

## Description

The campaign rules state: "The campaign map also has a threat level meter. The threat level is used to keep track of the campaign's length (pg 5), normally by moving it up by 1 in the Threat phase of each campaign round. However, it moves differently in a solo/cooperative campaign (pg 6). Either way, you can track the threat level by marking the threat level meter with a pencil or paper clip, for example."

**Current Implementation:**
- Threat level tracking exists ✅
- Increases by 1 each round ✅
- Solo/cooperative mode has different progression ✅
- Basic numeric display

**What Needs to Be Enhanced:**
- Visual threat level meter/gauge
- Clear indication of current threat level
- Threat level descriptions/labels (e.g., "Dormant", "Stirring", "Awakened")
- Visual warning when approaching target threat
- Better integration with campaign map display
- Animation when threat level increases

## Acceptance Criteria

- [ ] Visual meter displays threat level progression
- [ ] Current threat level is clearly marked
- [ ] Threat levels have descriptive labels
- [ ] Meter shows target threat level (campaign end condition)
- [ ] Visual feedback when threat level increases
- [ ] Different visual styles for solo vs multiplayer mode (optional)
- [ ] Meter is visible on main campaign view
- [ ] Unit tests validate threat level display logic
- [ ] Visual regression tests for meter appearance

## Technical Notes

**Files to Modify:**
- New component: `src/components/ThreatMeter.jsx`
- `src/hooks/useCampaign.js` - Ensure threat level state is accessible
- `src/App.jsx` - Integrate ThreatMeter into main layout
- `src/data/campaignData.js` - Add threat level labels/descriptions

**Implementation Considerations:**
- Threat level labels (example):
  - 1: Dormant
  - 2: Stirring
  - 3: Active
  - 4: Alert
  - 5: Hostile
  - 6: Aggressive
  - 7: Awakened (default target)
  - 8+: Enraged (extended games)

- Visual design options:
  - Horizontal progress bar with markers
  - Vertical meter (thermometer style)
  - Segmented gauge with colored sections
  - Green → Yellow → Orange → Red color progression

- Meter elements:
  - Current level indicator (bright/highlighted)
  - Target level marker (flag or different color)
  - Level numbers (1-10)
  - Descriptive labels
  - Animation on increment (pulse, glow, shake)

- Integration:
  - Position: Top of screen or near phase tracker
  - Mobile-friendly: Should be readable on small screens
  - Clicking meter could show threat history or details

- Solo mode indicator:
  - Show "Solo/Co-op Mode" badge
  - Different color scheme (optional)
  - Display threat escalation rate if different

**Related Issues:**
- Related to Threat Phase mechanics
- Related to Campaign UI improvements
- May affect Victory Screen display

## Labels

`enhancement`, `ui`, `threat`
