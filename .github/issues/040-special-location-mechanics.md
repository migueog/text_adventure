# Special Location Mechanics Implementation

## Description

Several locations have complex, unique mechanics that go beyond simple search/camp rules:

1. **Beast Lair (SL36)**: Threat phase attacks on nearby players with roll-off system
2. **Released Prisoner (TL32)**: Mobile entity that moves and attacks, can be destroyed
3. **Dimensional Key (TL36)**: Transferable item enabling special movement
4. **Intel System (SL31)**: Finite resource granting free scout actions
5. **Portal Network (TL11)**: Selectable portal destinations for movement
6. **Hex Blocking (SL21, TL25)**: Dynamic hex blocking/unblocking

**Current Implementation:**
- These special mechanics are NOT implemented
- Would require new game systems beyond basic location rules

**What Needs to Be Implemented:**
- Beast Lair threat phase attack system
- Released Prisoner entity tracking and movement
- Dimensional Key item system
- Intel as a trackable resource
- Portal network with hex selection
- Dynamic hex blocking mechanics
- UI for all special location interactions

## Acceptance Criteria

- [ ] Beast Lair attacks players within 2 hexes during Threat Phase
- [ ] Beast Lair roll-off system for multiple players
- [ ] Beast can be destroyed via Demolish action
- [ ] Released Prisoner added to map when Hyperfractal Gaol camped
- [ ] Released Prisoner moves up to D3 hexes per Threat Phase
- [ ] Released Prisoner attacks players and removes camps
- [ ] Released Prisoner can be removed (destroyed or Demolish action)
- [ ] Dimensional Key can be acquired and transferred between players
- [ ] Dimensional Key enables Dimensional Manoeuvre action
- [ ] Intel system tracks finite intel count per hex
- [ ] Intel grants free scout actions to surface hexes
- [ ] Tomb Ruin portals can select two hexes for fast travel
- [ ] Transtechnic Fulcrum can block/unblock selected hex
- [ ] All special mechanics have clear UI
- [ ] Unit tests validate all special mechanics
- [ ] Integration tests verify special location interactions

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Special entity and item tracking
- New file: `src/systems/BeastLair.js` - Beast attack system
- New file: `src/systems/ReleasedPrisoner.js` - Prisoner entity management
- New file: `src/systems/DimensionalKey.js` - Key transfer and usage
- New file: `src/systems/IntelSystem.js` - Intel tracking
- New file: `src/systems/PortalNetwork.js` - Portal hex selection
- `src/components/PhaseTracker.jsx` - Special action UIs
- New component: `src/components/BeastLairThreat.jsx`
- New component: `src/components/ReleasedPrisonerTracker.jsx`

**Implementation Considerations:**

### 1. Beast Lair (SL36)

**Threat Phase Attack System:**
```javascript
function resolveBeastLairThreat(beastLairHex, gameState) {
  // Find all players within 2 surface hexes
  const playersInRange = gameState.players.filter(player => {
    const distance = calculateSurfaceHexDistance(player.currentHex, beastLairHex);
    return distance <= 2 && gameState.hexes[player.currentHex].type === 'surface';
  });

  if (playersInRange.length === 0) return;

  if (playersInRange.length === 1) {
    // Solo player: roll D6+distance, attacked on 5+
    const player = playersInRange[0];
    const distance = calculateSurfaceHexDistance(player.currentHex, beastLairHex);
    const roll = rollD6() + distance;

    if (roll < 5) {
      // Attacked!
      const damage = rollD6();
      player.sp = Math.max(0, player.sp - damage);
      logEvent(`${player.name} attacked by beast! Lost ${damage} SP`);
    }
  } else {
    // Multiple players: roll-off with distance bonus
    const rolls = playersInRange.map(player => {
      const distance = calculateSurfaceHexDistance(player.currentHex, beastLairHex);
      const roll = rollD6() + distance;
      return { player, roll, distance };
    });

    rolls.sort((a, b) => a.roll - b.roll);
    const loser = rolls[0].player;

    const damage = rollD6();
    loser.sp = Math.max(0, loser.sp - damage);
    logEvent(`${loser.name} attacked by beast! Lost ${damage} SP`);
  }
}
```

**Beast Destruction:**
```javascript
function demolishBeastLair(hex) {
  if (hex.location.id !== 'SL36') return;

  hex.beastDestroyed = true;
  logEvent("Beast lair destroyed! Beast eliminated.");

  // No more threat phase attacks
}
```

### 2. Released Prisoner (TL32)

**Entity Tracking:**
```javascript
gameState.releasedPrisoner = {
  active: false,
  currentHex: null,
  addedByPlayer: null,
  movedThisPhase: false
};

function encampHyperfractalGaol(player, hex) {
  if (!gameState.releasedPrisoner.active) {
    gameState.releasedPrisoner = {
      active: true,
      currentHex: hex.id,
      addedByPlayer: player.id,
      movedThisPhase: false
    };

    logEvent(`${player.name} released the prisoner!`);
  }
}
```

