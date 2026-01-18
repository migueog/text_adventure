# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ctesiphus Expedition Campaign Manager** - A digital campaign manager for the Kill Team Ctesiphus Expedition narrative campaign (Games Workshop tabletop game). This Next.js web application helps 2-6 players track campaigns, manage resources, explore procedurally generated hex maps, and record battle results.

**Current Status:** Next.js 16.1.0 migration ~95% complete. Application is fully functional with working game loop, Phaser 3 hex map rendering, and PostgreSQL database integration. Minor UI rendering issues remain (see KNOWN_ISSUES.md).

## Tech Stack

- **Framework:** Next.js 16.1.0 (App Router) with Turbopack
- **Frontend:** React 19, TypeScript (strict mode)
- **Rendering:** Phaser 3 for hex map visualization (WebGL)
- **Database:** Drizzle ORM with PostgreSQL (configured, not in active use)
- **Testing:** Vitest + React Testing Library
- **Package Manager:** bun (REQUIRED - always use bun, not npm)

## Essential Commands

**IMPORTANT:** Always use `bun` for all commands, never `npm`.

### Development
```bash
bun run dev              # Start Next.js dev server (http://localhost:3000)
bun run build            # Production build with Turbopack
bun start                # Start production server
```

### Testing
```bash
bun test                 # Run tests in watch mode
bun run test:run         # Run tests once
bun run test:coverage    # Run tests with coverage report
bun run test:ui          # Open Vitest UI
```

### Database (Drizzle ORM)
```bash
bun run db:generate      # Generate migrations
bun run db:push          # Push schema to database
bun run db:studio        # Open Drizzle Studio
```

### Type Checking
```bash
bunx tsc --noEmit        # Check TypeScript without building
```

**IMPORTANT:** Do NOT use `timeout` command in bash - it's not available on macOS. Use commands directly without timeout wrappers.

## High-Level Architecture

### Game System
- **Players:** 2-6 players per campaign
- **Threat Levels:** 1-10 (campaign ends at target threat level)
- **Phases:** Movement → Battle → Action → Threat (strict order)
- **Resources:** Supply Points (SP: 0-10), Campaign Points (CP: victory points)
- **Hex Map:** Dynamically sized (5x5 to 7x7) based on player count
- **Exploration:** D36 (3d6) system with 72 locations and 72 conditions

### State Management
All game state is managed client-side via Zustand stores and custom hooks (no server-side state).
- **Main Hook:** `hooks/useCampaign.ts` - Composed hook orchestrating 10+ specialized hooks
- **Specialized Hooks:** Movement phase, action phase, battle phase, threat phase, exploration, etc.
- **Zustand Store:** `lib/stores/campaign.ts` - Centralized state management
- **State includes:** players, hex map, threat level, phase tracking, event log, bases/camps
- **Persistence:** Campaign state syncs with PostgreSQL database via API routes

### Component Architecture
- **Client Components:** All components use `'use client'` directive (game runs in browser)
- **Phaser Integration:** `PhaserHexMap` components handle canvas rendering (no SSR)
- **Event System:** `EventLog` tracks all player actions with history
- **Phase Management:** `PhaseTracker` enforces strict phase order

### Data Flow
1. Game data (locations, conditions, configs) is read-only in `lib/data/campaignData.ts`
2. Utilities (`lib/utils/`) provide pure functions for dice, hex calculations
3. Components consume state from `useCampaign` hook and dispatch actions
4. All state changes are logged to event history

### File Structure
```
text_adventure/
├── app/                     # Next.js App Router
│   ├── page.tsx            # Main game component (client-side)
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles (1335 lines)
│
├── components/             # React components (all client-side)
│   ├── GameSetup.tsx              # Campaign setup form
│   ├── PlayerPanel.tsx            # Player cards with history
│   ├── PhaseTracker.tsx           # Phase management UI
│   ├── PhaserHexMap/              # Hex map rendering (Phaser 3)
│   ├── ThreatMeter.tsx            # Visual threat level meter
│   ├── DiceRoller.tsx             # D36 dice roller
│   ├── EventLog.tsx               # Action history display
│   ├── HexDetails.tsx             # Hex information panel
│   └── VictoryScreen.tsx          # End-game results
│
├── hooks/
│   ├── useCampaign.ts           # Main composed campaign hook
│   └── campaign/                # Specialized phase hooks
│       ├── useMovementPhase.ts  # Movement logic
│       ├── useActionPhase.ts    # Action phase logic
│       └── ...                  # Other phase hooks
│
├── lib/
│   ├── data/
│   │   └── campaignData.ts # Game data (72 locations, 72 conditions, configs)
│   ├── utils/              # Utilities (all tested, all TypeScript)
│   │   ├── dice.ts         # D36 dice rolling
│   │   └── hexUtils.ts     # Hex grid calculations
│   ├── db/                 # Database config (Drizzle ORM)
│   └── test/               # Test setup
│
├── types/
│   └── campaign.ts         # TypeScript interfaces (Campaign, Player, Hex, Event)
│
└── .github/
    ├── copilot-instructions.md         # Development standards
    ├── instructions/                   # Code-specific guidelines
    └── issues/                         # 40+ detailed feature specs
```

