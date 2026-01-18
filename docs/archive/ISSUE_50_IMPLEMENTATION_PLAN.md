# Issue #50: Victory Categories Tracking - Implementation Plan

**Status:** Ready for Implementation
**Milestone:** Phase 5: Victory & Progression
**Estimated Time:** 6-8 hours

---

## Executive Summary

Implement comprehensive victory category tracking for all 6 categories with proper calculations, wound-based operative counting for HEADHUNTER, and cumulative SP spent tracking for PIONEER.

---

## Current State Analysis

### What Exists ✅
- Player statistics tracking: `campaignPoints`, `exploredHexes`, `gamesPlayed`, `gamesWon`, `operativesKilled`
- Victory categories defined (5 of 6): WARLORD, EXPLORER, HEADHUNTER, PIONEER, TROOPER
- VictoryScreen component displays category winners
- Basic battle recording with operative kills

### What's Missing ❌
1. **WARRIOR category** - Not in VICTORY_CATEGORIES array
2. **PIONEER** - Tracks current SP, not cumulative SP **spent**
3. **HEADHUNTER** - Simple count, not wound-based
4. **Kill details** - No tracking of operative names/wounds
5. **SP spent tracking** - No cumulative tracking throughout campaign

### Issues Identified 🔍
- `VICTORY_CATEGORIES` array has 5 categories, should have 6
- Pioneer description: "Most Supply Points Remaining" should be "Most Supply Points Spent"
- Pioneer stat: `supplyPoints` should be `supplyPointsSpent`
- No wound-based calculation for HEADHUNTER

---

## Technical Implementation Plan

### Phase 1: Type System Updates (30 min)

**File:** `types/campaign.ts`

**Changes:**
```typescript
// Add to Player interface (line ~203)
export interface Player {
  // ... existing fields ...
  supplyPointsSpent?: number  // WHY: Track cumulative SP spent for PIONEER category (Issue #50)
  operativeKillDetails?: OperativeKill[]  // WHY: Track kill details for wound-based HEADHUNTER (Issue #50)
}

// Add new interface for kill tracking
export interface OperativeKill {
  round: number
  operativeName: string
  wounds: number
  woundValue: number  // 0, 1, or 2 based on wounds
  opponentId?: number | null  // null for external opponents
}
```

**Why:**
- `supplyPointsSpent` tracks cumulative SP across entire campaign
- `operativeKillDetails` enables wound-based HEADHUNTER calculations
- Both fields are optional for backward compatibility

---

### Phase 2: Wound-Based Operative Counting Utility (1 hour)

**File:** `lib/utils/operativeKills.ts` (NEW)

**Implementation:**
```typescript
import type { OperativeKill, Player } from '@/types/campaign'

/**
 * Calculate wound-based value for operative kill
 * WHY: HEADHUNTER category uses wound-based counting (Issue #50)
 *
 * Rules:
 * - 5 or fewer wounds: 0 points
 * - 6-10 wounds: 1 point
 * - 11+ wounds: 2 points
 */
export function calculateOperativeWoundValue(wounds: number): number {
  if (wounds <= 5) return 0
  if (wounds <= 10) return 1
  return 2  // 11+
}

/**
 * Record operative kill with wound-based tracking
 * WHY: Track kill details for HEADHUNTER calculations
 */
export function recordOperativeKill(
  player: Player,
  round: number,
  operativeName: string,
  wounds: number,
  opponentId?: number | null
): OperativeKill {
  const woundValue = calculateOperativeWoundValue(wounds)

  return {
    round,
    operativeName,
    wounds,
    woundValue,
    opponentId
  }
}

/**
 * Calculate total wound-based operative value for player
 * WHY: HEADHUNTER winner determined by wound-based total, not raw count
 */
export function calculateHeadhunterScore(player: Player): number {
  if (!player.operativeKillDetails || player.operativeKillDetails.length === 0) {
    // Fallback: Use legacy operativesKilled for backward compatibility
    return player.operativesKilled || 0
  }

  return player.operativeKillDetails.reduce((total, kill) => total + kill.woundValue, 0)
}

/**
 * Get kill details summary for display
 */
export function getKillSummary(player: Player): {
  totalKills: number
  woundScore: number
  heavyKills: number  // 11+ wounds
  standardKills: number  // 6-10 wounds
  lightKills: number  // 1-5 wounds
} {
  const details = player.operativeKillDetails || []

  return {
    totalKills: details.length,
    woundScore: calculateHeadhunterScore(player),
    heavyKills: details.filter(k => k.wounds >= 11).length,
    standardKills: details.filter(k => k.wounds >= 6 && k.wounds <= 10).length,
    lightKills: details.filter(k => k.wounds <= 5).length
  }
}
```

