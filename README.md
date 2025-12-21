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
- **Vite**: Fast build tool and dev server
- **Phaser 3**: WebGL-powered hex map rendering
- **CSS3**: Custom styling with CSS variables
- **Vitest**: Testing framework with React Testing Library
- **TypeScript**: Type safety configuration (strict mode enabled)

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/migueog/text_adventure.git
cd text_adventure

# Install dependencies
npm install

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
├── src/
│   ├── components/        # React components
│   │   ├── ThreatMeter.jsx          # Threat level visual display
│   │   ├── PlayerPanel.jsx          # Player cards with history
│   │   ├── PhaseTracker.jsx         # Phase management UI
│   │   ├── PhaserHexMap/            # Phaser hex map renderer
│   │   ├── GameSetup.jsx            # Campaign setup screen
│   │   ├── VictoryScreen.jsx        # End game results
│   │   ├── DiceRoller.jsx           # D36 dice roller
│   │   ├── EventLog.jsx             # Action history log
│   │   └── HexDetails.jsx           # Hex information panel
│   ├── hooks/
│   │   └── useCampaign.js           # Main campaign state management
│   ├── data/
│   │   └── campaignData.js          # Game data (locations, conditions, etc.)
│   ├── utils/
│   │   ├── dice.js                  # Dice rolling utilities
│   │   └── hexUtils.js              # Hex grid calculations
│   ├── test/
│   │   └── setup.js                 # Vitest test setup
│   ├── App.jsx                      # Main app component
│   ├── App.css                      # Global styles
│   └── main.jsx                     # React entry point
├── .github/
│   ├── copilot-instructions.md      # Development standards
│   ├── instructions/                # Code-specific guidelines
│   └── issues/                      # Detailed issue specifications
├── tsconfig.json                    # TypeScript configuration
├── vitest.config.js                 # Test configuration
├── index.html
├── vite.config.js
└── package.json
```

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
