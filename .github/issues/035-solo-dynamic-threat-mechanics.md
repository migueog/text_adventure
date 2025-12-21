# Solo/Co-op Dynamic Threat Level Mechanics

## Description

Solo mode has completely different threat mechanics: "Don't raise the threat level by 1 automatically in the Threat phase. Instead:"

**Threat Increases:**
1. Explore tomb hex (non-Scout): D6, 4+ → +1 threat
2. Finish battle: D6, win 3+ → +1 threat, loss/draw 5+ → +1 threat
3. Search action: D6, 5+ → +1 threat (unless spend 1 SP)
4. Search Doomsday Vault (TL35) or Demolish Power Cell Sanctum (TL24): +D3 threat

**Threat Decreases:**
- Resupply action: Lower threat by 1 (or D3 if at base/camp)
- Maximum 3 times per campaign

**Failure Condition:**
- If threat reaches 10, campaign ends (too intense, must withdraw)

**Current Implementation:**
- Basic solo threat exists (simple +1 per round)
- Dynamic triggers NOT implemented
- Resupply threat reduction NOT implemented
- 3-use limit NOT tracked

**What Needs to Be Implemented:**
- All five threat increase triggers with dice rolls
- Resupply threat reduction with D3 at base/camp
- Track resupply reductions (max 3 per campaign)
- Threat level 10 = automatic campaign end
- Clear UI showing threat triggers and probabilities
- Dice roll animations for threat checks
- Strategic decision prompts (spend 1 SP to prevent threat?)

## Acceptance Criteria

- [ ] Tomb hex exploration triggers D6 threat check (4+)
- [ ] Battle completion triggers D6 threat check (win 3+, loss/draw 5+)
- [ ] Search action triggers D6 threat check (5+) with 1 SP prevention option
- [ ] Doomsday Vault search triggers D3 threat increase
- [ ] Power Cell Sanctum demolish triggers D3 threat increase
- [ ] Resupply can lower threat by 1 (or D3 at base/camp)
- [ ] Resupply threat reduction limited to 3 uses per campaign
- [ ] Threat reaching 10 ends campaign immediately
- [ ] All dice rolls shown to player with results
- [ ] Unit tests validate all threat trigger conditions
- [ ] Integration tests verify threat increase/decrease logic

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Solo threat calculation logic
- `src/components/PhaseTracker.jsx` - Threat check UI
- `src/components/ThreatMeter.jsx` - Solo threat display
- New component: `src/components/ThreatCheckDialog.jsx` - Dice roll and results

**Implementation Considerations:**

- Threat trigger structure:
```javascript
const soloThreatTriggers = {
  tombExploration: {
    condition: "Explore tomb hex (non-Scout)",
    roll: "D6",
    threshold: 4,
    increase: 1,
    description: "On 4+, threat increases by 1"
  },
  battleWin: {
    condition: "Win battle",
    roll: "D6",
    threshold: 3,
    increase: 1,
    description: "On 3+, threat increases by 1"
  },
  battleLossOrDraw: {
    condition: "Loss or draw battle",
    roll: "D6",
    threshold: 5,
    increase: 1,
    description: "On 5+, threat increases by 1"
  },
  searchAction: {
    condition: "Search action",
    roll: "D6",
    threshold: 5,
    increase: 1,
    preventable: true,
    preventCost: 1,  // 1 SP
    description: "On 5+, threat increases by 1 (or spend 1 SP to prevent)"
  },
  doomsdayVaultSearch: {
    condition: "Search Doomsday Vault (TL35)",
    roll: "D3",
    automatic: true,
    increase: "D3",
    description: "Threat increases by D3"
  },
  powerCellDemolish: {
    condition: "Demolish Power Cell Sanctum (TL24)",
    roll: "D3",
    automatic: true,
    increase: "D3",
    description: "Threat increases by D3 (not recommended!)"
  }
};
```