**File:** `lib/utils/operativeKills.test.ts` (NEW)

**Test Coverage:**
```typescript
describe('calculateOperativeWoundValue', () => {
  it('should return 0 for 1-5 wounds')
  it('should return 1 for 6-10 wounds')
  it('should return 2 for 11+ wounds')
  it('should handle edge cases (0 wounds, 100 wounds)')
})

describe('calculateHeadhunterScore', () => {
  it('should sum wound values correctly')
  it('should fallback to operativesKilled if no details')
  it('should return 0 for empty kill details')
})

describe('getKillSummary', () => {
  it('should categorize kills by wound ranges')
  it('should calculate totals correctly')
})
```

---

### Phase 3: Supply Points Spent Tracking (1.5 hours)

**File:** `hooks/useCampaign.ts`

**Strategy:** Create a centralized helper function and update all SP deduction locations.

**Helper Function (add after clampSP):**
```typescript
/**
 * Deduct SP from player and track cumulative spent (Issue #50)
 * WHY: PIONEER category tracks total SP spent, not current SP remaining
 */
const deductSupplyPoints = useCallback((
  player: Player,
  amount: number,
  reason: string
): Player => {
  const newSP = clampSP(player.supplyPoints - amount)
  const newSpent = (player.supplyPointsSpent || 0) + amount

  addEvent(`${player.name} spent ${amount} SP (${reason})`, 'action')

  return {
    ...player,
    supplyPoints: newSP,
    supplyPointsSpent: newSpent
  }
}, [addEvent])
```

**Locations to Update (8 places):**
1. **Line 374** - Threat phase damage
2. **Line 672, 935** - Search action
3. **Line 978** - Battle results (if SP cost exists)
4. **Line 1128** - Scout/Move action
5. **Line 1203, 1218, 1261** - Demolish action
6. **Line 1300** - Dimensional Manoeuvre
7. **Line 1407** - Portal travel

**Example Replacement:**
```typescript
// OLD:
supplyPoints: clampSP(player.supplyPoints - cost)

// NEW:
...deductSupplyPoints(player, cost, 'Search action')
```

**Note:** Threat phase damage doesn't count as "spending" (it's lost to attacks)
Only action costs should increment `supplyPointsSpent`.

**Corrected Locations (6 action costs only):**
1. Search (lines 672, 935)
2. Scout/Move (line 1128)
3. Demolish (lines 1203, 1218, 1261)
4. Dimensional Manoeuvre (line 1300)
5. Portal travel (line 1407)

---

### Phase 4: Update Victory Categories Data (15 min)

**File:** `lib/data/campaignData.ts`

**Current (lines 754-760):**
```typescript
export const VICTORY_CATEGORIES: VictoryCategory[] = [
  { id: 'warlord', name: 'Warlord', description: 'Most Campaign Points', stat: 'campaignPoints' },
  { id: 'explorer', name: 'Explorer', description: 'Most Hexes Explored', stat: 'exploredHexes' },
  { id: 'headhunter', name: 'Headhunter', description: 'Most Operatives Killed', stat: 'operativesKilled' },
  { id: 'pioneer', name: 'Pioneer', description: 'Most Supply Points Remaining', stat: 'supplyPoints' },
  { id: 'trooper', name: 'Trooper', description: 'Most Games Played', stat: 'gamesPlayed' }
]
```

