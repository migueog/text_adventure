# Ctesiphus Expedition Campaign Manager - Future Features

## Planned Enhancements

### Visual Improvements
- [ ] Upgrade hex map rendering with a dedicated graphics library (see [Graphics Framework Options](#graphics-framework-options))
- [ ] Add hex tile textures (ice, metal, glow effects)
- [ ] Animated transitions for movement and exploration
- [ ] Particle effects for combat and special events
- [ ] Dark/light theme toggle

### 3D Tabletop View (New Feature)
- [ ] **3D Battle Arena**: Render Kill Team killzones in 3D using Three.js/React Three Fiber
- [ ] **Miniature Models**: Support for importing STL/OBJ/FBX miniature models
- [ ] **Inch-Based Measurement**: Ruler tool for measuring distances in inches (like TTS)
- [ ] **Distance Rings**: Toggle 1", 2", 3", 6" range rings around operatives
- [ ] **Movement Tracking**: Measure movement distance while dragging models
- [ ] **Terrain Placement**: Drag-and-drop 3D terrain pieces
- [ ] **Camera Controls**: Orbit, pan, zoom with 2D/3D view toggle
- [ ] **Line of Sight**: Visual LOS checking between operatives

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

## Graphics Framework Options

### For 2D Hex Map (WebGL)

| Framework | Pros | Cons | Hex Support |
|-----------|------|------|-------------|
| **Phaser 3** | Native hex tilemap support, large community, WebGL + Canvas fallback | Heavier bundle, game-engine focused | Built-in since v3.50 |
| **PixiJS** | Lightweight, fast WebGL, tree-shakeable | No native hex support | Via HexPixiJs library |
| **MelonJS** | Native hex/iso maps, Tiled integration | Smaller community | Built-in |

**Recommended: Phaser 3** - Has [official hexagonal tilemap support](https://phaser.io/examples/v3.85.0/tilemap/isometric/view/hexagonal-test) with methods like `HexagonalTileToWorldXY` and full Tiled editor integration.

### For 3D Tabletop View

| Framework | Pros | Cons |
|-----------|------|------|
| **Three.js** | Industry standard, huge ecosystem | Steeper learning curve |
| **React Three Fiber** | React-native 3D, declarative | Requires Three.js knowledge |
| **Babylon.js** | Built-in physics, inspector tools | Larger bundle size |

**Recommended: React Three Fiber** - Integrates seamlessly with React, supports model loading (GLTF/STL/OBJ), and has [measurement libraries](https://github.com/AwesomeTeamOne/3DView.Measurements) available.

### 3D Measurement Implementation

For inch-based ruler tools, these resources are helpful:
- [3DView.Measurements](https://github.com/AwesomeTeamOne/3DView.Measurements) - Distance, angle, radius measurements
- [Three.js Raycaster Measurements Tutorial](https://sbcode.net/threejs/measurements/)
- [3dViewMeasurement Demo](https://3dmeasurement.surge.sh/)

### Existing Virtual Tabletops for Reference

- [Tabula Sono](https://tabulasono.com/) - Browser-based 3D VTT with custom mini import
- [SceneGrinder](https://www.scenegrinder.com/) - Browser 3D VTT with Hero Forge support
- [Tabletop Simulator](https://github.com/jmegner/KillTeamResources/blob/main/TTS-Beginners-guide.md) - Has Kill Team mods with distance rings

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
