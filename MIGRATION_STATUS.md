# Next.js Migration Status

## ✅ Completed

### Infrastructure Setup
- ✅ Next.js 16.1.0 installed and configured
- ✅ TypeScript configuration updated for Next.js App Router
- ✅ Turbopack configuration added (Next.js 16 default)
- ✅ App Router directory structure created (`app/`, `components/`, `lib/`, `types/`, `hooks/`)
- ✅ Root layout (`app/layout.tsx`) with metadata
- ✅ Home page (`app/page.tsx`) as client component
- ✅ Global styles migrated (`app/globals.css`)
- ✅ `.gitignore` updated for Next.js
- ✅ Package.json scripts updated

### Code Migration
- ✅ Utilities migrated to TypeScript:
  - `lib/utils/dice.ts` - All dice rolling functions
  - `lib/utils/hexUtils.ts` - Hex grid calculations
- ✅ Data migrated to TypeScript:
  - `lib/data/campaignData.ts` - All game data (locations, conditions, configs)
- ✅ Type definitions created:
  - `types/campaign.ts` - Comprehensive TypeScript interfaces
- ✅ Testing infrastructure updated:
  - Vitest configuration for Next.js
  - Test setup file migrated
  - Path aliases configured (`@/`)
  - All utility tests passing (51 tests)

### Component Stubs Created
- ✅ All components have placeholder implementations
- ✅ Next.js dev server runs successfully
- ✅ TypeScript compilation works

