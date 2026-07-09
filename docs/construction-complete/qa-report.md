# Construction System -- QA Report

**Date:** 2026-07-08
**Scope:** Full multi-surface review (sim, render, UI, i18n, guide, build tooling, dev conveniences)
**Methodology:** Automated QA gate + manual adversarial pass

---

## BLOCKING (resolved in commit `563d0560`)

### 1. Arch violation: build_mode_window.ts imported from sim/

**File:** `src/ui/build_mode_window.ts:3`
**Issue:** Imported `isPlaceableFurniture` from `../sim/professions/construction/furniture`, violating the IWorld-only seam rule (`ui/ -> only IWorld, never sim/`).

**Fix:** Added `isPlaceableFurniture(itemId): boolean` to `IWorldConstruction` interface (`src/world_api/construction.ts:60`), implemented in `Sim` (`src/sim/sim.ts:6884`) and `ClientWorld` (`src/net/online.ts:2558`). UI now calls `sim.isPlaceableFurniture(id)` through the seam.

**Files changed:** `world_api/construction.ts`, `sim/sim.ts`, `net/online.ts`, `ui/build_mode_window.ts`

### 2. pedreiro houseTier setter was a silent no-op

**File:** `src/main.ts:2794`
**Issue:** `sim.houseState.houseTier = 1` assigned to a temporary object returned by the getter, not the actual PlayerMeta.construction state. House interior never rendered.

**Fix:** Changed to `sim.players.get(sim.playerId)?.construction.houseTier = 1` which mutates the real backing state.

---

## SHOULD-FIX (resolved)

### 3. Raw item IDs displayed instead of localized names

**Files:** `src/ui/build_mode_window.ts:59,84,92`
**Issue:** Blueprint list, furniture inventory, and placed furniture list showed raw IDs like `blueprint_tent`/`rustic_chair`.

**Fix:** Added `tEntity` import and wrapped all three display sites with `tEntity({ kind: 'item', id, field: 'name' })`.

### 4. Hardcoded English "stations:" in house window

**File:** `src/ui/house_window.ts:32`
**Issue:** String `House stations: {count}` concatenated translated title with untranslated suffix.

**Fix:** Added `hudChrome.construction.house.stations` key to catalog (`src/ui/i18n.catalog/hud_chrome.ts:1335`) and used it via `t()`.

### 5. House interior pitch black (no lights)

**File:** `src/render/house_interior.ts`
**Issue:** `buildHouseInterior` produced only geometry (walls, floor, ceiling). With underground lighting (sun=0.3, hemi=0.22), the scene was effectively black.

**Fix:** Added two warm point lights (`0xffd4a0`, intensity 1.5 + 0.6) to the house group at center height.

### 6. `pedreiro` spawned at wrong z-coordinate

**File:** `src/main.ts`
**Issue:** Teleported to `z=0`, but house slots are at `z=HOUSE_Z0 + slot * HOUSE_SLOT_SPACING = -1250`. The 1250-yard distance from any slot meant `updateAmbience` never built the interior.

**Fix:** Changed teleport target to `z=-1250` (slot 0).

---

## PENDING (not yet fixed)

### 7. Blueprint list items are decorative (no build action)

**File:** `src/ui/build_mode_window.ts:59`
**Issue:** Blueprint buttons have no click handler. `data-bp` attribute is set, but no event listener wires it to `buildBlueprint`. The `Build` button (line 1325 `hudChrome.construction.buildMode.build`) exists in the catalog but is never rendered.

**Impact:** Player cannot trigger construction from the UI. Blocking for Phase 4 tutorial flow.

---

## NOTABLE GAPS (no fix planned yet)

### 8. House permission display is non-functional

**File:** `src/ui/house_window.ts:20`
**Issue:** `(sim as any).setHousePermission?.length > 0 ? 'owner' : ''` always returns `'owner'` because `setHousePermission` always exists and has arity 1. There is no permission read accessor on IWorldConstruction.

### 9. Template-literal emits may escape S3 guard

**File:** `src/sim/professions/construction/furniture.ts:182`
**Issue:** `` ctx.emit({ type: 'log', text: `Placed ${ITEMS[itemId]?.name ?? itemId}.`, pid: ctx.primaryId }) `` is a template literal, not a string literal. The S3 guard (`tests/localization_fixes.test.ts`) only sees string literals at the emit site, so this emit is invisible to the guard.

### 10. Dual-path maintenance: build_mode_window.ts and house_window.ts

Both files render overlapping house state (tier, furniture count, rested bonus, blueprint count). Changes to house display must be mirrored in both.

---

## CLEAN (no issues)

| Area | Verdict |
|------|---------|
| Determinism | All randomness through Rng; no Date.now/Math.random in sim construction code |
| IWorld parity | Sim + ClientWorld both implement IWorldConstruction correctly |
| Wire protocol | Commands registered in COMMAND_NAMES; delta keys in ALL_DELTA_KEYS |
| i18n catalog | English keys in hud_chrome.ts sim_i18n.ts, world_entity_i18n.ts, guide.ts |
| pt_BR locale | Complete: NPC names, quest text, item names, guide prose all translated |
| Guide page | `/wiki/construction` exists, generates from sim data, has full pt_BR support |
| Build | `npm run build` passes |
| Server authority | No server-side gaps; all construction logic is shared sim code |
| Persistence | Construction state goes through existing JSONB path with safe defaults |
| Furniture rendering | InstancedMesh per type, shared geometry + material, exterior LOD cleanup |
| Grid overlay | Consolidated LineSegments instead of individual lines |
| Gather nodes | Now drop rough_stone/raw_lumber; interact key (F) wired to harvestNode |

---

## Commands for a fresh test session

```
1. Hard refresh: Ctrl+Shift+R
2. Create character named: pedreiro
3. Result: spawns at housing district (15000, 0, -1250) with:
   - Tools: copper_mining_pick, handaxe, trowel_t1
   - Materials: 10x rough_stone, 10x raw_lumber, 5x sawed_plank, 10x canvas_scrap
   - Items: bedroll, candle, blueprint_tent, plot_deed
   - House tier: 1 (interior renders with warm lights)
4. Press F: harvest nearby gather nodes (if any)
5. Press F3: open Build Mode window
```

---

## Files modified in this session (chronological)

| Commit | Files | Purpose |
|--------|-------|---------|
| `6144987d` | `pt_BR.ts` | Guide construction page pt_BR translations |
| `8c34aeaa` | `gathering.ts` | Wire NODE_HARVEST_TABLE to construction materials |
| `da81ad8b` | `pt_BR.ts` | Quest translations + fix `$N` placeholders |
| `5e88e030` | `main.ts` | Gather node interact key + pedreiro starter tools |
| `3e290672` | `zone1.ts`, `construction_items.ts`, `pt_BR.ts` | plot_deed ground object + item |
| `183063cc` | `main.ts` | Fix pedreiro z-coordinate |
| `2c5c12a7` | `house_interior.ts` | Add point lights to house interior |
| `00e8eabd` | `main.ts`, `hud.ts` | Guard missing build-mode-window |
| `563d0560` | 31 files | Fix arch violation, houseTier, i18n IDs, stations label |

## TODO before marking complete

1. [ ] Wire blueprint item buttons in build_mode_window.ts to `buildBlueprint`
2. [ ] Implement `RoomView`/`roomCount` or remove unused rooms key from hud_chrome.ts
3. [ ] Register template-literal emits in sim_i18n.ts matcher (or refactor to literal emits)
