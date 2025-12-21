# Solo/Cooperative Mode Setup and Configuration

## Description

The rules state: "A Ctesiphus Expedition has been designed with two or more players in mind, but you can also use it when your opponents aren't taking part in the campaign, and even when playing your games of Kill Team solo/cooperatively using a Joint Ops mission pack."

Solo/co-op mode follows the same campaign round structure but with significant rule changes.

**Current Implementation:**
- Solo mode flag exists ✅
- Some solo-specific mechanics partially implemented
- Full solo rule set may not be complete

**What Needs to Be Implemented:**
- Solo/co-op mode toggle during campaign setup
- Clear indication throughout UI that campaign is solo mode
- Joint Ops mission integration guidance
- Option to ignore condition rules for complex Joint Ops missions
- Solo-specific UI elements and messaging
- Different victory condition display (10+ CP goal)

## Acceptance Criteria

- [ ] Campaign setup includes solo/co-op mode option
- [ ] Solo mode clearly indicated in UI (badge, banner, etc.)
- [ ] Battle Phase shows solo-specific instructions
- [ ] Victory condition shows "Goal: 10+ CP" instead of competitive rankings
- [ ] Option to use/ignore condition rules in solo battles
- [ ] Joint Ops mission recommendations displayed
- [ ] All solo-specific mechanics enabled when mode active
- [ ] Unit tests validate solo mode flag propagation
- [ ] Integration tests verify solo mode differences

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Solo mode state and logic branches
- `src/components/GameSetup.jsx` - Solo mode toggle
- `src/components/PhaseTracker.jsx` - Solo-specific phase instructions
- `src/components/VictoryScreen.jsx` - Solo victory conditions
- `src/App.jsx` - Solo mode indicator

**Implementation Considerations:**

- Setup UI:
```
Campaign Mode
────────────────────────────────
○ Competitive (2-6 players)
  Battle for highest Campaign Points

● Solo/Cooperative (1 player)
  Achieve 10+ Campaign Points before threat 10

[Next: Configure Campaign]
```

- Solo mode indicator:
```
┌──────────────────────────────────┐
│ 🎯 SOLO CAMPAIGN MODE            │
│ Goal: Reach 10+ CP before T10    │
└──────────────────────────────────┘
```

- Campaign state structure:
```javascript
campaignState = {
  mode: "solo" | "competitive",
  soloSettings: {
    targetCP: 10,           // Victory requirement
    maxThreat: 10,          // Failure threshold
    resupplyLowersUsed: 0,  // Track resupply threat reductions (max 3)
    jointOpsMode: true,     // Using Joint Ops missions
    ignoreConditions: false // Option to skip hex conditions
  }
};
```

- Battle Phase solo instructions:
```
Battle Phase (Solo Mode)
────────────────────────────────────
Play against:
• Any opponent (not in campaign), OR
• Joint Ops NPC mission

Current Hex: Thermal Vent (Blizzard)
Condition: [Show Rules] [Ignore for this battle]

Recommended: Joint Ops: Tomb World
```

- Victory condition display differences:
```
// Competitive mode
Victory: Most Campaign Points
Current Leader: Blue Player (12 CP)

// Solo mode
Victory: Reach 10+ Campaign Points
Progress: 7/10 CP
Threat Level: 4/10
```

- Solo mode features:
  - No player priority system (single player)
  - Different threat mechanics (issue #035)
  - Different victory condition (10+ CP)
  - No player vs player competition
  - Can play against non-campaign opponents or NPCs
  - Performance tracking instead of competitive rankings

- UI differences throughout:
  - Movement Phase: No turn order, immediate action
  - Battle Phase: Solo instructions, Joint Ops suggestions
  - Action Phase: Immediate action, no turn order
  - Threat Phase: Dynamic threat calculation (not simple +1)
  - Victory Screen: Performance categories, not competitive rankings

- Joint Ops integration:
  - Recommendations: "Kill Team: Tomb World" for tomb hexes
  - Checkbox: "Playing Joint Ops mission with extra rules"
  - If checked: Option to ignore hex condition
  - Event log: "Solo battle vs NPCs (Joint Ops)"

**Related Issues:**
- Related to Solo Threat Mechanics (#035)
- Related to Solo Victory Condition (#036)
- Related to Solo Performance Tracking (#037)
- Related to Campaign Setup (#001)

## Labels

`enhancement`, `gameplay`, `ui`