**Updated:**
```typescript
export const VICTORY_CATEGORIES: VictoryCategory[] = [
  { id: 'warlord', name: 'Warlord', description: 'Most Campaign Points', stat: 'campaignPoints' },
  { id: 'pioneer', name: 'Pioneer', description: 'Most Supply Points Spent', stat: 'supplyPointsSpent' },
  { id: 'explorer', name: 'Explorer', description: 'Most Hexes Explored', stat: 'exploredHexes' },
  { id: 'trooper', name: 'Trooper', description: 'Most Games Played', stat: 'gamesPlayed' },
  { id: 'warrior', name: 'Warrior', description: 'Most Games Won', stat: 'gamesWon' },
  { id: 'headhunter', name: 'Headhunter', description: 'Most Enemy Operatives (Wound-Based)', stat: 'headhunterScore' }
]
```

**Changes:**
1. Fixed PIONEER: "Spent" instead of "Remaining", stat changed to `supplyPointsSpent`
2. Added WARRIOR: Uses `gamesWon` stat
3. Updated HEADHUNTER: stat changed to `headhunterScore` (calculated via utility)
4. Reordered to match spec: WARLORD, PIONEER, EXPLORER, TROOPER, WARRIOR, HEADHUNTER

---

### Phase 5: Update VictoryScreen for Custom Stats (30 min)

**File:** `components/VictoryScreen.tsx`

**Problem:** HEADHUNTER now uses calculated `headhunterScore`, not direct player field.

**Solution (lines 41-52):**
```typescript
// Calculate winners for each category
const results: CategoryResult[] = VICTORY_CATEGORIES.map(category => {
  const sorted = [...players].sort((a, b) => {
    // WHY: Handle custom calculated stats (Issue #50)
    let aStat: number
    let bStat: number

    if (category.stat === 'headhunterScore') {
      aStat = calculateHeadhunterScore(a)
      bStat = calculateHeadhunterScore(b)
    } else {
      aStat = (a as any)[category.stat] || 0
      bStat = (b as any)[category.stat] || 0
    }

    return bStat - aStat
  })

  return {
    ...category,
    winner: sorted[0] as Player,
    standings: sorted
  }
})
```

**Also update display value (lines 145-147):**
```typescript
<div className="category-value">
  {category.stat === 'headhunterScore'
    ? calculateHeadhunterScore(result.winner)
    : (result.winner as any)[result.stat]
  }
</div>
```

**Add import:**
```typescript
import { calculateHeadhunterScore } from '@/lib/utils/operativeKills'
```

---

### Phase 6: Update Battle Recording (1 hour)

**File:** `hooks/useCampaign.ts`

**Current (line 1470):**
```typescript
operativesKilled: player.operativesKilled + record.operativesKilled,
```

**Enhanced:**
```typescript
const recordBattle = useCallback((
  record: Omit<ExtendedBattleRecord, 'round' | 'timestamp'>
) => {
  setPlayers(prev => {
    const updated = [...prev]
    const player = updated[currentPlayerIndex]
    if (!player) return prev

    // ... existing SP/CP logic ...

    // WHY: Record operative kills with wound details (Issue #50)
    const newKillDetails = [...(player.operativeKillDetails || [])]

    if (record.operativeKills && record.operativeKills.length > 0) {
      // Detailed kills provided
      record.operativeKills.forEach(kill => {
        const killRecord = recordOperativeKill(
          player,
          currentRoundRef.current,
          kill.operativeName,
          kill.wounds,
          record.opponentId
        )
        newKillDetails.push(killRecord)
      })
    } else if (record.operativesKilled > 0) {
      // Legacy: Raw count only, assume standard operatives (7 wounds = 1 point each)
      for (let i = 0; i < record.operativesKilled; i++) {
        const killRecord = recordOperativeKill(
          player,
          currentRoundRef.current,
          'Unknown Operative',
          7,  // Default to 7 wounds = 1 point
          record.opponentId
        )
        newKillDetails.push(killRecord)
      }
    }

    updated[currentPlayerIndex] = {
      ...player,
      // ... existing fields ...
      operativesKilled: player.operativesKilled + record.operativesKilled,
      operativeKillDetails: newKillDetails,
      // ... rest ...
    }

    return updated
  })
}, [/* deps */])
```

**Note:** This requires extending `ExtendedBattleRecord` to optionally include operative kill details:

