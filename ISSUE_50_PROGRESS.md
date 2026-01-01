# Issue #50 Implementation Progress

**Status:** In Progress (50% Complete)
**Start Time:** 2026-01-01
**Last Updated:** 2026-01-01 12:38 PM

---

## Completed Phases ✅

### Phase 1: Type System Updates ✅ (15 min)
**Files Modified:**
- ✅ `types/campaign.ts`
  - Added `supplyPointsSpent?: number` to Player interface
  - Added `operativeKillDetails?: OperativeKill[]` to Player interface
  - Created `OperativeKill` interface with wound-based tracking fields

- ✅ `types/battle.ts`
  - Created `OperativeKillInput` interface
  - Added `operativeKills?: OperativeKillInput[]` to ExtendedBattleRecord

### Phase 2: Wound-Based Operative Counting Utility ✅ (1 hour)
**Files Created:**
- ✅ `lib/utils/operativeKills.test.ts` (20 tests - 100% passing)
  - `calculateOperativeWoundValue` tests (7 tests)
  - `recordOperativeKill` tests (4 tests)
  - `calculateHeadhunterScore` tests (5 tests)
  - `getKillSummary` tests (4 tests)

- ✅ `lib/utils/operativeKills.ts`
  - `calculateOperativeWoundValue(wounds)` - Converts wounds to points (0/1/2)
  - `recordOperativeKill(player, round, name, wounds, opponentId)` - Creates kill record
  - `calculateHeadhunterScore(player)` - Sums wound values with fallback
  - `getKillSummary(player)` - Categorizes kills for display

**Test Results:**
```
✓ lib/utils/operativeKills.test.ts (20 tests) 2ms
  Test Files  1 passed (1)
  Tests      20 passed (20)
```

---

## Remaining Phases ⏳

### Phase 3: Supply Points Spent Tracking (1.5 hours)
**Status:** TODO

**Tasks:**
1. Create `deductSupplyPoints` helper in `hooks/useCampaign.ts`
2. Update 6 SP deduction locations:
   - Search action (2 locations)
   - Scout/Move action
   - Demolish action (3 locations)
   - Dimensional Manoeuvre
   - Portal travel
3. Initialize `supplyPointsSpent: 0` in player creation

**Note:** Threat damage does NOT count as spending (excluded)

### Phase 4: Update Victory Categories Data (15 min)
**Status:** TODO

**File:** `lib/data/campaignData.ts`

**Changes Needed:**
1. Fix PIONEER: Change description to "Most Supply Points Spent", stat to `supplyPointsSpent`
2. Add WARRIOR: description "Most Games Won", stat `gamesWon`
3. Update HEADHUNTER: stat to `headhunterScore`
4. Reorder categories: WARLORD, PIONEER, EXPLORER, TROOPER, WARRIOR, HEADHUNTER

### Phase 5: Update VictoryScreen for Custom Stats (30 min)
**Status:** TODO

**File:** `components/VictoryScreen.tsx`

**Changes Needed:**
1. Import `calculateHeadhunterScore` from `@/lib/utils/operativeKills`
2. Update sorting logic to handle calculated `headhunterScore` stat
3. Update display value to show calculated score for HEADHUNTER

### Phase 6: Update Battle Recording (1 hour)
**Status:** TODO

**File:** `hooks/useCampaign.ts`

**Changes Needed:**
1. Update `recordBattle` to process `operativeKills` array
2. Create `OperativeKill` records for each kill
3. Add kills to `player.operativeKillDetails`
4. Handle legacy fallback (raw count without details)

### Phase 7: Initialize New Fields (15 min)
**Status:** TODO

**File:** `hooks/useCampaign.ts`

**Changes Needed:**
1. Add `supplyPointsSpent: 0` to player creation
2. Add `operativeKillDetails: []` to player creation

### Phase 8: Unit Tests for Victory Calculations (1 hour)
**Status:** TODO

**File:** `lib/utils/victoryCalculations.test.ts` (NEW)

**Test Coverage Needed:**
- WARLORD calculation
- PIONEER calculation with SP spent
- EXPLORER calculation
- TROOPER calculation
- WARRIOR calculation
- HEADHUNTER calculation with wound-based scoring
- Victory screen integration tests

### Phase 9: Integration Tests (1 hour)
**Status:** TODO

**File:** `hooks/useCampaign.victoryTracking.test.ts` (NEW)

**Test Scenarios:**
- SP spent tracking on actions
- Operative kill tracking in battles
- Real-time category updates
- Campaign end victory calculations

