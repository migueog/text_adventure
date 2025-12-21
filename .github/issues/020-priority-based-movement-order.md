# Priority-Based Movement Order

## Description

The Movement Phase rules state: "One at a time, in an order determined by establishing priority (pg 2), each player must do one of the following movement actions."

This means players don't all move simultaneously - they move sequentially in priority order (lowest CP → lowest SP → roll-off).

**Current Implementation:**
- Turn-based system exists (players go one at a time) ✅
- Priority calculation exists (issue #008) but may not be applied to movement
- Movement is sequential but order may not follow priority rules

**What Needs to Be Enhanced:**
- Apply priority system specifically to Movement Phase
- Visual indication of movement order
- "Current player's turn" indicator
- Waiting state for other players
- Movement happens one player at a time, in priority order
- Option to skip movement to end of priority queue

## Acceptance Criteria

- [ ] Movement Phase determines priority order at start
- [ ] Players move one at a time in priority order
- [ ] UI clearly shows whose turn it is to move
- [ ] UI shows movement order (1st, 2nd, 3rd, etc.)
- [ ] Non-active players see "Waiting for [Player]" state
- [ ] Active player has limited time or can pass/complete turn
- [ ] Priority recalculated each round (CP/SP may change)
- [ ] Unit tests validate priority order application
- [ ] Integration tests verify sequential movement flow

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Apply priority order to movement
- `src/components/PhaseTracker.jsx` - Display movement order and current player
- `src/components/PlayerPanel.jsx` - Show priority position indicators
- New component: `src/components/MovementQueue.jsx` - Visual movement order display

**Implementation Considerations:**

- Priority order calculation at Movement Phase start:
```javascript
function startMovementPhase(gameState) {
  // Calculate priority for all players
  const priorityOrder = determinePriority(gameState.players);

  gameState.movementPhase = {
    currentPlayerIndex: 0,
    playerOrder: priorityOrder,
    playersCompleted: []
  };

  return priorityOrder[0]; // First player to move
}
```

- Sequential movement flow:
  1. Movement Phase begins
  2. Calculate priority order
  3. Display movement order to all players
  4. Set first player as active
  5. Player selects and executes movement action
  6. Mark player as complete
  7. Move to next player in order
  8. Repeat until all players complete
  9. Advance to Battle Phase

- UI components:

  **Movement Order Panel:**
  ```
  Movement Order:
  1. [Current] Blue Player (CP: 3, SP: 7)
  2. [Waiting] Red Player (CP: 3, SP: 8)
  3. [Waiting] Green Player (CP: 5, SP: 6)
  4. [Waiting] Orange Player (CP: 6, SP: 9)
  ```

  **Active Player Banner:**
  ```
  ┌─────────────────────────────────────┐
  │  Blue Player - Your Turn to Move    │
  │  Position: 1 of 4                   │
  └─────────────────────────────────────┘
  ```

  **Waiting State:**
  ```
  ┌─────────────────────────────────────┐
  │  Waiting for Blue Player to move... │
  │  You are 3rd in movement order      │
  └─────────────────────────────────────┘
  ```

- Player completion:
  - After movement action confirmed, mark player complete
  - Checkmark appears next to player in order list
  - Automatically advance to next player
  - If last player, transition to Battle Phase

- Priority tie-breaking:
  - If CP tied, check SP
  - If SP also tied, roll-off
  - Roll-off dialog appears for tied players
  - Highest roll goes first
  - Store order for this round

- Mid-round changes:
  - Priority calculated once at start of round
  - Doesn't recalculate even if CP/SP change during round
  - Recalculates at start of next round

- Solo mode:
  - Priority system not needed
  - Single player moves immediately
  - No waiting state

- Multiplayer considerations:
  - Show all players' movement order
  - Only active player can interact with movement controls
  - Other players see read-only view
  - Important for async/online play (future)

**Related Issues:**
- Related to Priority Establishment System (#008)
- Related to Movement Action Types (#016)
- Related to Multiplayer/Async functionality (future)
- Foundation for turn timer system (future)

## Labels

`enhancement`, `phase-system`, `gameplay`, `ui`