**File:** `types/battle.ts`
```typescript
export interface OperativeKillInput {
  operativeName: string
  wounds: number
}

export interface ExtendedBattleRecord extends BattleRecord {
  // ... existing fields ...
  operativeKills?: OperativeKillInput[]  // WHY: Optional detailed kill tracking (Issue #50)
}
```

---

### Phase 7: Initialize New Fields in Player Creation (15 min)

**File:** `hooks/useCampaign.ts`

**Update player initialization (line ~100):**
```typescript
const createPlayer = (id: number, name: string, killTeamName: string): Player => ({
  // ... existing fields ...
  supplyPointsSpent: 0,  // WHY: Track cumulative SP spent for PIONEER (Issue #50)
  operativeKillDetails: [],  // WHY: Track kill details for HEADHUNTER (Issue #50)
})
```

---

### Phase 8: Unit Tests (2 hours)

**File:** `lib/utils/operativeKills.test.ts` (Created in Phase 2)

**File:** `lib/utils/victoryCalculations.test.ts` (NEW)

**Test Coverage:**
```typescript
import { describe, it, expect } from 'vitest'
import type { Player } from '@/types/campaign'
import { calculateHeadhunterScore } from '@/lib/utils/operativeKills'

describe('Victory Calculations (Issue #50)', () => {
  describe('WARLORD - Campaign Points', () => {
    it('should determine winner by most CP')
    it('should handle ties')
  })

  describe('PIONEER - SP Spent', () => {
    it('should track cumulative SP spent')
    it('should not count threat damage as spending')
    it('should handle undefined supplyPointsSpent (legacy)')
  })

  describe('EXPLORER - Hexes Explored', () => {
    it('should count unique hexes')
  })

  describe('TROOPER - Games Played', () => {
    it('should count all games')
  })

  describe('WARRIOR - Games Won', () => {
    it('should count only wins')
    it('should not count losses or ties')
  })

  describe('HEADHUNTER - Wound-Based Kills', () => {
    it('should calculate wound-based score correctly')
    it('should weight 6-10 wounds as 1 point')
    it('should weight 11+ wounds as 2 points')
    it('should ignore 1-5 wound kills')
    it('should handle mixed kill types')
    it('should fallback to operativesKilled if no details')
  })

  describe('Victory Screen Integration', () => {
    it('should sort players correctly by each stat')
    it('should handle all 6 categories')
    it('should calculate overall champion')
  })
})
```

---

### Phase 9: Integration Tests (1 hour)

**File:** `hooks/useCampaign.victoryTracking.test.ts` (NEW)

**Test Scenarios:**
```typescript
describe('Victory Tracking Integration (Issue #50)', () => {
  describe('SP Spent Tracking', () => {
    it('should increment supplyPointsSpent on Search')
    it('should increment supplyPointsSpent on Scout')
    it('should increment supplyPointsSpent on Demolish')
    it('should not increment on threat damage')
  })

  describe('Operative Kill Tracking', () => {
    it('should record kill details in battle')
    it('should calculate wound values correctly')
    it('should update headhunter score')
  })

  describe('All Categories Tracking', () => {
    it('should update all 6 categories in real-time')
    it('should calculate winners correctly at campaign end')
  })
})
```

---

## File Change Summary

### Files to Create (4)
1. `lib/utils/operativeKills.ts` - Wound-based kill tracking utilities
2. `lib/utils/operativeKills.test.ts` - Unit tests for kill utilities
3. `lib/utils/victoryCalculations.test.ts` - Victory calculation tests
4. `hooks/useCampaign.victoryTracking.test.ts` - Integration tests

### Files to Modify (5)
1. `types/campaign.ts` - Add `supplyPointsSpent`, `operativeKillDetails` to Player
2. `types/battle.ts` - Add `operativeKills` to ExtendedBattleRecord
3. `lib/data/campaignData.ts` - Update VICTORY_CATEGORIES array (6 categories)
4. `hooks/useCampaign.ts` - Add SP tracking, kill tracking, deductSupplyPoints helper
5. `components/VictoryScreen.tsx` - Handle calculated headhunterScore stat

---

## Acceptance Criteria Checklist

### ✅ WARLORD: Tracks total CP accumulated
- **Evidence:** `Player.campaignPoints` already tracked
- **Tests:** Victory calculation tests

