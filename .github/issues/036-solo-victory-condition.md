# Solo Victory Condition (10+ CP Goal)

## Description

The solo/co-op victory condition: "Without competing players to battle over Campaign points and objectives, the aim of a solo/cooperative campaign is to end the campaign with 10 or more Campaign points. For example, at the end of a campaign round, if the threat level is 10 and you have 10 or more Campaign points, the campaign is a success."

**Current Implementation:**
- Victory screen exists ✅
- Competitive victory categories implemented ✅
- Solo victory condition (10+ CP) may not be implemented

**What Needs to Be Implemented:**
- 10 CP goal as sole victory condition for solo mode
- Campaign success/failure determination at threat 10
- Progress tracking toward 10 CP goal
- Victory/failure messaging specific to solo mode
- Different victory screen for solo vs competitive
- Performance categories instead of competitive rankings

## Acceptance Criteria

- [ ] Solo mode has 10 CP goal instead of competitive rankings
- [ ] UI shows progress toward 10 CP throughout campaign
- [ ] When threat reaches 10, check if CP >= 10
- [ ] If CP >= 10: Victory screen shows "Campaign Success"
- [ ] If CP < 10: Victory screen shows "Campaign Failed"
- [ ] Victory screen displays final stats and performance
- [ ] Clear visual distinction between success and failure
- [ ] Unit tests validate solo victory logic
- [ ] Integration tests verify success/failure conditions

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Solo victory determination
- `src/components/VictoryScreen.jsx` - Solo victory display
- `src/components/PlayerPanel.jsx` - CP goal progress
- New component: `src/components/SoloVictoryScreen.jsx`

**Implementation Considerations:**

- Victory determination:
```javascript
function checkSoloCampaignEnd(gameState) {
  if (gameState.mode !== "solo") return;

  // Campaign ends when threat reaches 10
  if (gameState.threatLevel >= 10) {
    gameState.campaignEnded = true;

    const player = gameState.players[0];  // Solo player
    const success = player.cp >= 10;

    gameState.soloResult = {
      success: success,
      finalCP: player.cp,
      targetCP: 10,
      finalThreat: gameState.threatLevel,
      rounds: gameState.currentRound,
      message: success
        ? "Mission accomplished! Your kill team successfully completed the expedition."
        : "Mission failed. Your kill team was forced to withdraw."
    };

    return true;  // Campaign ended
  }

  return false;  // Continue campaign
}
```

- CP progress UI:
```
Solo Campaign Progress
──────────────────────────────────
Goal: Reach 10 Campaign Points

CP Progress: ████████░░ 8/10
Threat Level: ██████░░░░ 6/10

Status: On track
2 CP needed for victory
```

- Victory screen (success):
```
╔════════════════════════════════╗
║    CAMPAIGN SUCCESS! 🎉        ║
╚════════════════════════════════╝

Mission Accomplished
Your kill team successfully completed
the Ctesiphus Expedition.

Final Statistics:
─────────────────────────────────
Campaign Points: 12 / 10 ✓
Threat Level: 10 (Withdrawn)
Rounds Completed: 15

Performance Categories:
• Pioneer: 67 SP spent
• Explorer: 14 hexes explored
• Trooper: 12 games played
• Warrior: 8 games won
• Headhunter: 11 operatives

[View Full Stats] [New Campaign]
```

- Victory screen (failure):
```
╔════════════════════════════════╗
║    CAMPAIGN FAILED ⚠️          ║
╚════════════════════════════════╝

Mission Failed
The area became too intense.
Your kill team was forced to withdraw.

Final Statistics:
─────────────────────────────────
Campaign Points: 8 / 10 ✗ (2 short)
Threat Level: 10 (Maximum)
Rounds Completed: 14

Performance Categories:
• Pioneer: 52 SP spent
• Explorer: 11 hexes explored
• Trooper: 10 games played
• Warrior: 6 games won
• Headhunter: 7 operatives

Better luck next time!

[Try Again] [New Campaign]
```

- In-game warnings:
```javascript
function getSoloProgressWarning(cp, threat) {
  const cpNeeded = 10 - cp;
  const threatRemaining = 10 - threat;

  if (threat >= 9) {
    if (cp >= 10) {
      return {
        level: "success",
        message: "Victory secured! You have 10+ CP."
      };
    } else {
      return {
        level: "critical",
        message: `URGENT: ${cpNeeded} CP needed! Threat at maximum next round.`
      };
    }
  } else if (threat >= 7 && cp < 7) {
    return {
      level: "warning",
      message: `Falling behind: ${cpNeeded} CP needed, ${threatRemaining} rounds likely remaining.`
    };
  }

  return null;
}
```

- Progress notifications:
```
[After gaining CP]
──────────────────────────────────
+1 Campaign Point!

Progress: 8/10 CP
2 more CP needed for victory
──────────────────────────────────
```

- Near-end scenarios:
  - **Threat 9, CP 10+**: "Victory secured! Threat can reach 10."
  - **Threat 9, CP 8**: "CRITICAL: 2 CP needed before next threat increase!"
  - **Threat 10, CP 10+**: "Campaign Success!"
  - **Threat 10, CP < 10**: "Campaign Failed"

- Alternative victory possibility:
  - If threat somehow stays below 10 indefinitely
  - Victory could be achieved at any time with 10+ CP
  - But main end condition is threat reaching 10

**Related Issues:**
- Related to Solo/Co-op Mode Setup (#034)
- Related to Solo Dynamic Threat (#035)
- Related to Solo Performance Tracking (#037)
- Related to Victory Screen enhancements

## Labels

`enhancement`, `gameplay`, `ui`
