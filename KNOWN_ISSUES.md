# Known Issues

## Phaser Hex Map Texture Rendering Issue

**Status:** Fixed - Pending User Verification
**Priority:** Medium
**Affected Component:** `components/PhaserHexMap/HexMapScene.ts`
**Fix Date:** 2026-01-17

### Description

Hex tiles render as green wireframe outlines instead of displaying the loaded PNG texture sprites on initial page load. The textures appear correctly after clicking on any hex, indicating the issue is with initial rendering timing, not asset loading.

### Symptoms

1. **Initial Load:** Hexagons display as green wireframe outlines (Phaser debug mode)
2. **After Interaction:** Click on any hex → all textures render correctly
3. **Page Refresh:** Issue returns, requiring another click to fix

### Technical Details

**Assets Loading Successfully:**
- Network tab shows all 4 PNG files load with 200 OK status
- Files are valid PNG images (65x89, 8-bit RGBA)
- Textures exist in Phaser's texture manager (`textures.exists()` returns `true`)

**Scene Lifecycle:**
```
1. Game created → Scene auto-starts with empty data
2. 'ready' event → scene.restart() called with actual game data
3. restart() triggers: init() → preload() → create()
4. Sprites created with valid texture keys
5. BUT: Textures not rendering (green wireframes shown)
```

**Current Texture Loading Logic:**
```typescript
// HexMapScene.ts:72-84
preload() {
  const texturesLoaded = this.game.registry.get('hexTexturesLoaded')

  if (!texturesLoaded) {
    this.game.registry.set('hexTexturesLoaded', true)
    this.load.image('surface-unexplored', '/assets/hexes/surface-unexplored.png')
    this.load.image('surface-explored', '/assets/hexes/surface-explored.png')
    this.load.image('tomb-unexplored', '/assets/hexes/tomb-unexplored.png')
    this.load.image('tomb-explored', '/assets/hexes/tomb-explored.png')
  }
}
```

### What Works

✅ Click alignment is correct (Phase 2 fix successful)
✅ No "Texture key already in use" console errors
✅ PNG assets load successfully from `/public/assets/hexes/`
✅ Textures render after user interaction (click)
✅ Game registry prevents duplicate texture loading on scene restarts

### What Doesn't Work

❌ Initial texture rendering on page load
❌ Textures bound to WebGL context properly on first render

### Hypothesis

The issue appears to be a WebGL texture binding problem:
- Textures are loaded into Phaser's texture manager
- But they're not properly bound to the WebGL rendering context on initial `create()`
- User interaction (click) triggers a scene redraw via `updateData()`, which rebinds textures correctly

### Potential Solutions to Investigate

1. **Force texture refresh after preload:**
   - Add `this.textures.on('onload', ...)` listener in `preload()`
   - Manually trigger texture binding after load completes

2. **Delay initial render:**
   - Wait for texture loading completion before calling `create()`
   - Use loader's `'complete'` event to ensure textures are fully processed

3. **Avoid scene restart pattern:**
   - Don't call `scene.restart()` after initial auto-start
   - Pass initial data to scene config instead
   - Only use `updateData()` for subsequent updates

4. **WebGL context initialization:**
   - Investigate if WebGL context is ready when sprites are created
   - May need to defer sprite creation until after first render frame

### Workaround

Click on any hex to trigger texture rendering. This is a UX issue but doesn't block functionality.

### Files Involved

- `components/PhaserHexMap/HexMapScene.ts` - Scene with texture loading logic
- `components/PhaserHexMap.tsx` - React wrapper that initializes Phaser game
- `public/assets/hexes/*.png` - Texture assets (confirmed valid)

### Related Work

- **Phase 1 Complete:** Sprite-based rendering implemented (#000 - see implementation plan)
- **Phase 2 Complete:** Click offset alignment fixed
- **Phase 3 Needed:** Texture rendering initialization

### Browser Testing Evidence

Testing via Claude-in-Chrome confirmed:
- Network requests show textures load successfully (200 OK)
- Console shows no errors during initialization
- Visual inspection shows green wireframes instead of textures
- Click interaction fixes rendering immediately

### Fix Implementation (2026-01-17)

**Solution:** Load Event Listener with Deferred Initialization

The fix addresses the root cause by ensuring sprites are only created after textures are fully bound to the WebGL context:

1. **Added `texturesReady` boolean flag** to track texture loading state
2. **Skip empty data lifecycle:** `preload()` and `create()` now skip execution on first lifecycle (empty data)
3. **Load event listener:** Use `load.once('complete')` to set `texturesReady` flag when textures finish loading
4. **Deferred initialization:** If textures aren't ready in `create()`, defer scene setup by one frame (16ms at 60fps)
5. **Code organization:** Extracted `initializeScene()`, `setupCamera()`, and `centerCamera()` helper methods (keeps `create()` under 20 lines)

**Changed Files:**
- `components/PhaserHexMap/HexMapScene.ts` - Added texture ready flag, deferred initialization logic, and helper methods

**Testing Required:**
- [ ] Initial page load shows PNG textures (no green wireframes)
- [ ] Scene restart works correctly with cached textures
- [ ] Network throttling doesn't break rendering
- [ ] Multiple campaign sessions work correctly
- [ ] Console shows correct log sequence: `Skipping preload → Loading textures → Textures loaded → Textures ready: true → Initializing scene`

---

**Last Updated:** 2026-01-17
**Reported By:** Phase 2 Testing
**Fixed By:** Texture loading event listener implementation
