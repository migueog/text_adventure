# Action Phase Turn Order (Winners, Draws, Losses)

## Description

The Action Phase rules specify: "One at a time, each player can perform one campaign action. All players that won their game in the preceding Battle phase go first, starting with a player determined by establishing priority. Repeat this process for all players that drew their game, followed by all players that lost. If an odd player was given a bye in the preceding Battle phase, treat them as having drawn for this."

**Current Implementation:**
- Action phase exists ✅
- Players perform actions ✅
- Turn order may not follow battle result grouping
- Priority within groups may not be applied

**What Needs to Be Implemented:**
- Action phase turn order based on battle results (Winners → Draws → Losses)
- Priority calculation within each group
- Bye players treated as draws
- Visual display of action order queue
- Clear indication of whose turn it is
- Waiting state for other players

## Acceptance Criteria

- [ ] Action phase determines turn order based on battle results
- [ ] Winners act first (in priority order: lowest CP → SP → roll-off)
- [ ] Then draws act (in priority order)
- [ ] Then losses act last (in priority order)
- [ ] Bye players grouped with draws
- [ ] UI shows action order queue with groupings
- [ ] Current player clearly indicated
- [ ] Players act one at a time in correct order
- [ ] Unit tests validate turn order calculation
- [ ] Integration tests verify action phase flow

## Technical Notes

**Files to Modify:**
- `src/hooks/useCampaign.js` - Action phase turn order logic
- `src/components/PhaseTracker.jsx` - Display action order
- New component: `src/components/ActionQueue.jsx` - Visual action order display

**Implementation Considerations:**

- Turn order calculation:
```javascript
function calculateActionPhaseOrder(players) {
  // Group by battle result
  const winners = players.filter(p => p.battleResult === 'win');
  const draws = players.filter(p =>
    p.battleResult === 'draw' || p.battleResult === 'bye'
  );
  const losses = players.filter(p => p.battleResult === 'loss');

  // Apply priority within each group
  const winnersOrdered = determinePriority(winners);
  const drawsOrdered = determinePriority(draws);
  const lossesOrdered = determinePriority(losses);

  // Combine in correct order
  return [...winnersOrdered, ...drawsOrdered, ...lossesOrdered];
}
```

- Visual action queue:
```
Action Phase Order:
┌─────────────────────────────────────────┐
│ WINNERS (go first)                      │
│  1. [Current] Blue Player (CP:3, SP:7) │
│  2. [Waiting] Green Player (CP:5, SP:6) │
│                                          │
│ DRAWS                                    │
│  3. [Waiting] Red Player (CP:3, SP:8)   │
│  4. [Waiting] Yellow Player (Bye)       │
│                                          │
│ LOSSES (go last)                         │
│  5. [Waiting] Orange Player (CP:6, SP:4)│
└─────────────────────────────────────────┘
```

- Current player indicator:
```
┌─────────────────────────────────────┐
│  Blue Player - Your Action Phase    │
│  Position: 1 of 5 (Winner)          │
│  Choose one action to perform       │
└─────────────────────────────────────┘
```

- Group labels:
  - **WINNERS**: Green/gold highlighting
  - **DRAWS**: Yellow/neutral highlighting
  - **LOSSES**: Orange/red highlighting
  - Shows strategic advantage of winning

- Priority within groups:
  - Use same priority rules (CP → SP → roll-off)
  - Calculated independently for each group
  - Example: Winner with 10 CP goes before winner with 5 CP

- Bye handling:
  - Explicitly grouped with draws
  - Label: "Yellow Player (Bye)" in draws section
  - Same priority rules apply

- Action completion flow:
  1. Player selects action
  2. Confirm action and SP cost
  3. Execute action
  4. Mark player complete
  5. Advance to next player in order
  6. If all complete, advance to Threat Phase

- Waiting state messaging:
  - "Waiting for Blue Player's action..."
  - "You are next (2nd in order)"
  - "3 players remaining"

- Strategic implications:
  - Winners have first pick of actions
  - Important for Scout (exploring best hexes)
  - Important for Encamp (claiming locations)
  - Losses act last, may have fewer options

**Related Issues:**
- Related to Battle Rewards (#022)
- Related to Priority Establishment System (#008)
- Related to Action implementations (#024-028)

## Labels

`enhancement`, `phase-system`, `gameplay`, `ui`
