# Ctesiphus Expedition Campaign Manager

A digital campaign manager for the Kill Team Ctesiphus Expedition narrative campaign. This Next.js 16 web application helps 2-6 players track campaigns, manage resources, explore procedurally generated hex maps, and record battle results with full database persistence.

## Features

### ✅ Milestone 1: Core Foundation (Completed)

#### 1. Campaign Setup & Map Configuration
- **Proper Map Sizes**: Map automatically scales based on player count following official rules:
  - 2-3 players: 5×5 hex grid (smaller map for fewer players)
  - 4-5 players: 6×6 hex grid (standard map)
  - 6 players: 7×7 hex grid (larger map for more players)
- **Flexible Campaign Length**: Choose target threat level from 5-10 (default: 7)
- **Game Modes**: Support for both Competitive and Solo/Cooperative modes

#### 2. Threat Level Meter (Visual Enhancement)
- **Visual Progress Bar**: Animated threat meter showing current and target threat levels
- **Descriptive Labels**: Each threat level has a name (Dormant → Stirring → Alert → Active → Hostile → Aggressive → Awakened → Enraged → Cataclysmic → Apocalyptic)
- **Current Level Indicator**: Glowing animated marker on current threat level
- **Target Marker**: Clear 🎯 indicator showing campaign end goal
- **Solo/Co-op Badge**: Visual indication when playing in solo or cooperative mode

#### 3. Campaign Log & Player Tracking
- **SP/CP Enforcement**: 
  - Supply Points (SP) are strictly enforced between 0 and 10
  - Warning messages when trying to exceed limits
  - Better error messages showing available vs required SP
- **Complete History Tracking**: Every SP and CP change is recorded with:
  - Round number and phase
  - Timestamp
  - Before and after values
  - Reason for change (movement, exploration, battle, etc.)
- **Recent Activity Display**:
  - Expandable history section in each player card
  - Shows last 5 actions with visual indicators
  - Color-coded positive (green) and negative (red) changes
  - Compact, easy-to-read format

### Current Features

#### Hex Map
- Interactive hexagonal grid using Phaser 3
- Two zone types: Surface (ice) and Tomb (Necron structures)
- Procedural D36 exploration system
- 72 unique locations (36 surface, 36 tomb)
- 72 unique conditions affecting gameplay

#### Resource Management
- Supply Points (SP): 0-10, used for actions and movement
- Campaign Points (CP): Victory points earned through exploration and battles
- Automatic SP/CP tracking with history
- Visual progress bars and statistics

#### Campaign Phases
1. **Movement Phase**: Move kill teams across the hex map (costs SP based on distance)
2. **Battle Phase**: Record battle results (Win/Draw/Loss/Bye) with rewards
3. **Action Phase**: Choose from 5 action types:
   - Scout: Explore distant hexes (costs 1 SP per hex distance)
   - Resupply: Gain SP based on location (10 at base, D3+3 at camp, 1 elsewhere)
   - Search: Find additional resources at special locations
   - Encamp: Build a camp (costs SP equal to distance from nearest base/camp)
   - Demolish: Destroy opponent's base/camp (requires battle victory)
4. **Threat Phase**: Automatic threat level increase each round

#### Player Management
- Support for 2-6 players
- Customizable player and kill team names
- Track position, hexes explored, games won/lost, operatives killed
- Base and camp management
- Color-coded player identification

#### Victory Conditions
- Campaign ends when threat level reaches target
- Multiple victory categories:
  - **Warlord**: Most Campaign Points
  - **Explorer**: Most Hexes Explored
  - **Headhunter**: Most Operatives Killed
  - **Pioneer**: Most Supply Points Remaining
  - **Trooper**: Most Games Played

## Technology Stack

- **Next.js 16.1.0**: React framework with App Router and Turbopack
- **React 19**: Modern React with hooks and concurrent features
- **TypeScript**: Strict mode enabled for full type safety
- **Phaser 3**: WebGL-powered hex map rendering with sprite-based tiles
- **Zustand**: Lightweight state management
- **PostgreSQL**: Database with connection pooling
- **Drizzle ORM**: Type-safe database toolkit
- **NextAuth.js**: Authentication and session management
- **Vitest**: Fast unit testing framework
- **React Testing Library**: Component testing
- **Playwright**: End-to-end testing
- **Bun**: Fast JavaScript runtime and package manager

## Getting Started