### ✅ PIONEER: Tracks total SP spent (cumulative)
- **Evidence:** New `Player.supplyPointsSpent` field
- **Implementation:** `deductSupplyPoints` helper
- **Tests:** Integration test verifies tracking on actions

### ✅ EXPLORER: Tracks unique hexes explored
- **Evidence:** `Player.exploredHexes` already tracked
- **Tests:** Victory calculation tests

### ✅ TROOPER: Tracks total games played
- **Evidence:** `Player.gamesPlayed` already tracked
- **Tests:** Victory calculation tests

### ✅ WARRIOR: Tracks total games won
- **Evidence:** `Player.gamesWon` already tracked (just needs to be in VICTORY_CATEGORIES)
- **Tests:** Victory calculation tests

### ✅ HEADHUNTER: Tracks enemy operatives with wound-based counting
- **Evidence:** New `Player.operativeKillDetails` array + `calculateHeadhunterScore` utility
- **Implementation:** Wound-based values (0/1/2 based on wounds)
- **Tests:** Unit tests for wound value calculation

### ✅ All statistics updated in real-time
- **Evidence:** SP spent tracked on every action, kills tracked on battle recording
- **Tests:** Integration tests verify real-time updates

### ✅ Victory screen shows winner for each category
- **Evidence:** VictoryScreen loops through all VICTORY_CATEGORIES (now 6)
- **Tests:** Component integration test

### ✅ Player panel shows current standings
- **Evidence:** VictoryScreen has "Final Standings" table with all stats
- **Optional Enhancement:** Live standings component (deferred to future issue)

### ✅ Unit tests validate all tracking logic
- **Evidence:** `operativeKills.test.ts` + `victoryCalculations.test.ts`
- **Coverage:** All 6 categories tested

### ✅ Integration tests verify victory calculations
- **Evidence:** `useCampaign.victoryTracking.test.ts`
- **Coverage:** End-to-end tracking verification

---

## Implementation Order

1. **Phase 1:** Type system updates (types/campaign.ts, types/battle.ts)
2. **Phase 2:** Wound-based operative utilities + tests
3. **Phase 7:** Initialize new player fields
4. **Phase 3:** SP spent tracking helper
5. **Phase 6:** Update battle recording with kill details
6. **Phase 4:** Update VICTORY_CATEGORIES data
7. **Phase 5:** Update VictoryScreen for calculated stats
8. **Phase 8:** Unit tests
9. **Phase 9:** Integration tests

**Total Time Estimate:** 6-8 hours

---

## Testing Strategy

### Unit Tests
- ✅ Wound value calculation (0/1/2)
- ✅ Headhunter score calculation
- ✅ Victory category sorting
- ✅ SP spent helper function

### Integration Tests
- ✅ SP spent increments on actions
- ✅ Kill details recorded in battles
- ✅ All 6 categories calculated correctly
- ✅ Victory screen displays all categories

### Manual Testing Checklist
- [ ] Start campaign with 3 players
- [ ] Perform actions that spend SP (search, scout, demolish)
- [ ] Verify `supplyPointsSpent` increments
- [ ] Record battle with operative kills
- [ ] Verify kill details stored
- [ ] End campaign at target threat
- [ ] Verify VictoryScreen shows all 6 categories
- [ ] Verify HEADHUNTER uses wound-based scoring
- [ ] Verify PIONEER shows SP spent, not remaining

---

## Known Limitations

1. **Legacy Battle Records:** Existing battle records without operative kill details will use fallback logic (assume 7-wound operatives)
2. **Backward Compatibility:** Optional fields ensure old save data still works
3. **Tie-Breaking:** Related to Issue #32 (out of scope for this issue)
4. **Live Standings Component:** Deferred to future enhancement (Issue #50 focused on tracking)

---

## Success Criteria

✅ All 6 victory categories properly defined
✅ SP spent tracked cumulatively
✅ Wound-based operative counting implemented
✅ VictoryScreen displays all categories correctly
✅ All 11 acceptance criteria met
✅ 100% test coverage for new utilities
✅ Zero TypeScript errors

**Status:** Ready to implement
