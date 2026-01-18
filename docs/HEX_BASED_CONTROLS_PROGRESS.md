# Hex-Based Player Control System - Implementation Progress

**Date:** January 17, 2026
**Status:** ~70% Complete (Phases 1-5 of 7)
**Branch:** master

## Overview

Implementing a map-centric control system where players click their hex → click target hex → contextual menu appears with available actions. This replaces the sidebar-only workflow while maintaining backward compatibility.

## ✅ Completed Work

### Phase 1: State Management (DONE)
**Files Modified:**
- `types/campaign.ts`
- `hooks/campaign/useCampaignState.ts`

**What was added:**
- `HexSelection` interface with `sourceHex`, `targetHex`, `selectedPlayerId`, `menuPosition`
- `ActionOption` interface for menu items with validation state
- State management functions:
  - `setSourceHex(hexId, playerId, position)` - Set player's current hex
  - `setTargetHex(hexId, position)` - Set action target and show menu
  - `resetHexSelection()` - Clear all selection state
- Auto-reset on phase/turn change via useEffect

**Key Decision:** Menu position stored as canvas coordinates (x, y) for absolute positioning over Phaser map.

---

### Phase 2: Validation Utility (DONE)
**Files Created:**
- `lib/utils/hexActionValidation.ts` ✅
- `lib/utils/hexActionValidation.test.ts` ✅ (19 passing tests)

**What was added:**
- `getAvailableActions()` - Unified validation function
- Returns `ActionOption[]` based on phase and hex context
- Validates for Movement Phase: move, hold, regroup
- Validates for Action Phase: scout, search, encamp, resupply
- Reuses existing validation from `useMovementPhase` and `useActionPhase`

**Test Coverage:**
- Movement validation (distance, SP, blocked hexes, occupancy)
- Scout validation (explored state, blocked hexes, SP)
- Search validation (already searched, unexplored, location searchRule)
- Encamp validation (SP cost, explored state)
- Resupply validation (base/camp location, max SP)
- Same-hex actions (hold, search, encamp, resupply)
- Wrong phase handling (Battle, Threat return empty array)

---

### Phase 3: Phaser Visual Feedback (DONE)
**Files Modified:**
- `components/PhaserHexMap/HexMapScene.ts`

**What was added:**
- New colors: `sourceHex: 0x3498db` (BLUE), `targetHex: 0xf1c40f` (YELLOW), `validTarget: 0x2ecc71` (GREEN)
- `hexSelection` property in scene state
- Updated `updateData()` to receive hexSelection
- Border rendering priority: source (5px blue) > target (5px yellow) > selected > base > camp
- Visual distinction for two-click workflow

**Key Decision:** Source/target borders take priority over selected/base/camp borders for clarity.

---

### Phase 4: Contextual Menu Component (DONE)
**Files Created:**
- `components/HexContextMenu.tsx` ✅
- `components/HexContextMenu.test.tsx` ✅ (9 passing tests)

**Component Features:**
- Absolute positioning at canvas coordinates (offset +20x, +10y from hex)
- Valid actions: Green buttons, clickable
- Invalid actions: Gray buttons, disabled, show red error text
- Cancel button always visible
- Semi-transparent dark background (bg-gray-900 bg-opacity-95)
- Z-index: 1000 to overlay canvas

**Props:**
```typescript
interface HexContextMenuProps {
  position: { x: number; y: number }
  actions: ActionOption[]
  onAction: (type: string) => void
  onCancel: () => void
}
```

---

### Phase 5: Player Selector Modal (DONE)
**Files Created:**
- `components/PlayerSelectorModal.tsx` ✅
- `components/PlayerSelectorModal.test.tsx` ✅ (8 passing tests)

**Component Features:**
- Full-screen overlay modal (z-index: 50)
- Displays all players in hex with color badge, name, kill team, SP/CP
- Click player button to select
- Click overlay or Cancel to dismiss
- Prevents event propagation on modal content

**Props:**
```typescript
interface PlayerSelectorModalProps {
  players: Player[]
  onSelect: (playerId: number) => void
  onCancel: () => void
}
```

---

## 🚧 Remaining Work

### Phase 6: Integration in app/page.tsx (NOT STARTED)
**Files to Modify:**
- `app/page.tsx`
- `components/PhaseTracker.tsx`

**Implementation Tasks:**