### Prerequisites
- **Bun 1.0+** (recommended) or Node.js 18+
- PostgreSQL database (local or hosted - see [Database Setup](#database-setup))

### Installation

```bash
# Clone the repository
git clone https://github.com/migueog/text_adventure.git
cd text_adventure

# Install dependencies
bun install

# Set up database (see Database Setup section below)
cp .env.example .env
# Edit .env and add your DATABASE_URL and NEXTAUTH_SECRET
bun run db:test      # Test connection
bun run db:push      # Apply schema

# Start development server
bun run dev          # Runs on http://localhost:3000

# Run tests
bun test             # Watch mode
bun run test:run     # Run once
bun run test:coverage # With coverage report

# Build for production
bun run build

# Start production server
bun start
```

**Note:** While the app works with npm/pnpm, **bun is strongly recommended** for faster install times and better performance.

### Database Setup

This application requires a PostgreSQL database. Choose one of these options:

1. **Neon (Recommended for Vercel/Serverless)**
   - Free tier: 10 GB storage, unlimited queries
   - Sign up at [neon.tech](https://neon.tech)
   - Best for production deployments

2. **Supabase (Good for extra features)**
   - Free tier: 500 MB database
   - Includes auth, storage, realtime
   - Sign up at [supabase.com](https://supabase.com)

3. **Local PostgreSQL**
   - Install PostgreSQL on your machine
   - Good for offline development

4. **Railway**
   - $5 credit/month
   - Can host both app and database

**Quick Setup:**
```bash
# 1. Choose a provider and create a database
# 2. Copy connection string to .env.local
echo "DATABASE_URL=postgresql://user:pass@host:5432/dbname" > .env.local
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local

# 3. Test connection
bun run db:test

# 4. Apply schema
bun run db:push
```

📖 **Full documentation**: See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed setup instructions, team onboarding, and troubleshooting.

### Database Commands

| Command | Description |
|---------|-------------|
| `bun run db:test` | Test database connection |
| `bun run db:push` | Push schema to database |
| `bun run db:generate` | Generate new migration |
| `bun run db:studio` | Open Drizzle Studio (visual browser) |

### Usage

1. **Setup**: Choose player count (2-6), campaign length (threat level), and game mode
2. **Enter Player Names**: Customize names for each player and their kill teams
3. **Play Campaign**: Follow the phase system - Movement → Battle → Action → Threat
4. **Track Progress**: Watch the threat meter rise as rounds progress
5. **View History**: Expand player cards to see recent activity and resource changes
6. **Victory**: When threat reaches target, see who won in each category!

## Project Structure

```
text_adventure/
├── app/                       # Next.js App Router
│   ├── page.tsx              # Main game page (client-side)
│   ├── layout.tsx            # Root layout with providers
│   ├── auth/                 # Authentication pages
│   ├── api/                  # API routes
│   │   ├── campaigns/        # Campaign CRUD operations
│   │   ├── auth/             # NextAuth.js endpoints
│   │   └── user/             # User profile endpoints
│   └── globals.css           # Global styles
│
├── components/                # React components (all TypeScript)
│   ├── AuthProvider.tsx      # Auth context provider
│   ├── ThreatMeter.tsx       # Animated threat level meter
│   ├── PlayerPanel.tsx       # Player cards with history
│   ├── PhaseTracker.tsx      # Phase management UI
│   ├── PhaserHexMap/         # Phaser 3 hex map renderer
│   │   ├── index.tsx         # React wrapper component
│   │   └── HexMapScene.ts    # Phaser scene with sprite rendering
│   ├── GameSetup.tsx         # Campaign setup form
│   ├── VictoryScreen.tsx     # End game results
│   ├── DiceRoller.tsx        # D36 dice roller
│   ├── EventLog.tsx          # Action history log
│   ├── HexDetails.tsx        # Hex information panel
│   ├── CampaignList.tsx      # Campaign selection
│   └── UserMenu.tsx          # User navigation menu
│
├── hooks/                     # Custom React hooks
│   ├── useCampaign.ts        # Main composed campaign hook
│   ├── useCampaignRole.ts    # User role checking
│   └── campaign/             # Specialized phase hooks
│       ├── useMovementPhase.ts
│       ├── useActionPhase.ts
│       ├── useBattlePhase.ts
│       ├── useThreatPhase.ts
│       └── ...               # 10+ hooks total
│
├── lib/                       # Shared libraries
│   ├── stores/               # Zustand state management
│   │   ├── campaign.ts       # Main campaign store
│   │   └── auth.ts           # Auth store
│   ├── db/                   # Database module (Drizzle ORM)
│   │   ├── schema.ts         # Database schema
│   │   ├── client.ts         # Connection pool
│   │   └── README.md         # DB documentation
│   ├── utils/                # Utility functions (all tested)
│   │   ├── dice.ts           # D36 dice rolling
│   │   ├── hexUtils.ts       # Hex grid calculations
│   │   ├── threatPhaseRules.ts
│   │   └── ...
│   └── data/
│       └── campaignData.ts   # Game data (72 locations, 72 conditions)
│
├── types/                     # TypeScript type definitions
│   ├── campaign.ts           # Core game types
│   └── battle.ts             # Battle and operative types
│
├── public/                    # Static assets
│   └── assets/hexes/         # Hex tile sprites (Kenney.nl CC0)
│
├── .github/
│   ├── copilot-instructions.md # Development standards
│   ├── instructions/         # Code-specific guidelines
│   └── issues/               # 40+ detailed feature specs
│
├── docs/archive/              # Historical documentation
├── CLAUDE.md                  # AI development guidelines
├── KNOWN_ISSUES.md            # Active known issues
├── DATABASE_SETUP.md          # Database setup guide
├── TESTING.md                 # Testing standards
├── tsconfig.json              # TypeScript strict mode config
├── vitest.config.js           # Test configuration
└── next.config.mjs            # Next.js configuration
```

## Documentation

This project has comprehensive documentation to help you get started:

### For New Team Members
- **[TEAM_ONBOARDING.md](./TEAM_ONBOARDING.md)** - Quick start guide for new contributors
- **[DATABASE_COMMANDS.md](./DATABASE_COMMANDS.md)** - Quick reference for database commands
- **[CLAUDE.md](./CLAUDE.md)** - AI development guidelines and project overview

### Database Setup & Management
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Complete database setup guide
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database schema reference
- **[lib/db/README.md](./lib/db/README.md)** - Database module documentation

### Development & Troubleshooting
- **[TESTING.md](./TESTING.md)** - Testing standards and best practices
- **[KNOWN_ISSUES.md](./KNOWN_ISSUES.md)** - Active known issues and workarounds
- **[MIGRATION_STATUS.md](./MIGRATION_STATUS.md)** - Technical migration notes
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Development standards

### Project Planning & History
- **[FUTURE_FEATURES.md](./FUTURE_FEATURES.md)** - Planned features and roadmap
- **[.github/issues/](.github/issues/)** - Detailed issue specifications
- **[docs/archive/](./docs/archive/)** - Historical completion reports and summaries

## Development Standards

This project follows strict development standards for code quality and maintainability:

### Test-Driven Development (TDD)
- **ALL new features require tests before implementation**
- Coverage target: 85-90% for business logic
- Use Vitest with React Testing Library
- Run tests: `bun test` (watch mode) or `bun run test:coverage`

### TypeScript
- **Strict mode enabled** - zero TypeScript errors before completion
- All files use TypeScript (.ts/.tsx)
- No `any` types - use proper types or `unknown`
- Define interfaces for all data structures in `types/`

### Code Quality
- **Function size limit**: 10-20 lines per function
- Add JSDoc comments with "WHY" explanations
- Comment "WHY", not "WHAT"
- Each function should do ONE thing
- Extract complex logic into tested utility functions

### Package Manager
- **Use bun** for all commands (not npm/pnpm)
- Faster installs and better performance
- Compatible with npm scripts

See [CLAUDE.md](./CLAUDE.md) or [.github/copilot-instructions.md](.github/copilot-instructions.md) for complete development standards.

## Roadmap

See [FUTURE_FEATURES.md](FUTURE_FEATURES.md) for planned enhancements and [.github/issues/SUMMARY.md](.github/issues/SUMMARY.md) for detailed implementation tracking.

### Upcoming Milestones

- **Milestone 2**: Movement & Exploration Phase enhancements
- **Milestone 3**: Battle & Action Phase completion
- **Milestone 4**: Threat & Victory systems
- **Milestone 5**: Enhanced features and polish
- **Milestone 6**: Solo/Cooperative mode
- **Milestone 7**: Advanced features

## Contributing

This is a personal project for managing Kill Team campaigns. Issues and feature requests are tracked in `.github/issues/`.

## License

This project is for personal use. Kill Team and all related content are property of Games Workshop.

## Acknowledgments

- Based on the Kill Team Ctesiphus Expedition campaign rules
- Built with Phaser 3 for hex map rendering
- Inspired by classic tabletop campaign management