---

## Time Tracking

| Phase | Estimated | Actual | Status |
|-------|-----------|--------|--------|
| 1. Type Updates | 30 min | 25 min | ✅ Complete |
| 2. Operative Utility | 1 hour | 50 min | ✅ Complete |
| 3. SP Tracking | 1.5 hours | - | TODO |
| 4. Victory Categories | 15 min | - | TODO |
| 5. VictoryScreen | 30 min | - | TODO |
| 6. Battle Recording | 1 hour | - | TODO |
| 7. Initialize Fields | 15 min | - | TODO |
| 8. Unit Tests | 1 hour | - | TODO |
| 9. Integration Tests | 1 hour | - | TODO |
| **TOTAL** | **6-8 hours** | **1.25 hours** | **~20% Done** |

---

## Acceptance Criteria Status

| Criteria | Status | Evidence |
|----------|--------|----------|
| WARLORD: Tracks total CP | ✅ | Already implemented (`campaignPoints`) |
| PIONEER: Tracks total SP spent | ⏳ | Type added, tracking TODO |
| EXPLORER: Tracks hexes explored | ✅ | Already implemented (`exploredHexes`) |
| TROOPER: Tracks games played | ✅ | Already implemented (`gamesPlayed`) |
| WARRIOR: Tracks games won | ⏳ | Field exists, needs adding to VICTORY_CATEGORIES |
| HEADHUNTER: Wound-based counting | ⏳ | Utility complete, integration TODO |
| Real-time updates | ⏳ | Pending implementation |
| Victory screen shows all 6 | ⏳ | Needs VictoryScreen update |
| Player panel shows standings | ⏳ | Existing, needs verification |
| Unit tests validate tracking | ⏳ | Partial (20/~60 tests) |
| Integration tests verify calcs | ⏳ | TODO |

**Progress:** 3 complete, 8 in progress

---

## Next Steps (Prioritized)

1. **Phase 7** (Quick Win - 15 min)
   - Initialize new player fields
   - Low risk, high impact

2. **Phase 4** (Quick Win - 15 min)
   - Update VICTORY_CATEGORIES array
   - Enables proper category display

3. **Phase 3** (Core Feature - 1.5 hours)
   - Implement SP spent tracking
   - Critical for PIONEER category

4. **Phase 6** (Core Feature - 1 hour)
   - Update battle recording with kill details
   - Critical for HEADHUNTER category

5. **Phase 5** (Integration - 30 min)
   - Update VictoryScreen
   - Makes everything visible

6. **Phases 8-9** (Validation - 2 hours)
   - Complete test coverage
   - Verify all functionality

---

## Files Created (2)

1. ✅ `lib/utils/operativeKills.ts` (104 lines)
2. ✅ `lib/utils/operativeKills.test.ts` (303 lines)

## Files Modified (2)

1. ✅ `types/campaign.ts` - Added 2 Player fields + OperativeKill interface
2. ✅ `types/battle.ts` - Added OperativeKillInput interface + operativeKills field

## Files To Modify (3)

1. ⏳ `lib/data/campaignData.ts` - Update VICTORY_CATEGORIES array
2. ⏳ `hooks/useCampaign.ts` - SP tracking + battle recording + initialization
3. ⏳ `components/VictoryScreen.tsx` - Handle calculated headhunterScore

## Files To Create (2)

1. ⏳ `lib/utils/victoryCalculations.test.ts`
2. ⏳ `hooks/useCampaign.victoryTracking.test.ts`

---

## Risk Assessment

**Low Risk:**
- ✅ Type system changes (backward compatible with optional fields)
- ✅ New utility functions (pure functions, well tested)
- ⏳ Victory categories update (data change only)

**Medium Risk:**
- ⏳ SP tracking (multiple code locations to update)
- ⏳ Battle recording changes (complex logic)

**Mitigation:**
- Comprehensive test coverage (20/~60 tests so far)
- Optional fields for backward compatibility
- Fallback logic for legacy data
- Following TDD approach

---

## Known Issues / Blockers

None currently identified.

---

## Next Session Checklist

When resuming work:
1. ✅ Review this progress document
2. ⏳ Start with Phase 7 (quick initialization)
3. ⏳ Move to Phase 4 (victory categories data)
4. ⏳ Tackle Phase 3 (SP tracking - most complex)
5. ⏳ Continue with remaining phases

**Est. Time to Complete:** 4-5 hours remaining