### Issue #58: Complete Exploration Data (D36 System)
- ✅ Phase 1: Type system foundation (7 Location properties, 5 Condition properties, HexState interface)
- ✅ Phase 2: Data validation utilities (validateLocationData, validateLocationCoverage, validateConditionCoverage)
- ✅ Phase 3: Re-roll system for duplicates (getExploredLocationIds, rollWithRerolls, rollConditionWithRerolls)
- ✅ Phase 4: All 18 surface locations with D36 structure (repeatable 11-16, unique 21-36)
- ✅ Phase 5: All 18 tomb locations with D36 structure
- ✅ Phase 6: All 72 conditions (36 surface + 36 tomb) with D36 structure
- ✅ Phase 7: Hook integration (exploreHex updated with re-roll logic and hex state)
- ⏭️  Phase 8: UI component updates (deferred - will update when special mechanics implemented)
- ✅ Phase 9: End-to-end testing (50/50 tests passing for Issue #58)
- ✅ Phase 10: Documentation complete

**Test Coverage:** 50 tests (all passing)
- 16 tests: dataValidation.test.ts
- 16 tests: explorationUtils.test.ts
- 18 tests: campaignData.test.ts

**Key Accomplishments:**
- Fixed D36 misunderstanding (18 valid values, not 26)
- Repeatable locations/conditions (11-16) allow duplicates
- Unique locations/conditions (21-36) trigger automatic re-rolls
- Hex state tracking for special mechanics (Abandoned Camp, Intelligence Cache, etc.)
- Foundation for complex special mechanics (deferred to Issue #40)

## 🚧 Remaining Work

### Priority 1: Core Hook Migration
The `useCampaign` hook is the heart of the application and needs full migration:

**Source:** `src/hooks/useCampaign.js` → **Target:** `hooks/useCampaign.ts`

**Current Status:** Stub only
**Dependencies:** campaignData, dice utilities, hexUtils
**Lines:** ~630 lines
**Estimated Effort:** 2-3 hours

**Key Functions to Migrate:**
- State initialization
- Game setup logic
- Player management
- Hex exploration
- Movement system
- Battle recording
- Action system
- Phase management
- Event logging

### Priority 2: Simple Component Migration
These components are relatively small and self-contained:

1. **DiceRoller** (`src/components/DiceRoller.jsx` → `components/DiceRoller.tsx`)
   - Lines: ~80
   - Dependencies: dice utils
   - Estimated: 30 min

2. **EventLog** (`src/components/EventLog.jsx` → `components/EventLog.tsx`)
   - Lines: ~50
   - Dependencies: Event types
   - Estimated: 20 min

3. **HexDetails** (`src/components/HexDetails.jsx` → `components/HexDetails.tsx`)
   - Lines: ~120
   - Dependencies: campaignData, types
   - Estimated: 45 min

4. **ThreatMeter** (`src/components/ThreatMeter.jsx` + `.css` → `components/ThreatMeter.tsx`)
   - Lines: ~100
   - Dependencies: campaignData
   - Estimated: 30 min

### Priority 3: Form Component Migration
More complex components with forms and interactions:

1. **GameSetup** (`src/components/GameSetup.jsx` → `components/GameSetup.tsx`)
   - Lines: ~180
   - Dependencies: campaignData, types
   - Estimated: 1 hour

2. **VictoryScreen** (`src/components/VictoryScreen.jsx` → `components/VictoryScreen.tsx`)
   - Lines: ~150
   - Dependencies: campaignData, types
   - Estimated: 45 min

3. **PlayerPanel** (`src/components/PlayerPanel.jsx` → `components/PlayerPanel.tsx`)
   - Lines: ~200
   - Dependencies: types
   - Estimated: 1 hour

4. **PhaseTracker** (`src/components/PhaseTracker.jsx` → `components/PhaseTracker.tsx`)
   - Lines: ~350 (largest component)
   - Dependencies: campaignData, hexUtils, types
   - Estimated: 2 hours

### Priority 4: Phaser Component Migration
Special handling required - must be client-side only:

1. **PhaserHexMap** (`src/components/PhaserHexMap/index.jsx` → `components/PhaserHexMap/index.tsx`)
   - Lines: ~120
   - Dependencies: Phaser, HexMapScene
   - Needs: 'use client' directive
   - Estimated: 1 hour

2. **HexMapScene** (`src/components/PhaserHexMap/HexMapScene.js` → `components/PhaserHexMap/HexMapScene.ts`)
   - Lines: ~400
   - Dependencies: Phaser
   - Complex: Canvas rendering logic
   - Estimated: 2 hours

### Priority 5: Testing Updates
- Update/create tests for migrated components
- Ensure all tests pass
- Test coverage for new TypeScript code
- Estimated: 2-3 hours

### Priority 6: Cleanup & Documentation
- Remove old `src/` directory
- Remove Vite configuration files
- Remove `index.html`
- Update README.md
- Update other documentation
- Estimated: 1 hour

## Total Remaining Effort Estimate
**13-15 hours** of focused development work

## Migration Strategy

### Recommended Order:
1. **useCampaign hook** (blocks everything else)
2. **Simple components** (can be done in parallel)
3. **Form components** (depends on useCampaign)
4. **Phaser components** (can be done independently)
5. **Testing & validation**
6. **Cleanup & documentation**

### Testing Strategy:
- Test each component as it's migrated
- Use the dev server to verify visual appearance
- Run test suite after each major component
- Do full integration test before final commit

## Notes

### What's Working:
- ✅ Next.js dev server starts successfully
- ✅ TypeScript compilation works
- ✅ Hot module replacement works
- ✅ All utility functions and tests pass
- ✅ App routing structure is correct

### Known Issues to Address:
- ⚠️ Components are currently stubs
- ⚠️ useCampaign hook needs full implementation
- ⚠️ Phaser integration needs testing
- ⚠️ Component tests need updating for new structure

### Technical Decisions Made:
- Using Next.js 16.1.0 (latest) with Turbopack
- TypeScript strict mode enabled
- Client-side rendering for game components ('use client')
- Path aliases configured (@/ points to root)
- Vitest for testing (kept from original)
- Drizzle ORM configuration preserved

### Files That Don't Need Migration:
- `lib/db/**` - Already TypeScript, database setup
- `drizzle.config.ts` - Already correct
- `.github/**` - Instructions and configurations
- Various markdown docs - Keep as-is

## Quick Start for Continuing

To continue the migration:

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
# Opens at http://localhost:3000

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Migration Workflow:
1. Copy component from `src/components/ComponentName.jsx`
2. Rename to `components/ComponentName.tsx`
3. Add 'use client' directive at top
4. Convert to TypeScript (add types)
5. Update imports to use `@/` path alias
6. Test in dev server
7. Update/create tests
8. Commit

### Example Migration:
```typescript
// src/components/DiceRoller.jsx
import React from 'react';
import { rollD3 } from '../utils/dice';

export default function DiceRoller() {
  // ...
}
```

Becomes:

```typescript
// components/DiceRoller.tsx
'use client'

import React from 'react'
import { rollD3 } from '@/lib/utils/dice'

export default function DiceRoller() {
  // ...
}
```
