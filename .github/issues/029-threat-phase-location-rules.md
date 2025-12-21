# Threat Phase Location Rules Resolution

## Description

The Threat Phase rules state: "First, resolve all location rules that take place in the Threat phase (if multiple, establish priority, pg 2)."

Some hex locations have special rules that trigger during the Threat Phase (e.g., threat level increases, special events, etc.). If multiple players have location rules triggering, they must be resolved in priority order.

**Current Implementation:**
- Threat Phase exists ✅
- Basic threat increase logic exists ✅
- Location-specific Threat Phase rules may not be implemented
- Priority ordering for multiple location rules may not exist

**What Needs to Be Implemented:**
- Complete Threat Phase rules for all location types that have them
- Automatic detection of which players have active Threat Phase location rules
- Priority ordering when multiple location rules trigger
- Sequential resolution of location rules
- Clear display of location rule effects
- Event logging for each location rule resolved

## Acceptance Criteria

- [ ] All locations with Threat Phase rules have those rules defined
- [ ] System detects which players are in hexes with Threat Phase rules
- [ ] If multiple players affected, priority order determines resolution sequence
- [ ] Each location rule is resolved and effects applied
- [ ] UI shows which location rules are triggering
- [ ] Event log records all location rule resolutions
- [ ] Location rules resolve before threat level increase
- [ ] Unit tests validate location rule detection and ordering
- [ ] Integration tests verify Threat Phase rule resolution

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add Threat Phase location rule logic
- `src/data/campaignData.js` - Add complete Threat Phase rules for locations
- `src/components/PhaseTracker.jsx` - Display active Threat Phase location rules
- New component: `src/components/ThreatPhaseRules.jsx` - Show location rule resolution

**Implementation Considerations:**

- Location Threat Phase rule structure:
```javascript
{
  name: "Awakening Tomb",
  description: "Necron systems activating",
  threatPhaseRule: {
    effect: "Increase threat level by 1",
    type: "threat_increase",
    amount: 1
  }
},
{
  name: "Unstable Reactor",
  description: "Power core overloading",
  threatPhaseRule: {
    effect: "All players in this hex lose 1 SP",
    type: "sp_penalty",
    amount: 1,
    target: "all_in_hex"
  }
},
{
  name: "Safe Haven",
  description: "Protected area",
  threatPhaseRule: {
    effect: "Gain 1 SP if you end round here",
    type: "sp_gain",
    amount: 1,
    target: "player_in_hex"
  }
}
```

- Location rule detection:
```javascript
function detectThreatPhaseLocationRules(gameState) {
  const activeRules = [];

  for (const player of gameState.players) {
    const hex = gameState.hexes[player.currentHex];

    if (hex.explored && hex.location?.threatPhaseRule) {
      activeRules.push({
        player,
        hex: player.currentHex,
        location: hex.location,
        rule: hex.location.threatPhaseRule
      });
    }
  }

  // Sort by priority
  if (activeRules.length > 1) {
    activeRules.sort((a, b) => {
      return comparePriority(a.player, b.player);
    });
  }

  return activeRules;
}
```

- Resolution sequence:
```javascript
function resolveThreatPhaseLocationRules(gameState) {
  const activeRules = detectThreatPhaseLocationRules(gameState);

  for (const {player, hex, location, rule} of activeRules) {
    // Display what's happening
    showLocationRuleNotification(player, location, rule);

    // Resolve effect
    switch (rule.type) {
      case 'threat_increase':
        gameState.threatLevel += rule.amount;
        logEvent(`${location.name} increased threat by ${rule.amount}`);
        break;

      case 'sp_penalty':
        if (rule.target === 'all_in_hex') {
          // Affect all players in this hex
          const playersInHex = gameState.players.filter(p => p.currentHex === hex);
          playersInHex.forEach(p => {
            p.sp = Math.max(0, p.sp - rule.amount);
          });
        } else {
          player.sp = Math.max(0, player.sp - rule.amount);
        }
        break;

      case 'sp_gain':
        player.sp = Math.min(10, player.sp + rule.amount);
        break;

      case 'cp_gain':
        player.cp += rule.amount;
        break;

      // Other special effects...
    }
  }
}
```

- UI display:
```
Threat Phase - Location Rules
──────────────────────────────────────
Resolving in priority order:

1. Blue Player (Hex 14: Awakening Tomb)
   → Threat level increased by 1

2. Red Player (Hex 8: Unstable Reactor)
   → Lost 1 SP

[Continue to Threat Increase]
```

- Priority ordering:
  - Use standard priority rules (lowest CP → SP → roll-off)
  - Important when multiple players have location rules
  - Example: Threat-increasing location vs SP-gaining location

- Common Threat Phase location rules (examples):
  - **Tomb locations**: Often increase threat
  - **Guardian Posts**: May trigger hostile events
  - **Power Nodes**: Could provide bonuses or penalties
  - **Seismic Activity**: Random effects
  - Need to define for all 36 locations (many may have no Threat Phase rule)

- Location rule notification:
  - Modal or banner: "[Location Name] Threat Phase Effect"
  - Description of what's happening
  - Effect result shown
  - Auto-advance after confirmation or timeout

- Event log entries:
  - "Threat Phase: Awakening Tomb (Hex 14) increased threat by 1"
  - "Threat Phase: Blue Player lost 1 SP (Unstable Reactor)"

**Related Issues:**
- Related to Threat Level Meter (#010)
- Related to Priority Establishment System (#008)
- Related to Campaign Data completeness
- Related to Threat Level Increase (#030)

## Labels

`enhancement`, `phase-system`, `threat`, `data`
