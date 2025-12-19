# Ctesiphus Expedition Campaign Manager - Future Features

## Planned Enhancements

### Visual Improvements
- [ ] Upgrade hex map rendering with a dedicated graphics library
- [ ] Add hex tile textures (ice, metal, glow effects)
- [ ] Animated transitions for movement and exploration
- [ ] Particle effects for combat and special events
- [ ] Dark/light theme toggle

### Gameplay Features
- [ ] **Pathfinding**: Calculate actual movement paths with visual preview
- [ ] **Beast Lair Tracking**: Animate beast attacks during Threat phase
- [ ] **Portal Network**: Visualize Transdimensional Portal connections
- [ ] **NPC Encounters**: Automated Necron NPC battles with dice resolution
- [ ] **Mission Generator**: Random mission selection based on hex type
- [ ] **Fog of War**: Hide unexplored hex details until scouted

### Campaign Management
- [ ] **Save/Load**: Persist campaign state to localStorage or cloud
- [ ] **Campaign History**: Track multiple campaigns with statistics
- [ ] **Undo/Redo**: Revert actions during a turn
- [ ] **Turn Timer**: Optional time limits per phase
- [ ] **Campaign Templates**: Pre-configured map layouts

### Multiplayer
- [ ] **Online Play**: Real-time multiplayer via WebSockets
- [ ] **Async Mode**: Turn-based play across sessions
- [ ] **Spectator Mode**: Watch ongoing campaigns
- [ ] **Chat Integration**: In-game messaging

### Data & Statistics
- [ ] **Detailed Analytics**: Per-player performance graphs
- [ ] **Heat Maps**: Visualize exploration patterns
- [ ] **Kill Team Roster**: Track operative names and loadouts
- [ ] **Battle Log**: Detailed combat history with outcomes
- [ ] **Export/Import**: Share campaign data as JSON

### Quality of Life
- [ ] **Tutorial Mode**: Interactive walkthrough for new players
- [ ] **Quick Reference**: In-app rules lookup
- [ ] **Keyboard Shortcuts**: Hotkeys for common actions
- [ ] **Mobile Responsive**: Touch-friendly UI for tablets
- [ ] **Accessibility**: Screen reader support, high contrast mode

### Audio
- [ ] **Sound Effects**: Dice rolls, movement, combat
- [ ] **Ambient Audio**: Background music for surface/tomb zones
- [ ] **Notification Sounds**: Turn alerts, threat warnings

## Technical Debt
- [ ] Add unit tests for game logic
- [ ] Implement TypeScript for type safety
- [ ] Add error boundaries for graceful failures
- [ ] Performance optimization for large maps
- [ ] PWA support for offline play

## Community Requests
_Add feature requests from users here_

---

## Completed Features
- [x] Interactive hex map with surface/tomb zones
- [x] Multi-player support (2-6 players)
- [x] Full campaign phase tracking
- [x] D36 exploration system
- [x] Supply/Campaign Points tracking
- [x] All 5 action types
- [x] Threat level progression
- [x] Built-in dice roller
- [x] Event log
- [x] Victory screen with categories
