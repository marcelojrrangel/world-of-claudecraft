### Starter Prompt
```
This is Phase 8 of the Construction System feature: Polish & balance.

Model: default.
Harness: OpenCode.

Goal: Final sweep — balance material costs and skill XP curve, add determinism
tests and i18n tests, optimize performance, render the house exterior/interior
models, and run the full QA gate.

STEP 0 - PRE-FLIGHT:
- Verify `git status` is clean.

STEP 1 - LOAD CONTEXT:
Spawn an explore agent to read and return:
- docs/construction/state.md (validation matrix, all file paths)
- docs/construction/progress.md (final checklist)
- docs/construction/qa-checklist.md (full matrix)
- docs/construction/phase-02-materials.md (material costs)
- docs/construction/phase-04-blueprints.md (blueprint definitions)
- docs/construction/phase-06-benefits.md (bonus values)

Then read:
- src/render/dungeon.ts: how dungeon interiors are rendered (for house interior)
- src/render/placed_assets.ts: how placements render (for furniture)
- src/render/gather_nodes.ts: how gather nodes render (3D model placement pattern)
- src/sim/types.ts: GatherNodeDef, BuildingDef shapes
- Existing tests directory for patterns: tests/gather_node_harvest.test.ts
- tests/architecture.test.ts (sim-purity guard)
- tests/localization_fixes.test.ts (S3 drift guard)
- tests/snapshots.test.ts (wire parity)
- server/game.ts: how new commands are dispatched
- src/sim/social/chat.ts: how chat commands are added (for /house commands)

STEP 2 - EXECUTE:

A. Balance pass:
   - Review material counts per blueprint phase (are they reasonable?)
     Current: tent ~15 items, shack ~50, cottage ~60, house ~100, manor ~150, estate ~250
     Goal: tent should be achievable in ~5 minutes of gathering; estate in days.
   - Adjust skill gain curve: 0-100 fast (~1 phase per level), 100-200 moderate
     (~2 phases per level), 200-300 slow (~3-4 phases per level).
     Total phases to reach 300 from all blueprints: tent 5×2=10, shack 5×3=15,
     cottage 5×4=20, house 5×5=25, manor 5×6=30, estate 5×8=40 = ~140 phase builds
     Enough to reach 300 if each averages ~2.5 skill gain. Good.
   - Adjust tool costs at vendors (tier 1: 50c, tier 5: 2000g)
   - Adjust plot prices (500g for basic plot, 5000g for premium)
   - Adjust rested XP multiplier (1.5x tent → 6x estate)
   - Adjust station bonuses (+2 rustic → +10 masterwork)
   - Adjust chest sizes (small 6, ironbound 12, rune-sealed 24)

B. Render the house exterior:
   - src/render/house_exterior.ts: For each tier 1-6, define a visual model
     using the existing KayKit GLB asset system (or ask: do we need new models?)
   - Simplest approach: place a group of building GLBs from the catalog
     (props/house_1, props/house_2, props/house_3) scaled and positioned
     to represent the exterior at each tier
   - Update when tier changes (via construction miletone SimEvent)
   - Apply the same collider update (rebuild static colliders when phase upgrades)

C. Render furniture in the interior:
   - src/render/house_interior.ts: For each placed furniture item in the
     house instance, create a visual representation using GLB models
   - Use the same PlacedAsset rendering pipeline as the editor
   - Grid snapping should match the 0.5yd grid from Phase 5
   - Handle add/move/remove via SimEvents

D. Add /house chat commands:
   - `/house` — shows status (plot info, tier, phase)
   - `/house enter` — enter own house (if at plot)
   - `/house leave` — leave house
   - `/house visit <name>` — visit friend's house
   - `/house perm <private|friends|public>` — set permission
   - Follow existing chat command pattern in src/sim/social/chat.ts

E. Write tests:

   tests/construction_skill.test.ts:
   - normalizeConstructionSystem with null/partial/complete input
   - gainConstructionSkill with various amounts
   - Skill capped at 300
   - Trivial phase stops skill gain

   tests/blueprints.test.ts:
   - learnBlueprint adds to knownBlueprints
   - buildPhase consumes correct materials
   - buildPhase fails with missing materials
   - buildPhase fails with wrong tool tier
   - Blueprint phase advancement (index 0→1→2→3→4→complete)
   - Complete 5 phases on tent blueprint

   tests/housing.test.ts:
   - buyPlot assigns plot
   - buyPlot fails when already owned (both during session and persisted)
   - buyPlot fails without enough gold
   - enterHouse creates instance
   - leaveHouse teleports back
   - Only one plot per player

   tests/construction_i18n.test.ts:
   - S3 drift guard catches all construction emit strings
   - Add matchers for all construction SimEvents

   tests/construction_determinism.test.ts:
   - Same seed + same plot → same interior layout
   - Same seed + same materials → same build outcome

F. Run full validation:
   - `npm test` green
   - `npx tsc --noEmit` green
   - `npm run build:env` green
   - `npm run build:server` green
   - `npm run build` green
   - `npm run ci:changed` green

INVARIANTS:
- All tests must be meaningful (not just "it runs")
- Determinism tests use fixed RNG seed
- No src/sim/ imports from render/ui/game/net
- S3 drift guard covers every new player-visible string

Out of scope:
- New GLB model creation (use existing catalog)
- Animated house construction (e.g. hammers swinging)
- House music / ambient sounds

STEP 3 - VALIDATION:
Full CI-equivalent gate:
```
npm test && npx tsc --noEmit && npm run build:env && npm run build:server && npm run build
```

STEP 4 - COMMIT:
1. `feat(construction): balance material costs and skill XP curve`
2. `feat(construction): add exterior and interior rendering`
3. `feat(construction): add /house chat commands`
4. `test(construction): add construction tests (skill, blueprints, housing, i18n, determinism)`
5. `chore(construction): final polish and QA fixes`

STEP 5 - ACCEPTANCE:
- [ ] Balance pass: costs feel right, progression curve smooth
- [ ] House exterior renders correctly per tier
- [ ] Furniture renders in interior (using PlacedAsset pipeline)
- [ ] /house commands work: status, enter, leave, visit, perm
- [ ] All construction test suites pass
- [ ] Determinism tests: same seed = same layout
- [ ] S3 i18n guard catches all construction text
- [ ] Full CI-equivalent gate green
- [ ] Final QA gate passes (qa-checklist.md)
```
