### Starter Prompt
```
This is Phase 2 of the Construction System feature: Materials & items.

Model: default.
Harness: OpenCode.

Goal: Create the construction material chain — raw items from gathering professions,
refined items, construction hand tools (tiers 1-5), and blueprint scroll items.
Wire the materials into the existing item system and vendors.

STEP 0 - PRE-FLIGHT:
- Verify `git status` is clean.

STEP 1 - LOAD CONTEXT:
Spawn an explore agent to read and return:
- docs/construction/state.md (Phase 2 deliverables)
- docs/construction/progress.md (Phase 2 checklist)

Then read directly (small files):
- src/sim/content/items.ts (BASE_ITEMS, ItemDef structure, fishing pole example
  for a tool, ~1529 lines — read only the first 100 and last 100, grep for patterns)
- src/sim/professions/tools.ts (GatherToolUse, canGatherTier pattern, ~40 lines)
- src/sim/data.ts (mergeItems, ITEMS registration, ~310 lines)
- src/sim/content/zone1.ts (vendor items list — find the vendor NPC defs with
  vendorItems array)
- src/sim/types.ts (ItemUse type with gatherTool, lines ~274-284)

STEP 2 - EXECUTE:

A. Create raw material items in a NEW file src/sim/content/construction_items.ts
   (following the data-as-code pattern of items.ts, NOT appending to the big file).
   Each is kind: 'junk' with quality based on tier.

   Raw materials (from gathering nodes — these are the direct node drops):
   - rough_stone: "Rough Stone", quality: poor, sellValue: 2
   - clay_lump: "Lump of Clay", quality: poor, sellValue: 2
   - raw_lumber: "Raw Lumber", quality: poor, sellValue: 3
   - iron_ore_chunk: "Iron Ore Chunk", quality: common, sellValue: 5
   - limestone_chunk: "Limestone Chunk", quality: poor, sellValue: 2
   - sand_bag: "Bag of Sand", quality: common, sellValue: 4

   Refined materials (crafted from raw — manual creation for now since the crafting
   system isn't live yet):
   - cut_stone: "Cut Stone", quality: common, sellValue: 8
   - fired_brick: "Fired Brick", quality: common, sellValue: 10
   - sawed_plank: "Sawed Wooden Plank", quality: common, sellValue: 6
   - iron_nail: "Iron Nail", quality: common, sellValue: 4 (stackSize: 50)
   - clay_tile: "Clay Roof Tile", quality: common, sellValue: 10
   - glass_pane: "Glass Pane", quality: uncommon, sellValue: 25
   - limestone_mortar: "Limestone Mortar", quality: common, sellValue: 5
   - marble_block: "Marble Block", quality: rare, sellValue: 100
   - enchanted_lumber: "Enchanted Lumber", quality: epic, sellValue: 500

   Special materials (higher tiers):
   - iron_hinge: "Iron Hinge", quality: common, sellValue: 12
   - reinforced_beam: "Reinforced Wooden Beam", quality: uncommon, sellValue: 40
   - granite_block: "Granite Block", quality: uncommon, sellValue: 35
   - crystal_pane: "Crystal Window Pane", quality: epic, sellValue: 300
   - rune_carved_stone: "Rune-Carved Stone", quality: legendary, sellValue: 1200

B. Create construction tool items in the SAME file.
   Follow the fishing pole pattern (kind: 'tool', use: gatherTool):
   - trowel_t1: "Builder's Trowel", tier: 1, sellValue: 10, buyValue: 50
   - carpenter_hammer_t2: "Carpenter's Hammer", tier: 2, sellValue: 25, buyValue: 125
   - frame_saw_t3: "Frame Saw", tier: 3, sellValue: 60, buyValue: 300
   - builder_level_t4: "Builder's Level", tier: 4, sellValue: 150, buyValue: 750
   - master_mallet_t5: "Master Builder's Mallet", tier: 5, sellValue: 400, buyValue: 2000

C. Create blueprint scroll items in the SAME file.
   kind: 'tool' (reusable pattern), use: some kind of learn action or just
   right-click to learn (simple: define as kind: 'quest' for now, consumed on use).
   - blueprint_tent: "Blueprint: Builder's Tent", quality: common, sellValue: 1
     (no-buy: only obtained through quest)
   - blueprint_wooden_shack: "Blueprint: Wooden Shack", quality: common,
     buyValue: 100
   - blueprint_timber_cottage: "Blueprint: Timber Cottage", quality: uncommon,
     buyValue: 500
   - blueprint_stone_house: "Blueprint: Stone House", quality: rare, buyValue: 2000
   - blueprint_manor: "Blueprint: Country Manor", quality: epic, buyValue: 8000
   - blueprint_grand_estate: "Blueprint: Grand Estate", quality: legendary,
     buyValue: 25000

D. Register in src/sim/data.ts:
   - Add `import { CONSTRUCTION_ITEMS } from './content/construction_items'`
   - Add to mergeItems call (following the pattern of ZONE2_ITEMS, etc.)

E. Add to vendor:
   - Edit the Eastbrook general goods vendor in zone1.ts:
     Add construction tools (tiers 1-3) and lower blueprint scrolls to vendorItems
   - Edit the Mirefen general goods vendor in zone2.ts:
     Add construction tools (tiers 3-5) and higher blueprint scrolls

F. Add a simple `LearnBlueprintUse` use type to items if needed, OR handle
   consumption in a generic way (item use dispatches to `learnBlueprint` which
   we stub for Phase 4).

INVARIANTS:
- All items follow the existing ItemDef shape
- Tool items use the existing gatherTool pattern with tier gating
- Nothing in src/sim/ imports from render/ui/game/net
- Vendor items arrays use the same pattern as existing vendors

Out of scope:
- No item use logic yet (learning blueprints comes in Phase 4)
- No gathering node changes (raw materials use existing nodes in Phase 8)
- No refined material crafting recipes
- No UI for construction items

STEP 3 - VALIDATION:
- `npx tsc --noEmit` green
- Verify all items load without errors (run the game briefly)
- Verify vendor shows construction items

STEP 4 - COMMIT:
1. `feat(construction): add construction materials, tools, and blueprint items`
2. `feat(construction): register items in merge chain and add to vendors`

STEP 5 - ACCEPTANCE:
- [ ] 30+ construction items defined in construction_items.ts
- [ ] 5 tool items with proper gatherTool use and tier ascending
- [ ] 6 blueprint scroll items tiered by quality
- [ ] Items registered in mergeItems in data.ts
- [ ] Tools available from vendors (tiers 1-3 in Eastbrook, 3-5 in Mirefen)
- [ ] Basic blueprints available from vendors
- [ ] tsc green
```
