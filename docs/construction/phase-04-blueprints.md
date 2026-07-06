### Starter Prompt
```
This is Phase 4 of the Construction System feature: Blueprint construction.

Model: default (xhigh effort for the blueprint mechanics + skill curve).
Harness: OpenCode.

Goal: Implement the core construction loop — learning blueprints, building phases,
consuming materials, gaining skill. The six house tiers (tent → shack → cottage →
house → manor → estate) each have 5 construction phases (foundation → frame →
walls → roof → details). Players progress by building each phase.

STEP 0 - PRE-FLIGHT:
- Verify `git status` is clean.

STEP 1 - LOAD CONTEXT:
Spawn an explore agent to read and return:
- docs/construction/state.md (Phase 4 deliverables)
- docs/construction/progress.md (Phase 4 checklist)
- docs/construction/phase-02-materials.md (what items exist)

Then read directly:
- src/sim/professions/types.ts: ProfessionRecipeRecord shape (~50 lines)
- src/sim/professions/gathering.ts: The harvest pattern — resolveHarvest,
  rollMaterialRarity, skill gain queue/drain pattern (~100 lines)
- src/sim/professions/wheel.ts: gainCraftSkill pattern (~57 lines)
- src/sim/sim.ts: drainGatheringGrants pattern (~2811 line area), player tick loop
- src/sim/professions/construction/housing.ts (should exist from Phase 3)
- src/world_api/construction.ts (should exist from Phase 1)
- src/sim/content/construction_items.ts (should exist from Phase 2)
- src/sim/professions/tools.ts: canGatherTier pattern (~30 lines)

STEP 2 - EXECUTE:

A. Create src/sim/content/blueprints.ts
   Define the 6 house blueprints as data, each with 5 phases:

   Each blueprint has:
   ```typescript
   export interface BlueprintDef {
     id: string;              // e.g. "blueprint_wooden_shack"
     name: string;            // "Wooden Shack"
     tier: number;            // 1-6
     itemId: string;          // the learn scroll item id
     requiredSkill: number;   // min skill to begin this blueprint
     phases: BlueprintPhase[];
   }
   export interface BlueprintPhase {
     index: number;           // 0-4 (foundation=0, frame=1, walls=2, roof=3, details=4)
     nameId: string;          // i18n key part: "foundation" / "frame" / "walls" / "roof" / "details"
     materials: { itemId: string; count: number }[];
     toolTier: number;        // min tool tier required
     skillGain: number;       // construction skill XP awarded
     trivialAt: number;       // skill where this phase stops granting skill
   }
   ```

   Define the 6 blueprints:

   **Tier 1 — Builder's Tent** (skill 1)
   - foundation: 5 rough_stone, 2 raw_lumber, tool tier 1, gain 2, trivial 25
   - frame: 3 raw_lumber, 2 sawed_plank, tool tier 1, gain 2, trivial 25
   - walls: 4 canvas_scrap, 3 raw_lumber, tool tier 1, gain 2, trivial 25
   - roof: 3 canvas_scrap, 2 rough_stone, tool tier 1, gain 2, trivial 25
   - details: 1 bedroll (new item), 1 candle, tool tier 1, gain 2, trivial 30

   **Tier 2 — Wooden Shack** (skill 25)
   - foundation: 10 rough_stone, 5 clay_lump, tool tier 1, gain 3, trivial 50
   - frame: 8 raw_lumber, 10 sawed_plank, 10 iron_nail, tool tier 1, gain 3, trivial 50
   - walls: 12 sawed_plank, 10 iron_nail, tool tier 1, gain 3, trivial 50
   - roof: 10 clay_tile, 6 sawed_plank, tool tier 1, gain 3, trivial 55
   - details: 1 door_wooden, 1 window_shutter, tool tier 1, gain 3, trivial 55

   **Tier 3 — Timber Cottage** (skill 75) [tool tier 2]
   - foundation: 15 cut_stone, 8 limestone_mortar, tool tier 2, gain 4, trivial 100
   - frame: 12 sawed_plank, 15 iron_nail, 4 iron_hinge, tool tier 2, gain 4, trivial 100
   - walls: 20 sawed_plank, 5 limestone_mortar, tool tier 2, gain 4, trivial 100
   - roof: 15 clay_tile, 8 sawed_plank, tool tier 2, gain 4, trivial 105
   - details: 1 door_sturdy, 2 glass_pane, tool tier 2, gain 4, trivial 105

   **Tier 4 — Stone House** (skill 150) [tool tier 3]
   - foundation: 25 granite_block, 15 limestone_mortar, tool tier 3, gain 5, trivial 180
   - frame: 20 reinforced_beam, 20 iron_nail, 8 iron_hinge, tool tier 3, gain 5, trivial 180
   - walls: 30 granite_block, 20 limestone_mortar, tool tier 3, gain 5, trivial 180
   - roof: 20 fired_brick, 10 clay_tile, tool tier 3, gain 5, trivial 185
   - details: 1 door_ironbound, 4 glass_pane, 2 iron_grille, tool tier 3, gain 5, trivial 185

   **Tier 5 — Country Manor** (skill 200) [tool tier 4]
   - foundation: 40 marble_block, 25 limestone_mortar, tool tier 4, gain 6, trivial 230
   - frame: 30 reinforced_beam, 30 iron_nail, 12 iron_hinge, tool tier 4, gain 6, trivial 230
   - walls: 50 marble_block, 30 limestone_mortar, tool tier 4, gain 6, trivial 230
   - roof: 30 fired_brick, 20 clay_tile, 5 glass_pane, tool tier 4, gain 6, trivial 235
   - details: 2 door_ironbound, 6 crystal_pane, 3 iron_grille, tool tier 4, gain 6, trivial 235

   **Tier 6 — Grand Estate** (skill 250) [tool tier 5]
   - foundation: 60 rune_carved_stone, 40 enchanted_lumber, tool tier 5, gain 8, trivial 300
   - frame: 50 enchanted_lumber, 40 iron_nail, 20 iron_hinge, tool tier 5, gain 8, trivial 300
   - walls: 60 rune_carved_stone, 40 enchanted_lumber, tool tier 5, gain 8, trivial 300
   - roof: 40 fired_brick, 30 clay_tile, 10 crystal_pane, tool tier 5, gain 8, trivial 300
   - details: 2 door_runic, 10 crystal_pane, 5 rune_carved_stone, tool tier 5, gain 8, trivial 300

   Also create BLUEPRINTS: BlueprintDef[] array and a by-id lookup function.

B. Implement blueprint mechanics in src/sim/professions/construction/blueprints.ts
   - `learnBlueprint(ctx, itemId, pid)`: validates construction scroll item,
     adds to PlayerMeta.construction.knownBlueprints if not already known
   - `buildPhase(ctx, pid)`: find the current blueprint (based on tier),
     find the next incomplete phase, validate materials (player has them and
     tool tier meets requirement), consume materials, increment phase, award
     skill via gainConstructionSkill
   - `gainConstructionSkill(meta, amount)`: following the queue+grant pattern
     from gathering.ts (queue in pendingGrants, drain in tick loop)
   - `drainConstructionGrants(meta)`: called in tick(), same as gathering grants
   - `canBuildNextPhase(ctx, pid)`: check if player meets all requirements
   - `nextBlueprintForTier(tier)`: map tier 1-6 to blueprint id

C. Tie to item use:
   - In src/sim/items.ts useItem(), add a branch for construction scroll items:
     if item has a special handler, forward to learnBlueprint

D. Update IWorld (src/world_api/construction.ts) and implement:
   ```typescript
   readonly knownBlueprints: string[];       // blueprint IDs player knows
   readonly currentHouseProgress: {          // current phase progress
     blueprintId: string;
     currentPhase: number;      // 0-4 (0 = not started, 5 = complete)
     totalPhases: number;       // always 5
   } | null;
   buildPhase(): void;                       // build next phase
   learnBlueprint(itemId: string): void;     // learn from scroll
   ```
   Plus wire keys for new read fields.

E. Skill gain curve:
   - Construction skill 0-300
   - Each phase awards skillGain (2-8 per phase)
   - Once skill >= trivialAt for a phase, that phase awards 0 skill
   - Soft cap at 300 (can't exceed)
   - normalizeConstructionSystem now preserves skill

F. Tool gating:
   - In buildPhase, check if player has a tool with tier >= phase.toolTier
     in their inventory or equipped
   - Use canGatherTier from tools.ts (reuse the function)

INVARIANTS:
- All RNG comes from ctx.rng.next() (used if we add material waste chance etc.)
- Material consumption uses existing ctx.addItem/removeItem
- Skill gain uses the queue+grant pattern (deterministic, deferred to tick)
- Blueprint data is pure content (no runtime logic)

Out of scope:
- Visual model changes on the exterior (Phase 8)
- Furniture (Phase 5)
- Benefits (Phase 6)
- UI (Phase 7)

STEP 3 - VALIDATION:
- `npx tsc --noEmit` green
- Manual: learn blueprint via item use, build phases, verify skill goes up
- Edge case: skill > trivialAt → 0 skill gain
- Edge case: missing materials → error (phase not built)
- Edge case: missing tool → error

STEP 4 - COMMIT:
1. `feat(construction): add blueprint definitions for tiers 1-6`
2. `feat(construction): implement learnBlueprint and buildPhase mechanics`
3. `feat(construction): add tool gating and skill gain queue`

STEP 5 - ACCEPTANCE:
- [ ] 6 blueprints defined with 5 phases each (~150 lines total data)
- [ ] learnBlueprint adds knownBlueprints to PlayerMeta
- [ ] buildPhase validates materials, tool tier, and prerequisites
- [ ] Materials consumed from inventory on phase build
- [ ] Skill gain queued and drained in tick loop
- [ ] Trivial-at threshold stops skill gain
- [ ] Tool tier gating works (reuses canGatherTier)
- [ ] IWorld exposes building progress
- [ ] tsc green
```