- Tomb exploration check:
```javascript
function onTombHexExplored(hex, viaScoutAction) {
  if (gameState.mode !== "solo") return;
  if (viaScoutAction) return;  // Scout action doesn't trigger this

  // Roll D6
  const roll = rollD6();
  if (roll >= 4) {
    gameState.threatLevel += 1;
    showThreatCheck({
      trigger: "Tomb Exploration",
      roll: roll,
      threshold: 4,
      result: "Threat increased!",
      newThreat: gameState.threatLevel
    });
  } else {
    showThreatCheck({
      trigger: "Tomb Exploration",
      roll: roll,
      threshold: 4,
      result: "No threat increase",
      newThreat: gameState.threatLevel
    });
  }
}
```

- Search action with prevention option:
```javascript
function performSearchAction(player, currentHex) {
  // Execute search as normal
  const searchResult = resolveSearch(currentHex);

  // Check for special locations
  if (currentHex.location.id === "TL35") {  // Doomsday Vault
    const roll = rollD3();
    gameState.threatLevel += roll;
    showThreatCheck({
      trigger: "Doomsday Vault Search",
      roll: roll,
      automatic: true,
      increase: roll,
      newThreat: gameState.threatLevel
    });
    return;
  }

  // Normal search threat check
  const roll = rollD6();
  if (roll >= 5) {
    // Offer prevention option
    const preventThreat = await askUser(
      "Threat Check Failed!",
      `Rolled ${roll} - Threat will increase by 1.
       Spend 1 SP to prevent this?`,
      ["Spend 1 SP", "Accept Threat Increase"]
    );

    if (preventThreat === "Spend 1 SP" && player.sp >= 1) {
      player.sp -= 1;
      logEvent("Spent 1 SP to prevent threat increase");
    } else {
      gameState.threatLevel += 1;
      logEvent("Threat increased from Search action");
    }
  }
}
```

- Resupply threat reduction:
```javascript
function performResupply(player, currentHex) {
  // Normal resupply
  const spGained = calculateResupply(player, currentHex);
  player.sp = Math.min(10, player.sp + spGained);

  // Solo mode threat reduction option
  if (gameState.mode === "solo" && gameState.soloSettings.resupplyLowersUsed < 3) {
    const isAtBaseCamp = player.bases.includes(currentHex) ||
                         player.camps.includes(currentHex);

    const reductionAmount = isAtBaseCamp ? "D3" : "1";

    const useThreatReduction = await askUser(
      "Resupply Threat Reduction",
      `Lower threat by ${reductionAmount}?
       (${3 - gameState.soloSettings.resupplyLowersUsed} uses remaining)`,
      ["Yes", "No"]
    );

    if (useThreatReduction === "Yes") {
      const reduction = isAtBaseCamp ? rollD3() : 1;
      gameState.threatLevel = Math.max(0, gameState.threatLevel - reduction);
      gameState.soloSettings.resupplyLowersUsed += 1;

      logEvent(`Threat reduced by ${reduction} (${3 - gameState.soloSettings.resupplyLowersUsed} uses remaining)`);
    }
  }
}
```

- Threat check UI:
```
Threat Check: Tomb Exploration
─────────────────────────────────
Rolling D6...
[Dice animation]

Result: 5

Threshold: 4+
5 >= 4 → THREAT INCREASES

Threat Level: 3 → 4 (Alert)

[Continue]
```

- Search prevention dialog:
```
Threat Check: Search Action
─────────────────────────────────
Rolled D6: 6
Threshold: 5+
→ Threat will increase by 1

Prevent threat increase?
Cost: 1 SP (you have 4 SP)

[Spend 1 SP to Prevent] [Accept Threat]
```

- Threat 10 campaign end:
```
Campaign Failed!
─────────────────────────────────
Threat Level has reached 10.

The area has become too intense
for your kill team to conduct an
expedition. You must withdraw.

Final Campaign Points: 8
(Goal was 10+)

[View Performance] [End Campaign]
```

- Resupply reduction tracking UI:
```
Resupply Action
─────────────────────────────────
Gained 5 SP → Now at 8/10 SP

Threat Reduction Available:
• At base/camp: D3 reduction
• Uses remaining: 2/3

Lower threat level?
Current threat: 6/10

[Roll D3 to Lower Threat] [Skip]
```

**Related Issues:**
- Related to Solo/Co-op Mode Setup (#034)
- Related to Resupply Action (#025)
- Related to Threat Level Mechanics (#030)
- Related to Solo Victory Condition (#036)

## Labels

`enhancement`, `gameplay`, `threat`, `phase-system`
