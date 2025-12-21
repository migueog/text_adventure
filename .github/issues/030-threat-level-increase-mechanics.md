# Threat Level Increase Mechanics

## Description

The Threat Phase rules state: "Then, unless it's a solo/cooperative campaign, raise the threat level by 1. If it reaches its maximum, the campaign ends."

Additional info: "Determine the maximum threat level before the campaign begin, but 7 is a good average. If you're playing a solo/cooperative campaign, the threat level rises differently."

**Current Implementation:**
- Threat level tracking exists ✅
- Increases by 1 each round ✅
- Target threat level configurable ✅
- Solo mode has different mechanics (partially implemented)

**What Needs to Be Enhanced:**
- Clear distinction between multiplayer and solo threat increase
- Default maximum of 7 with option to customize
- Campaign end trigger when maximum reached
- Visual feedback for threat increase
- Threat level descriptions (Dormant → Awakened, etc.)
- Warning when approaching maximum

## Acceptance Criteria

- [ ] Multiplayer: Threat increases by exactly 1 each round
- [ ] Solo/co-op: Different threat increase (based on rules pg 6 - to be defined)
- [ ] Default maximum threat is 7
- [ ] Maximum can be customized during setup
- [ ] Campaign ends automatically when threat reaches maximum
- [ ] Visual animation/feedback when threat increases
- [ ] Warning shown when 1-2 levels from maximum
- [ ] Threat level descriptions displayed
- [ ] Unit tests validate threat increase logic
- [ ] Integration tests verify campaign end trigger

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Enhanced threat increase logic
- `src/components/PhaseTracker.jsx` - Threat increase UI
- `src/components/ThreatMeter.jsx` - Visual feedback for increase
- `src/components/GameSetup.jsx` - Configure maximum threat level

**Implementation Considerations:**

- Threat increase logic:
```javascript
function increaseThreatLevel(gameState) {
  const oldThreat = gameState.threatLevel;

  if (gameState.isSoloMode) {
    // Solo/co-op has different mechanics (TBD from pg 6)
    // For now, assume similar but may have variable increases
    gameState.threatLevel += calculateSoloThreatIncrease(gameState);
  } else {
    // Multiplayer: Always +1
    gameState.threatLevel += 1;
  }

  const newThreat = gameState.threatLevel;

  // Check if maximum reached
  if (newThreat >= gameState.maxThreatLevel) {
    gameState.campaignEnded = true;
    gameState.endReason = "Maximum threat level reached";
  }

  return {
    oldThreat,
    newThreat,
    campaignEnded: gameState.campaignEnded
  };
}
```

- Maximum threat level setup:
```
Campaign Setup - Threat Level
────────────────────────────────
Maximum Threat Level: [7] ▼

Recommended: 7 (average campaign)
- Short campaign: 5
- Average campaign: 7
- Long campaign: 9-10

[Start Campaign]
```

- Threat level descriptions:
```javascript
const threatLevels = {
  1: { name: "Dormant", description: "The tomb is silent", color: "green" },
  2: { name: "Stirring", description: "Faint energy detected", color: "green" },
  3: { name: "Active", description: "Systems powering up", color: "yellow" },
  4: { name: "Alert", description: "Security protocols engaged", color: "yellow" },
  5: { name: "Hostile", description: "Automated defenses active", color: "orange" },
  6: { name: "Aggressive", description: "Full combat protocols", color: "orange" },
  7: { name: "Awakened", description: "Necrons fully awakened", color: "red" },
  8: { name: "Enraged", description: "Overwhelming force", color: "red" },
  9: { name: "Overwhelming", description: "Complete activation", color: "darkred" },
  10: { name: "Apocalyptic", description: "Total war", color: "darkred" }
};
```

- Threat increase UI sequence:
  1. "Threat Phase" banner appears
  2. Location rules resolve (if any)
  3. "Increasing Threat Level..." message
  4. Threat meter animates upward
  5. New level highlighted with pulse/glow
  6. Display: "Threat Level: 3 → 4 (Hostile)"
  7. If campaign ends: Immediate transition to end screen

- Warning system:
```javascript
function getThreatWarning(currentThreat, maxThreat) {
  const remaining = maxThreat - currentThreat;

  if (remaining === 0) {
    return { level: "critical", message: "MAXIMUM THREAT REACHED - Campaign Ending!" };
  } else if (remaining === 1) {
    return { level: "urgent", message: "WARNING: Final Round! Campaign ends next round." };
  } else if (remaining === 2) {
    return { level: "caution", message: "CAUTION: Only 2 rounds remaining." };
  }

  return null;
}
```

- Visual feedback:
  - Threat meter fills/advances
  - Color changes as threat increases (green → yellow → orange → red)
  - Pulse animation on increase
  - Sound effect (optional)
  - Screen shake at high threat levels (optional dramatic effect)

- Campaign end sequence:
  1. Threat reaches maximum
  2. Dramatic notification: "The Necrons Have Fully Awakened!"
  3. Final threat level shown
  4. Transition to Victory Screen
  5. Calculate all victory categories

- Event log:
  - "Threat Phase: Threat level increased 3 → 4 (Hostile)"
  - "WARNING: Campaign ends in 2 rounds"
  - "Threat level maximum reached - Campaign complete!"

**Related Issues:**
- Related to Threat Phase Location Rules (#029)
- Related to Campaign End Condition (#013)
- Related to Threat Level Meter Visual (#010)
- Related to Solo/Co-op mechanics (future - needs pg 6 rules)

## Labels

`enhancement`, `phase-system`, `threat`, `ui`