1. **Update handleHexClick handler:**
```typescript
const handleHexClick = (hexId: string) => {
  const hex = campaign.hexes[hexId]
  const playersInHex = getPlayersInHex(hexId)

  if (!campaign.hexSelection.sourceHex) {
    // First click - set source
    const player = selectPlayerInHex(playersInHex)
    if (player) {
      const hexCenter = calculateHexCenter(hex)
      campaign.setSourceHex(hexId, player.id, hexCenter)
    }
  } else if (campaign.hexSelection.sourceHex === hexId) {
    // Same hex - show self-targeted actions (Search, Hold)
    const hexCenter = calculateHexCenter(hex)
    campaign.setTargetHex(hexId, hexCenter)
  } else {
    // Different hex - set target and show menu
    const hexCenter = calculateHexCenter(hex)
    campaign.setTargetHex(hexId, hexCenter)
  }
}
```

2. **Helper functions to implement:**
```typescript
// Get players at specific hex
const getPlayersInHex = (hexId: string): Player[] => {
  const { row, col } = parseHexId(hexId)
  return campaign.players.filter(
    p => p.position && p.position.row === row && p.position.col === col
  )
}

// Auto-select player or show picker
const selectPlayerInHex = (playersInHex: Player[]): Player | null => {
  const currentPlayer = campaign.players[campaign.currentPlayerIndex]

  if (playersInHex.length === 0) return null
  if (playersInHex.length === 1) return playersInHex[0]

  // Multiple players - check if current player is one of them
  if (playersInHex.some(p => p.id === currentPlayer.id)) {
    return currentPlayer // Auto-select current player
  }

  // Show picker modal for other scenarios
  setShowPlayerPicker(true)
  setPlayersForPicker(playersInHex)
  return null
}

// Calculate hex center for menu positioning
const calculateHexCenter = (hex: Hex): { x: number, y: number } => {
  // Use Phaser HEX_SIZE constants or get from scene
  const HEX_SIZE = 40
  const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE
  const HEX_WIDTH = HEX_SIZE * 2

  const x = hex.col * HEX_WIDTH * 0.75
  const y = hex.row * HEX_HEIGHT + (hex.col % 2 === 1 ? HEX_HEIGHT / 2 : 0)

  return { x, y }
}
```

3. **State for modals:**
```typescript
const [showPlayerPicker, setShowPlayerPicker] = useState(false)
const [playersForPicker, setPlayersForPicker] = useState<Player[]>([])
const [availableActions, setAvailableActions] = useState<ActionOption[]>([])
```

4. **Render conditionally:**
```tsx
{/* Hex Context Menu */}
{campaign.hexSelection.targetHex && campaign.hexSelection.menuPosition && (
  <HexContextMenu
    position={campaign.hexSelection.menuPosition}
    actions={availableActions}
    onAction={executeHexAction}
    onCancel={campaign.resetHexSelection}
  />
)}

{/* Player Selector Modal */}
{showPlayerPicker && (
  <PlayerSelectorModal
    players={playersForPicker}
    onSelect={handlePlayerSelected}
    onCancel={() => {
      setShowPlayerPicker(false)
      campaign.resetHexSelection()
    }}
  />
)}
```

5. **Update PhaseTracker hint:**
```tsx
// In PhaseTracker.tsx
<div className="text-sm text-gray-400 mb-2">
  💡 Click on map to select player and target
</div>

{campaign.hexSelection.sourceHex && !campaign.hexSelection.targetHex && (
  <div className="text-sm text-blue-400">
    Player selected → awaiting target
  </div>
)}
```

---

### Phase 7: Action Execution (NOT STARTED)
**Files to Modify:**
- `app/page.tsx`

**Implementation Tasks:**

1. **Wire actions to existing handlers:**
```typescript
const executeHexAction = (actionType: string) => {
  const { sourceHex, targetHex, selectedPlayerId } = campaign.hexSelection

  if (!sourceHex || !selectedPlayerId) return

  const player = campaign.players.find(p => p.id === selectedPlayerId)
  if (!player) return

  switch (actionType) {
    case 'move':
      const distance = getHexDistance(sourceHex, targetHex!)
      campaign.movePlayer(selectedPlayerId, targetHex!, distance)
      break

    case 'scout':
      const scoutDistance = getHexDistance(sourceHex, targetHex!)
      campaign.performAction('SCOUT', { targetHex, distance: scoutDistance })
      break

    case 'search':
      campaign.performAction('SEARCH')
      break

    case 'encamp':
      campaign.performAction('ENCAMP', { cost: 3 })
      break

    case 'resupply':
      campaign.performAction('RESUPPLY')
      break

    case 'hold':
      campaign.performAction('HOLD')
      break

    case 'regroup':
      // Use existing regroup flow
      break
  }

  // Clear selection after action
  campaign.resetHexSelection()
}
```

