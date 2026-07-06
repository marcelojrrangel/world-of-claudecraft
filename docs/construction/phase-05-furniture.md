### Starter Prompt
```
This is Phase 5 of the Construction System feature: Furniture & decoration.

Model: default (xhigh effort for the placement mechanics).
Harness: OpenCode.

Goal: Add furniture items that players can place inside their house interior.
Free-placement mode with grid snapping, rotation, collision prevention, and
persistence. Furniture has 5 tiers (rustic → sturdy → ornate → exquisite → masterwork).

STEP 0 - PRE-FLIGHT:
- Verify `git status` is clean.

STEP 1 - LOAD CONTEXT:
Spawn an explore agent to read and return:
- docs/construction/state.md (Phase 5 deliverables)
- docs/construction/progress.md (Phase 5 checklist)
- docs/construction/phase-03-instance.md (how interior works)

Then read directly:
- src/sim/types.ts: PlacedAsset (~2040-2048), InvSlot.instance (~instance payload)
- src/sim/content/items.ts: item patterns (look at the bag items for bagSlots)
- src/sim/bags.ts: how bag slots work (pattern for chest storage)
- src/render/placed_assets.ts: how placements render
- src/editor/custom_map.ts: placementsToRenderAssets pattern
- src/editor/placement_transform_core.ts: placement math (scale, rotation)
- src/sim/professions/construction/housing.ts (Phase 3 result)
- src/sim/professions/construction/blueprints.ts (Phase 4 result)

STEP 2 - EXECUTE:

A. Define interior tile grid constants in src/sim/types.ts:
   ```typescript
   export const INTERIOR_GRID_SIZE = 0.5;      // 0.5 yard grid
   export const INTERIOR_WALL_THICKNESS = 0.3;
   export const FURNITURE_MIN_DIST = 0.5;       // minimum gap between items
   ```

B. Add furniture items to src/sim/content/construction_items.ts
   Each furniture item has:
   - kind: 'tool' (reusable, placed in house)
   - quality: tier-based (common through legendary)
   - use: { type: 'placeFurniture' } (a new ItemUse variant)

   5 tiers of furniture, 4 items per tier:

   **Tier 1 — Rustic** (quality: common)
   - rustic_chair: "Wobbly Stool", sellValue: 5
   - rustic_table: "Rough-Cut Table", sellValue: 8
   - rustic_bed: "Straw Bedroll", sellValue: 10
   - rustic_shelf: "Nailed Shelf", sellValue: 6

   **Tier 2 — Sturdy** (quality: common)
   - sturdy_chair: "Oak Chair", sellValue: 20
   - sturdy_table: "Sturdy Work Table", sellValue: 30
   - sturdy_bed: "Hay-Stuffed Mattress", sellValue: 40
   - sturdy_cupboard: "Oak Cupboard", sellValue: 35

   **Tier 3 — Ornate** (quality: uncommon)
   - ornate_chair: "Carved Armchair", sellValue: 80
   - ornate_table: "Polished Dining Table", sellValue: 100
   - ornate_bed: "Feather Bed with Canopy", sellValue: 150
   - ornate_bookshelf: "Tall Bookshelf", sellValue: 120

   **Tier 4 — Exquisite** (quality: rare)
   - exquisite_chair: "Velvet Throne Chair", sellValue: 300
   - exquisite_table: "Marble-Top Table", sellValue: 400
   - exquisite_bed: "Four-Poster King Bed", sellValue: 500
   - exquisite_cabinet: "Mahogany Display Cabinet", sellValue: 450

   **Tier 5 — Masterwork** (quality: epic)
   - masterwork_chair: "Enchanted Floating Stool", sellValue: 1000
   - masterwork_table: "Crystal-Edged Banquet Table", sellValue: 1500
   - masterwork_bed: "Dreamwoven Canopy Bed", sellValue: 2000
   - masterwork_armoire: "Boundless Armoire", sellValue: 1800

C. Add `ItemUse` variant in types.ts:
   ```typescript
   | { type: 'placeFurniture' }
   ```

D. Create furniture placement in housing.ts (or a new furniture.ts):
   - `placeFurniture(ctx, itemId, x, z, rotY, pid)`:
     - Validate: player is in house interior, item is furniture, valid coords
       (inside room bounds), not overlapping existing furniture
     - Remove item from inventory (count: 1)
     - Add to PlayerMeta.construction.furniture array with unique id
   - `moveFurniture(ctx, placedId, x, z, rotY, pid)`:
     - Find placed item, validate ownership, check new coords, update position
   - `removeFurniture(ctx, placedId, pid)`:
     - Find and remove from array, add item back to inventory
   - Grid snapping: round x,z to nearest INTERIOR_GRID_SIZE (0.5yd)
   - Collision: check against room walls and other placed furniture using
     simple AABB checks

E. Update IWorld:
   ```typescript
   readonly placedFurniture: PlacedFurnitureView[];
   placeFurniture(itemId: string, x: number, z: number, rotY: number): void;
   moveFurniture(placedId: string, x: number, z: number, rotY: number): void;
   removeFurniture(placedId: string): void;
   ```

F. Persistence:
   - furniture array saved/loaded in CharacterState JSONB under building.furniture
   - Each item has a unique id (can use a counter or UUID)

G. Tool gating for furniture:
   - Same construction tool tiers gate which furniture tier you can place
   - Tier 1 tool → rustic furniture only
   - Tier 3 tool → up to ornate
   - Tier 5 tool → all tiers

INVARIANTS:
- Furniture placement happens server-side (authoritative)
- Grid snapping ensures deterministic placement
- Collision check prevents overlap
- Items return to inventory on removal (no loss)

Out of scope:
- Visual rendering of furniture in the 3D view (renderer work in Phase 7 or 8)
- Furniture physics (no knocking things over)
- Recoloring / customization

STEP 3 - VALIDATION:
- `npx tsc --noEmit` green
- Manual: enter house, place furniture, verify it appears in state, move it, remove it
- Furniture persists across save/load

STEP 4 - COMMIT:
1. `feat(construction): add furniture items across 5 tiers`
2. `feat(construction): implement furniture placement mechanics`
3. `feat(construction): add furniture persistence and IWorld surface`

STEP 5 - ACCEPTANCE:
- [ ] 20 furniture items defined (5 tiers × 4 items each)
- [ ] placeFurniture validates room bounds and checks collisions
- [ ] moveFurniture updates position with grid snapping
- [ ] removeFurniture returns item to inventory
- [ ] placedFurniture read surface exposed via IWorld
- [ ] Furniture persists across save/load
- [ ] tsc green
```