## Migration Status

**✅ Completed (~95%):**
- ✅ Next.js 16.1.0 App Router infrastructure with Turbopack
- ✅ TypeScript migration (strict mode enabled, production build passing)
- ✅ All utilities and data files migrated to TypeScript
- ✅ Test infrastructure (Vitest + React Testing Library + Playwright)
- ✅ All React components migrated and functional
- ✅ useCampaign hook refactored into 10+ specialized hooks
- ✅ Zustand store integration for state management
- ✅ PostgreSQL database with Drizzle ORM
- ✅ API routes for campaign persistence
- ✅ Authentication system (NextAuth.js)
- ✅ Phaser 3 hex map rendering with sprite-based tiles
- ✅ Click interaction and hex selection working
- ✅ Full game loop functional (Movement → Battle → Action → Threat)

**🚧 Known Issues:**
- Phaser texture rendering on initial page load (green wireframes, fixed on click)
- See `KNOWN_ISSUES.md` for details and workarounds

**📖 Documentation:**
- Migration history archived in `docs/archive/`
- See `MIGRATION_STATUS.md` for detailed technical notes

## MANDATORY Development Standards

### 1. Test-Driven Development (TDD)
**NO EXCEPTIONS** - Write tests FIRST before any implementation:
1. Write test file (.test.ts/.test.tsx)
2. Define test cases (happy path + edge cases)
3. Run tests and confirm they FAIL
4. Write minimal implementation to pass
5. Refactor while keeping tests green

**Coverage Requirements:**
- Business logic: 85-90%
- Utilities: 100% expected
- Components: Focus on user interactions

### 2. TypeScript Strict Mode
- **Zero TypeScript errors allowed** before completing tasks
- Never use `any` type - use proper types or `unknown`
- Define interfaces for ALL data structures
- Add type annotations to ALL functions (including return types)
- All types in `types/campaign.ts` are comprehensive

### 3. Function Size Limit
- **Maximum 10-20 lines per function**
- If function exceeds 20 lines, split into smaller functions
- Each function should do ONE thing
- Extract complex logic into helper functions

### 4. Code Comments
- Explain "WHY", not "WHAT"
- Document business logic decisions
- Add JSDoc comments to exported functions
- Explain complex algorithms

### 5. Architecture
- Start simple, refactor when needed
- No premature optimization
- Prefer composition over inheritance
- Extract reusable logic into utilities

## Testing Standards

### Test Structure
```typescript
describe('ComponentName or functionName', () => {
  describe('when condition', () => {
    it('should expected behavior', () => {
      // Arrange
      const input = ...

      // Act
      const result = functionUnderTest(input)

      // Assert
      expect(result).toBe(expected)
    })
  })
})
```

### Testing Patterns
- Use React Testing Library for components
- Use `userEvent` for interactions (not `fireEvent`)
- Query by accessible roles, not test IDs
- Mock external dependencies ONLY
- Test user-facing behavior, not implementation details

### Running Tests
```bash
npm test                # Watch mode (recommended during development)
npm run test:run        # Run once
npm run test:coverage   # With coverage report
```

## Code Style

### TypeScript
```typescript
// Always include return type
function processData(input: string): ProcessedResult {
  // implementation
}

// React component with typed props
interface ComponentProps {
  name: string
  onAction: (id: number) => void
}

export default function Component({ name, onAction }: ComponentProps) {
  // implementation
}
```

### Conventions
- **camelCase:** variables, functions
- **PascalCase:** classes, interfaces, types, components
- **UPPER_CASE:** constants
- ES6+ features: const/let, arrow functions, destructuring
- Async/await exclusively (no callbacks)
- Functional patterns where appropriate

## Path Aliases

- `@/` points to project root
- Example: `import { dice } from '@/lib/utils/dice'`

## Important Files