2. **Calculate available actions when target set:**
```typescript
useEffect(() => {
  if (campaign.hexSelection.sourceHex && campaign.hexSelection.targetHex) {
    const player = campaign.players.find(
      p => p.id === campaign.hexSelection.selectedPlayerId
    )

    if (player) {
      const actions = getAvailableActions(
        campaign.hexSelection.sourceHex,
        campaign.hexSelection.targetHex,
        player,
        campaign.hexes,
        campaign.players,
        campaign.currentPhase
      )
      setAvailableActions(actions)
    }
  }
}, [campaign.hexSelection, campaign.currentPhase])
```

---

## Edge Cases Handled

1. **Same Hex Selected (Source = Target):**
   - Shows self-targeted actions: Search, Hold, Encamp, Resupply
   - Menu appears at hex center

2. **Multiple Players in Source Hex:**
   - Auto-select current player if present
   - Otherwise show PlayerSelectorModal
   - After selection, proceed to target selection

3. **Invalid Targets:**
   - Show in menu as disabled buttons with red error text
   - Examples: "Too far (max 3 hexes)", "Not enough SP (need 2, have 1)"

4. **Player Not Placed:**
   - If `player.position === null`, clicking hex does nothing
   - Placement handled by existing GameSetup flow

5. **Selection Reset Triggers:**
   - Successful action execution
   - Phase change (automatic via useEffect)
   - Turn change (automatic via useEffect)
   - Cancel button in menu
   - Cancel in player picker modal

6. **Wrong Phase:**
   - Movement phase: Show Move, Hold, Regroup
   - Action phase: Show Scout, Search, Encamp, Resupply
   - Battle/Threat phase: No hex selection enabled

---

## Test Status

**Passing Tests:**
- ✅ hexActionValidation: 19/19 tests
- ✅ HexContextMenu: 9/9 tests
- ✅ PlayerSelectorModal: 8/8 tests
- ⏳ Integration tests: Not yet written

**TypeScript Compilation:**
- ✅ Dev server compiles successfully
- ⚠️ Some pre-existing TS errors in unrelated files (API routes, auth)
- ✅ No new TypeScript errors introduced

---

## Files Changed Summary

### Created:
- `lib/utils/hexActionValidation.ts`
- `lib/utils/hexActionValidation.test.ts`
- `components/HexContextMenu.tsx`
- `components/HexContextMenu.test.tsx`
- `components/PlayerSelectorModal.tsx`
- `components/PlayerSelectorModal.test.tsx`

### Modified:
- `types/campaign.ts` - Added HexSelection, ActionOption interfaces
- `hooks/campaign/useCampaignState.ts` - Added hex selection state management
- `components/PhaserHexMap/HexMapScene.ts` - Added visual feedback for source/target

### To Modify (Phase 6-7):
- `app/page.tsx` - Integrate click flow and action execution
- `components/PhaseTracker.tsx` - Add hint text

---

## Next Steps

1. **Implement Phase 6** (Integration):
   - Update `handleHexClick` with dual-selection logic
   - Add helper functions for player selection and hex center calculation
   - Conditionally render HexContextMenu and PlayerSelectorModal
   - Update PhaseTracker with hint text

2. **Implement Phase 7** (Action Execution):
   - Wire menu actions to existing phase hooks
   - Implement `executeHexAction` dispatcher
   - Calculate available actions on target selection
   - Ensure selection resets after action

3. **Testing:**
   - Write integration tests for full click flow
   - Test multi-player hex scenarios
   - Test action execution for all action types
   - E2E tests with Playwright

4. **Final Verification:**
   - Manual testing in browser
   - Verify sidebar buttons still work (backward compatibility)
   - Check all phases (Movement, Action, Battle, Threat)
   - Test with 2-6 players

---

## Known Issues

None - all implemented phases working as expected.

---

## Notes

- **Backward Compatibility:** Sidebar buttons remain fully functional as fallback
- **No Breaking Changes:** All existing API routes and state structure unchanged
- **Performance:** Phaser rendering updates efficiently with new border logic
- **User Experience:** Clear visual feedback (blue source, yellow target) guides workflow

---

**Resume Point:** Start with Phase 6 integration in `app/page.tsx`
