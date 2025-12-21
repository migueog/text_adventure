# Headhunter Operative Kill Tracking

## Description

The HEADHUNTER victory category rules: "Most enemy operatives incapacitated. Operatives with:
• 5 or less wounds count as 0 operatives.
• 6-10 wounds count as 1 operative.
• 11 or more wounds count as 2 operatives."

This requires tracking enemy operatives killed with wound-based weighting.

**Current Implementation:**
- Basic kill tracking exists ✅
- Wound-based counting may not be implemented
- Operative details may not be recorded

**What Needs to Be Implemented:**
- Record each operative kill with wound count
- Apply wound-based weighting (≤5=0, 6-10=1, 11+=2)
- UI for entering operative kills after battles
- Running total of weighted operative count
- Detailed kill log showing operative names and wounds
- Bulk entry option (select operative type, enter count)
- Pre-defined operative database with wound values

## Acceptance Criteria

- [ ] After battles, option to record enemy operative kills
- [ ] Each operative records: name, wound characteristic, calculated worth
- [ ] Wound weighting applied correctly (≤5=0, 6-10=1, 11+=2)
- [ ] Running total shows weighted operative count
- [ ] Detailed kill log available showing all operatives
- [ ] UI shows both total kills and weighted count
- [ ] Pre-defined operatives available for quick selection
- [ ] Custom operative entry for unknown types
- [ ] Unit tests validate wound-based counting
- [ ] Integration tests verify kill recording flow

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Operative kill tracking
- `src/data/campaignData.js` - Pre-defined operative database
- New component: `src/components/OperativeKillRecorder.jsx`
- New component: `src/components/KillLogDisplay.jsx`

**Implementation Considerations:**

- Operative kill structure:
```javascript
operativeKill = {
  id: "kill_123",
  round: 5,
  battleVs: "Red Player",
  operative: {
    name: "Tactical Marine",
    faction: "Space Marines",
    wounds: 8
  },
  worth: 1,  // Calculated: 6-10 wounds = 1
  timestamp: "2025-01-15T10:30:00Z"
};
```

- Wound weighting calculation:
```javascript
function calculateOperativeWorth(wounds) {
  if (wounds <= 5) {
    return {
      worth: 0,
      category: "Minor (≤5W)"
    };
  } else if (wounds <= 10) {
    return {
      worth: 1,
      category: "Standard (6-10W)"
    };
  } else {
    return {
      worth: 2,
      category: "Elite (11+W)"
    };
  }
}
```

- Pre-defined operative database:
```javascript
const OPERATIVE_DATABASE = {
  // Minor operatives (0 worth)
  "Guardsman": { wounds: 7, faction: "Astra Militarum", worth: 0 },
  "Cultist": { wounds: 7, faction: "Chaos", worth: 0 },

  // Standard operatives (1 worth)
  "Fire Warrior": { wounds: 7, faction: "T'au", worth: 1 },
  "Tactical Marine": { wounds: 8, faction: "Space Marines", worth: 1 },
  "Necron Warrior": { wounds: 9, faction: "Necrons", worth: 1 },

  // Elite operatives (2 worth)
  "Intercessor Sergeant": { wounds: 11, faction: "Space Marines", worth: 2 },
  "Ork Nob": { wounds: 12, faction: "Orks", worth: 2 },
  "Rubric Marine": { wounds: 11, faction: "Thousand Sons", worth: 2 }
};
```

- Operative kill recorder UI:
```
Record Enemy Operatives Killed
Battle vs: Red Player (Round 5)
────────────────────────────────────

Quick Select:
[Fire Warrior] [Tactical Marine] [Necron Warrior]
[Ork Boy] [Intercessor] [More...]

Or enter custom operative:
Name: [_____________]
Wounds: [__] (characteristic value)

Kills Recorded This Battle:
• Tactical Marine (8W) → 1 point
• Fire Warrior (7W) → 1 point
• Ork Nob (12W) → 2 points

Total This Battle: 4 points

[Add Another] [Finish Recording]
```

- Kill log display:
```
Headhunter Kill Log - Blue Player
────────────────────────────────────
Weighted Total: 15 operatives

Round 5 vs Red Player:
• Tactical Marine (8W) → 1
• Fire Warrior (7W) → 1
• Ork Nob (12W) → 2
  Subtotal: 4

Round 3 vs Green Player:
• Necron Warrior (9W) → 1
• Necron Warrior (9W) → 1
• Immortal (10W) → 1
  Subtotal: 3

[View Full Log]
```

- Bulk entry option:
```
Quick Entry
────────────────────────────────────
Operative: [Fire Warrior ▼] (7W → 1 point)
Quantity: [3]

[Add to Log]

Summary:
3 × Fire Warrior = 3 points
```

- Player panel display:
```
Blue Player
CP: 12  |  SP: 7/10

HEADHUNTER: 15 operatives
(23 total kills, 15 weighted)
```

- Wound characteristic reminders:
  - Show tooltip: "Enter operative's Wounds (W) characteristic"
  - Examples: "Fire Warrior has 7W, counts as 1 operative"
  - "Guardsmen have 7W but count as 0 (≤5W cutoff is incorrect - should be 7)"
  - NOTE: Rules say "5 or less" but most basic infantry have 7W

- Handling rule ambiguity:
  - Rules say ≤5W = 0, but most weak operatives have 7W
  - This seems like an error in the rules
  - Options:
    1. Follow rules exactly (≤5=0, 6-10=1, 11+=2)
    2. Adjust to match Kill Team reality (≤7=0, 8-10=1, 11+=2)
  - Recommend: Follow written rules but add clarification note

- Statistics summary:
```javascript
headhunterStats = {
  totalKills: 23,           // Raw count
  weightedKills: 15,        // Wound-based count
  breakdown: {
    minor: 8,    // ≤5W (worth 0) - 8 kills = 0 points
    standard: 12,  // 6-10W (worth 1) - 12 kills = 12 points
    elite: 3      // 11+W (worth 2) - 3 kills = 6 points
  }
  // Total weighted: 0 + 12 + 6 = 18... wait this doesn't match
  // Let me recalculate properly
};
```

**Related Issues:**
- Related to Victory Categories Tracking (#031)
- Related to Battle Phase Integration (#015)
- Related to Campaign Log (#009)

## Labels

`enhancement`, `combat`, `gameplay`, `ui`, `data`