### Documentation
- `README.md` - Feature overview, getting started
- `MIGRATION_STATUS.md` - Technical migration notes and roadmap
- `KNOWN_ISSUES.md` - Active known issues and workarounds
- `TESTING.md` - Test standards and practices
- `DATABASE_SCHEMA.md` - Database design and schema
- `TEAM_ONBOARDING.md` - Quick start guide for contributors
- `docs/archive/` - Historical completion reports and summaries

### Configuration
- `tsconfig.json` - TypeScript strict mode config
- `vitest.config.js` - Test configuration
- `next.config.mjs` - Next.js configuration
- `drizzle.config.ts` - Database configuration

### Data & Types
- `lib/data/campaignData.ts` - 72 locations, 72 conditions, map configs
- `types/campaign.ts` - All TypeScript interfaces

## Critical Implementation Notes

### Phaser Components
- Must use `'use client'` directive
- No server-side rendering for canvas
- Dynamic import recommended for initial load optimization
- See `components/PhaserHexMap/` for examples

### State Updates
- All state changes must be logged to event history
- SP (Supply Points) must be enforced between 0-10
- Phase order must be strictly enforced (Movement → Battle → Action → Threat)

### Game Rules Enforcement
- Map size varies by player count: 2-3: 5×5, 4-5: 6×6, 6: 7×7
- Threat levels range from 1-10
- Campaign ends when threat reaches target level
- D36 system uses 3d6 for all random generation

## Planning and Documentation

### Implementation Plans
- **NEVER create separate markdown plan files** (*.md) in `.claude/plans/` or elsewhere
- When planning implementation for GitHub issues, **edit the GitHub issue directly** using `gh issue comment`
- Add implementation details, phases, and acceptance criteria as comments on the issue itself
- Keep all planning artifacts in GitHub for team visibility

### Documentation Files
- **NEVER proactively create documentation files** unless explicitly requested
- Do not create README files, PLAN files, or other markdown documentation
- Focus on code comments and inline documentation instead
- Use GitHub issues and PR descriptions for feature documentation

## Common Workflows

### Starting a New Feature
1. Read relevant issue in `.github/issues/`
2. Write tests first (TDD mandatory)
3. Implement minimal code to pass tests
4. Ensure zero TypeScript errors
5. Keep functions under 20 lines
6. Add "why" comments

### Running the Application
```bash
npm run dev
# Open http://localhost:3000
# Game state is client-side only
# No database connection needed for basic gameplay
```

### Debugging Runtime Errors
**CRITICAL:** Before asking the user to manually test changes in the browser, ALWAYS check the dev server output for runtime errors.

**How to check:**
1. The dev server runs in background task ID (look for system reminders about "Background bash [ID] has new output")
2. Read the output file: `/tmp/claude/-Users-miguelog-Documents-code-text-adventure/tasks/[TASK_ID].output`
3. Look for:
   - `⚠ Fast Refresh had to perform a full reload due to a runtime error` - indicates runtime error occurred
   - `✓ Compiled` - successful compilation
   - Error messages and stack traces

**Common runtime errors to proactively fix:**
- Null reference errors (`Cannot read properties of null`)
- Type errors (`is not a function`, `is not assignable`)
- Missing null checks on optional properties (e.g., `player.position` when player hasn't been placed)

**Best practice:**
- After making changes, read the dev server output before requesting user testing
- Systematically search for and fix related errors (e.g., if one null check is missing, search for all similar patterns)
- Use `grep` to find all instances of potentially problematic patterns across the codebase

### Working with the Codebase
1. **State Management:** Use Zustand store via `useCampaign` hook
2. **Types:** All interfaces defined in `types/campaign.ts` and `types/battle.ts`
3. **Database:** Use Drizzle ORM via API routes, never direct DB access from client
4. **Testing:** Run `bun test` after changes
5. **Known Issues:** Check `KNOWN_ISSUES.md` before reporting bugs

## Pull Request Standards

### PR Title Format
- Always include issue number: `[#123] Add user authentication`

### PR Description
- Link to issue: `Fixes #123`, `Closes #123`, `Implements #123`
- Reference milestone if applicable
- Include test plan
- List breaking changes

## Pre-Implementation Checklist
1. ✅ Write test file first
2. ✅ Define test cases (happy path + edge cases)
3. ✅ Run tests and confirm they fail
4. ✅ Write implementation
5. ✅ Ensure all TypeScript types are defined
6. ✅ Keep functions under 20 lines
7. ✅ Add "why" comments
8. ✅ Verify zero TypeScript errors