**Prisoner Movement (Threat Phase):**
```javascript
function moveReleasedPrisoner(controllingPlayer) {
  if (!gameState.releasedPrisoner.active) return;

  const distance = rollD3();

  // Player chooses path
  const newHex = await selectHexForPrisonerMovement(
    gameState.releasedPrisoner.currentHex,
    distance
  );

  gameState.releasedPrisoner.currentHex = newHex;

  // Attack if not in Transeptum Maze
  if (gameState.hexes[newHex].location.id !== 'TL22') {
    const playersInHex = gameState.players.filter(p =>
      p.currentHex === newHex && p.id !== controllingPlayer.id
    );

    let removedAnything = false;

    for (const player of playersInHex) {
      const damage = rollD6();
      player.sp = Math.max(0, player.sp - damage);
      logEvent(`Released prisoner attacked ${player.name}! Lost ${damage} SP`);
      removedAnything = true;

      // Remove camp if present
      if (player.camps.includes(newHex)) {
        player.camps = player.camps.filter(c => c !== newHex);
        logEvent(`Released prisoner destroyed ${player.name}'s camp!`);
        removedAnything = true;
      }
    }

    // Check if prisoner is removed
    if (removedAnything) {
      const removalRoll = rollD6();
      if (removalRoll >= 4) {
        gameState.releasedPrisoner.active = false;
        logEvent("Released prisoner eliminated!");
      }
    }
  }
}
```

### 3. Dimensional Key (TL36)

**Key System:**
```javascript
gameState.dimensionalKey = {
  available: true,
  heldBy: null
};

function searchDimensionMatrix(player, hex) {
  if (gameState.dimensionalKey.available) {
    gameState.dimensionalKey.available = false;
    gameState.dimensionalKey.heldBy = player.id;

    showNotification(`${player.name} acquired the Dimensional Key!`);
  }
}

function performDimensionalManoeuvre(player, targetHex) {
  if (gameState.dimensionalKey.heldBy !== player.id) {
    throw new Error("Player doesn't have Dimensional Key");
  }

  if (player.sp < 1) {
    throw new Error("Need 1 SP for Dimensional Manoeuvre");
  }

  // Move to any hex (unless it has 2 kill teams)
  player.currentHex = targetHex;
  player.sp -= 1;

  // Return key
  gameState.dimensionalKey.available = true;
  gameState.dimensionalKey.heldBy = null;

  logEvent(`${player.name} used Dimensional Manoeuvre to Hex ${targetHex}`);
}
```

### 4. Intel System (SL31)

**Intel Tracking:**
```javascript
// On exploration
hex.intel = rollD6();  // Initial intel count

function searchCrashedShip(player, hex) {
  if (hex.intel > 0) {
    const gained = Math.min(rollD3(), hex.intel);
    hex.intel -= gained;

    // Grant free scout actions
    player.pendingIntelScouts = gained;

    showNotification(`Gained ${gained} intel! Can perform ${gained} free scout actions.`);
  }
}

function useIntelScout(player, targetHex) {
  if (player.pendingIntelScouts === 0) return;

  // Free scout to any surface hex (not tomb)
  if (gameState.hexes[targetHex].type !== 'surface') {
    throw new Error("Intel scouts can only target surface hexes");
  }

  exploreHex(targetHex);
  player.pendingIntelScouts -= 1;

  logEvent(`${player.name} used intel to scout Hex ${targetHex}`);
}
```

### 5. Portal Network (TL11 - Tomb Ruin)

**Portal Selection:**
```javascript
hex.portalDestinations = {
  tombHex: null,
  surfaceHex: null
};

function searchTombRuin(player, hex) {
  // Select portal destinations
  const tombHex = await selectHex("Select tomb hex for portal");
  const surfaceHex = await selectHex("Select surface hex for portal");

  hex.portalDestinations = { tombHex, surfaceHex };

  showNotification("Portal network configured!");
}

function canUsePortal(fromHex, toHex) {
  const portalHex = gameState.hexes[fromHex];
  if (portalHex.location.id !== 'TL11') return false;

  return portalHex.portalDestinations.tombHex === toHex ||
         portalHex.portalDestinations.surfaceHex === toHex;
}
```

### 6. Hex Blocking (TL25 - Transtechnic Fulcrum)

**Dynamic Blocking:**
```javascript
hex.blockedByFulcrum = null;  // Which hex is currently blocked

function searchTranstechnicFulcrum(player, hex) {
  // Unblock previously selected hex
  if (hex.blockedByFulcrum) {
    gameState.hexes[hex.blockedByFulcrum].type =
      gameState.hexes[hex.blockedByFulcrum].originalType;
  }

  // Select new hex to block
  const targetHex = await selectTombHex("Select hex to block");

  // Block it
  gameState.hexes[targetHex].originalType = gameState.hexes[targetHex].type;
  gameState.hexes[targetHex].type = 'blocked';
  hex.blockedByFulcrum = targetHex;

  logEvent(`Hex ${targetHex} is now blocked by Transtechnic Fulcrum`);
}
```

**Related Issues:**
- Related to Exploration Data (#039)
- Related to Search Action (#026)
- Related to Threat Phase Location Rules (#029)
- Related to Hex Types (#006)

## Labels

`enhancement`, `gameplay`, `hex-map`, `data`
