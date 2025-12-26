# Ctesiphus Expedition Campaign Manager

A digital campaign manager for the Kill Team Ctesiphus Expedition narrative campaign. This React-based web application helps players track their campaigns, manage resources, explore hex maps, and record battle results.

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

- **React 18**: Modern React with hooks
- **Next.js 16**: React framework with SSR/SSG
- **Vite**: Fast build tool and dev server (legacy)
- **Phaser 3**: WebGL-powered hex map rendering
- **CSS3**: Custom styling with CSS variables
- **Vitest**: Testing framework with React Testing Library
- **TypeScript**: Type safety configuration (strict mode enabled)
- **PostgreSQL**: Database with Drizzle ORM
- **Drizzle ORM**: Type-safe database toolkit

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL database (local or hosted - see [Database Setup](#database-setup))

### Installation

```bash
# Clone the repository
git clone https://github.com/migueog/text_adventure.git
cd text_adventure

# Install dependencies
npm install

# Set up database (see Database Setup section below)
cp .env.example .env
# Edit .env and add your DATABASE_URL
npm run db:test      # Test connection
npm run db:migrate   # Apply schema

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Preview production build
npm run preview
```

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
# 2. Copy connection string to .env
echo "DATABASE_URL=postgresql://user:pass@host:5432/dbname" > .env

# 3. Verify setup
npm run db:verify

# 4. Apply schema
npm run db:migrate
```

📖 **Full documentation**: See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed setup instructions, team onboarding, and troubleshooting.

### Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:test` | Test database connection |
| `npm run db:verify` | Verify complete setup |
| `npm run db:migrate` | Apply schema migrations |
| `npm run db:generate` | Generate new migration |
| `npm run db:studio` | Open visual database browser |

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
├── app/                       # Next.js app directory
│   ├── page.tsx              # Main page component
│   ├── layout.tsx            # Root layout
│   └── ...                   # Other routes and layouts
├── components/                # React components
│   ├── ThreatMeter.jsx       # Threat level visual display
│   ├── PlayerPanel.jsx       # Player cards with history
│   ├── PhaseTracker.jsx      # Phase management UI
│   ├── PhaserHexMap/         # Phaser hex map renderer
│   ├── GameSetup.jsx         # Campaign setup screen
│   ├── VictoryScreen.jsx     # End game results
│   ├── DiceRoller.jsx        # D36 dice roller
│   ├── EventLog.jsx          # Action history log
│   └── HexDetails.jsx        # Hex information panel
├── lib/                       # Shared libraries
│   ├── db/                   # Database module (PostgreSQL + Drizzle ORM)
│   │   ├── schema.ts         # Database schema definitions
│   │   ├── client.ts         # Database client with connection pooling
│   │   ├── migrate.ts        # Migration runner script
│   │   ├── test-connection.ts # Connection test utility
│   │   ├── verify-setup.ts   # Setup verification script
│   │   ├── migrations/       # SQL migration files
│   │   └── README.md         # Database module documentation
│   ├── utils/                # Utility functions
│   │   ├── dice.ts           # Dice rolling utilities
│   │   └── hexUtils.ts       # Hex grid calculations
│   └── data/
│       └── campaignData.ts   # Game data (locations, conditions)
├── hooks/                     # Custom React hooks
│   └── useCampaign.js        # Main campaign state management
├── types/                     # TypeScript type definitions
├── .github/
│   ├── copilot-instructions.md      # Development standards
│   ├── instructions/                # Code-specific guidelines
│   └── issues/                      # Detailed issue specifications
├── DATABASE_SETUP.md          # Complete database setup guide
├── DATABASE_SCHEMA.md         # Database schema reference
├── DATABASE_COMMANDS.md       # Database commands quick reference
├── TEAM_ONBOARDING.md         # Quick start for new contributors
├── tsconfig.json              # TypeScript configuration
├── vitest.config.js           # Test configuration
├── next.config.mjs            # Next.js configuration
├── drizzle.config.ts          # Drizzle ORM configuration
└── package.json               # Project dependencies and scripts
```

## Documentation

This project has comprehensive documentation to help you get started:

### For New Team Members
- **[TEAM_ONBOARDING.md](./TEAM_ONBOARDING.md)** - Quick start guide for new contributors (5-10 minutes)
- **[DATABASE_COMMANDS.md](./DATABASE_COMMANDS.md)** - Quick reference for all database commands

### Database Setup & Management
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Complete guide for setting up database hosting
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database schema reference and documentation
- **[lib/db/README.md](./lib/db/README.md)** - Database module documentation

### Development
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Development standards and guidelines
- **[TESTING.md](./TESTING.md)** - Testing guidelines and best practices

### Project Planning
- **[FUTURE_FEATURES.md](./FUTURE_FEATURES.md)** - Planned features and roadmap
- **[.github/issues/](.github/issues/)** - Detailed issue specifications

## Development Standards

This project follows strict development standards for code quality and maintainability:

### Test-Driven Development (TDD)
- **ALL new features require tests before implementation**
- Coverage target: 85-90% for business logic
- Use Vitest with React Testing Library
- Run tests: `npm test` or `npm run test:coverage`

### TypeScript
- TypeScript configuration with strict mode enabled
- New files should use TypeScript (.ts/.tsx)
- No `any` types - use proper types or `unknown`
- Define interfaces for all data structures

### Code Quality
- **Function size limit**: 10-20 lines per function
- Add JSDoc comments to exported functions
- Comment "WHY", not "WHAT"
- Each function should do ONE thing

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for complete development standards.

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
