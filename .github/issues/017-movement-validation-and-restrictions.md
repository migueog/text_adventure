# Movement Validation and Restrictions

## Description

The Movement Phase rules specify several restrictions for MANOEUVRE:
- Cannot move more hexes than current SP (costs 1 SP per hex)
- Cannot move into or through blocked hexes
- Cannot finish movement in a hex that already contains two kill teams
- Maximum movement distance is 3 hexes

**Current Implementation:**
- 3 hex maximum distance enforced ✅
- SP cost calculation exists ✅
- Blocked hex data exists but validation may be incomplete
- Hex capacity (max 2 kill teams) is NOT enforced

**What Needs to Be Implemented:**
- SP validation before allowing movement
- Blocked hex pathfinding (cannot move through)
- Hex capacity validation (max 2 kill teams per hex)
- Clear error messages when movement is invalid
- Visual indicators for invalid hexes
- Pathfinding that respects blocked hexes

## Acceptance Criteria

- [ ] Movement validation checks SP availability before allowing selection
- [ ] Cannot select hexes requiring more SP than available
- [ ] Blocked hexes cannot be selected or moved through
- [ ] Cannot select destination hex with 2+ kill teams already present
- [ ] Invalid hexes are visually indicated (grayed out, red border, etc.)
- [ ] Clear error messages explain why hex is invalid
- [ ] Pathfinding algorithm avoids blocked hexes
- [ ] Movement preview shows valid path
- [ ] Unit tests validate all movement restrictions
- [ ] Integration tests verify restriction enforcement

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Add movement validation logic
- `src/utils/hexUtils.js` - Enhanced pathfinding with blocked hex avoidance
- `src/components/PhaserHexMap/HexMapScene.js` - Visual feedback for invalid hexes
- `src/components/PhaseTracker.jsx` - Display error messages

**Implementation Considerations:**

- Movement validation function:
```javascript
function validateMovement(fromHex, toHex, player, gameState) {
  const distance = calculateHexDistance(fromHex, toHex);

  // Check maximum distance
  if (distance > 3) {
    return { valid: false, reason: "Maximum movement is 3 hexes" };
  }

  // Check SP availability
  if (player.sp < distance) {
    return { valid: false, reason: `Insufficient SP (need ${distance}, have ${player.sp})` };
  }

  // Check destination not blocked
  if (gameState.hexes[toHex].type === 'blocked') {
    return { valid: false, reason: "Cannot move to blocked hex" };
  }

  // Check hex capacity
  const killTeamsInHex = countKillTeamsInHex(toHex, gameState);
  if (killTeamsInHex >= 2) {
    return { valid: false, reason: "Hex already contains 2 kill teams" };
  }

  // Check path doesn't go through blocked hexes
  const path = findPath(fromHex, toHex, gameState);
  if (!path) {
    return { valid: false, reason: "No valid path (blocked hexes in the way)" };
  }

  return { valid: true, path };
}
```

- Pathfinding with blocked hex avoidance:
```javascript
function findPath(start, end, gameState) {
  // BFS pathfinding that avoids blocked hexes
  // Returns path array or null if no path exists

  const queue = [{hex: start, path: [start]}];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const {hex, path} = queue.shift();

    if (hex === end) return path;

    // Get neighbors
    const neighbors = getNeighbors(hex);
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      if (gameState.hexes[neighbor].type === 'blocked') continue;
      if (path.length >= 3) continue; // Max distance

      visited.add(neighbor);
      queue.push({hex: neighbor, path: [...path, neighbor]});
    }
  }

  return null; // No path found
}
```

- Visual indicators:
  - **Valid hexes**: Normal appearance, clickable
  - **Too far**: Grayed out, show "Too far" tooltip
  - **Insufficient SP**: Orange border, show "Need X SP" tooltip
  - **Blocked**: Red X or hatching, not clickable
  - **Full**: Yellow border, show "2 kill teams already present"
  - **No path**: Grayed out, show "Blocked by obstacles"

- Hex capacity tracking:
```javascript
function countKillTeamsInHex(hexId, gameState) {
  return gameState.players.filter(p => p.currentHex === hexId).length;
}
```

- Error message display:
  - Toast notification when clicking invalid hex
  - Persistent message below movement options
  - Tooltip on hover over invalid hex
  - Clear messaging: "Cannot move here: [reason]"

- Edge cases:
  - Moving to current hex (should be allowed, costs 0 SP)
  - Hex becomes blocked during planning (validation before execution)
  - Another player moves into target hex before current player moves

**Related Issues:**
- Related to Movement Action Types (#016)
- Related to Hex Types and Exploration (#006)
- Related to Priority Establishment System (#008)
- Related to Pathfinding visualization (future enhancement)

## Labels

`enhancement`, `phase-system`, `hex-map`, `gameplay`
