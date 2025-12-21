# Implementation Plan: Phaser 3 Hex Map Integration

## Overview

Replace the current SVG-based hex map rendering with Phaser 3 for improved performance, visual effects, and native hexagonal tilemap support.

---

## Phase 1: Setup & Foundation

### 1.1 Install Dependencies
```bash
npm install phaser
```

### 1.2 Create Phaser Game Component
- Create `src/components/PhaserHexMap/` directory structure:
  ```
  PhaserHexMap/
  ├── index.jsx           # React wrapper component
  ├── game.js             # Phaser game configuration
  ├── scenes/
  │   ├── HexMapScene.js  # Main hex map scene
  │   └── PreloadScene.js # Asset loading scene
  ├── objects/
  │   ├── Hex.js          # Hex tile game object
  │   └── PlayerToken.js  # Player token sprite
  └── utils/
      └── hexCoords.js    # Hex coordinate utilities
  ```

### 1.3 React-Phaser Bridge
- Create a React component that:
  - Mounts/unmounts the Phaser game instance
  - Passes campaign state to Phaser via events
  - Receives click events from Phaser back to React
  - Handles resize/responsive behavior

---

## Phase 2: Core Hex Map Rendering

### 2.1 Hex Tilemap Setup
- Use Phaser's built-in hexagonal tilemap support (`HEXAGONAL` orientation)
- Configure stagger axis and stagger index for proper hex layout
- Set hex dimensions matching current design (45px size)

### 2.2 Hex Tile Types
Create tile graphics for each hex state:

| Tile Type | Visual Style |
|-----------|--------------|
| Surface (unexplored) | Dark blue, subtle pattern |
| Surface (explored) | Light blue, ice texture |
| Tomb (unexplored) | Dark purple, mysterious |
| Tomb (explored) | Light purple, metal/glow |
| Blocked | Dark gray, X pattern |
| Base | Green glow border |
| Camp | Blue glow border |
| Selected | Yellow highlight |

### 2.3 Hex Interaction
- Implement pointer events (hover, click) on hex tiles
- Show hover highlight effect
- Emit custom events for hex selection to React

---

## Phase 3: Dynamic Elements

### 3.1 Player Tokens
- Create sprite-based player tokens with team colors
- Position tokens on hex centers
- Handle multiple players on same hex (offset positions)
- Add subtle idle animation (breathing/pulse)

### 3.2 Movement Visualization
- Show movement range overlay (reachable hexes within 1-3 distance)
- Display movement cost numbers on reachable hexes
- Animate token movement along path when moving

### 3.3 Information Overlays
- Location name text on explored hexes
- Condition indicator icons
- Distance markers from current player position

---

## Phase 4: Visual Polish

### 4.1 Hex Textures
- Create or source hex tile textures:
  - Ice/snow for surface
  - Metal/tech for tomb
  - Transition effects at surface/tomb boundary

### 4.2 Animations
- Hex exploration reveal animation
- Player movement tweens
- Pulse effects for bases/camps
- Threat level visual indicator in corner

### 4.3 Camera Controls
- Implement pan (drag to scroll)
- Zoom in/out with scroll wheel
- Fit-to-map button
- Follow current player option

---

## Phase 5: Integration

### 5.1 State Synchronization
- Sync hex data from React state to Phaser scene
- Update visuals when campaign state changes
- Handle phase transitions (highlight relevant hexes)

### 5.2 Event Flow
```
React (useCampaign) <---> PhaserHexMap Component <---> Phaser Scene
     |                          |                          |
     | state updates            | props/callbacks          | game events
     |------------------------->|------------------------->|
     |<-------------------------|<-------------------------|
     | hex clicks, selections   | event emitter            |
```

### 5.3 Remove Old Implementation
- Remove `HexMap.jsx` SVG component
- Update `App.jsx` to use new `PhaserHexMap` component
- Migrate any hex-related logic to new structure

---

## File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `src/components/PhaserHexMap/index.jsx` | React wrapper |
| `src/components/PhaserHexMap/game.js` | Phaser config |
| `src/components/PhaserHexMap/scenes/PreloadScene.js` | Asset loader |
| `src/components/PhaserHexMap/scenes/HexMapScene.js` | Main scene |
| `src/components/PhaserHexMap/objects/Hex.js` | Hex tile class |
| `src/components/PhaserHexMap/objects/PlayerToken.js` | Token class |
| `public/assets/hexes/` | Hex tile images |
| `public/assets/tokens/` | Player token images |

### Modified Files
| File | Changes |
|------|---------|
| `package.json` | Add Phaser dependency |
| `src/App.jsx` | Replace HexMap with PhaserHexMap |
| `src/App.css` | Adjust layout for Phaser canvas |

### Deleted Files
| File | Reason |
|------|--------|
| `src/components/HexMap.jsx` | Replaced by Phaser implementation |

---

## Technical Considerations

### Performance
- Use object pooling for hex tiles if map is large
- Cull off-screen hexes from render
- Use texture atlases for sprites

### Responsive Design
- Handle window resize events
- Scale game to fit container
- Maintain aspect ratio

### Asset Strategy
- **Option A**: Generate hex graphics programmatically with Phaser Graphics
- **Option B**: Use pre-made tileset images (requires asset creation)
- **Recommended**: Start with Option A, upgrade to B for polish

---

## Implementation Order

1. **Phase 1.1-1.3**: Basic Phaser setup with React wrapper (~2-3 hours)
2. **Phase 2.1-2.3**: Core hex rendering and interaction (~3-4 hours)
3. **Phase 3.1-3.3**: Player tokens and movement viz (~2-3 hours)
4. **Phase 5.1-5.3**: Full integration with campaign state (~2-3 hours)
5. **Phase 4.1-4.3**: Visual polish (ongoing, as needed)

**Total Estimated Effort**: 10-15 hours for core functionality

---

## Success Criteria

- [ ] Phaser game renders in place of SVG hex map
- [ ] All hex types display correctly (surface/tomb/blocked)
- [ ] Clicking hexes triggers same callbacks as before
- [ ] Player tokens show at correct positions
- [ ] Movement range highlights work
- [ ] Camera pan/zoom functional
- [ ] No performance regression
- [ ] Maintains responsive layout

---

## Questions to Resolve Before Implementation

1. **Asset approach**: Generate graphics in code or create image assets?
2. **Animation priority**: Which animations are must-have vs nice-to-have?
3. **Mobile support**: Is touch/mobile a priority for this phase?

---

*Plan created: December 2025*
