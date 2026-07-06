# Progress — Construction System

## Overall status

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| 1 — Data model & profession | complete | 2026-07-06 | 2026-07-06 | |
| 1 QA | pending | — | — | |
| 2 — Materials & items | pending | — | — | |
| 2 QA | pending | — | — | |
| 3 — The house instance | pending | — | — | |
| 3 QA | pending | — | — | |
| 4 — Blueprint construction | pending | — | — | |
| 4 QA | pending | — | — | |
| 5 — Furniture & decoration | pending | — | — | |
| 5 QA | pending | — | — | |
| 6 — Benefits & social | pending | — | — | |
| 6 QA | pending | — | — | |
| 7 — UI & HUD | pending | — | — | |
| 7 QA | pending | — | — | |
| 8 — Polish & balance | pending | — | — | |
| 8 QA | pending | — | — | |

## Acceptance checklists

### Phase 1 — Data model & profession
- [x] `CONSTRUCTION_PROFESSION` defined in `content/professions.ts`
- [x] `ConstructionSystem` + `PlacedFurniture` types added to `types.ts`
- [x] `PlayerMeta.construction` field added (full `ConstructionSystem` shape)
- [x] `IWorldConstruction` facet created in `world_api/construction.ts`, aggregated in `world_api.ts`
- [x] `Sim` implements `IWorldConstruction` (`constructionSkill`/`constructionSkillFor`)
- [x] `ClientWorld` implements `IWorldConstruction` (online mirror from `const` wire delta)
- [x] Wire delta key `const` registered; `maybe('const', ...)` in `server/game.ts`
- [x] Persistence key `building` in `CharacterState` JSONB
- [x] `normalizeConstructionSystem()` for back-compat (safe on missing/null/partial)
- [x] `IWORLD_MEMBERS` updated (+1 member `constructionSkill`, 43 data + 128 method = 171 total)
- [x] `ALL_DELTA_KEYS` (+1 `const`, now 31), `TERSE_TO_IWORLD` updated
- [x] `npx tsc --noEmit` green
- [x] `tests/world_api_parity.test.ts` green (184/184)
- [x] `tests/snapshots.test.ts` green (82/82)
- [x] `tests/command_schema.test.ts` green (10/10)
- [x] `tests/architecture.test.ts` green (24/24)

### Phase 2 — Materials & items
- [ ] 10+ raw material items (rough_stone, clay_lump, raw_lumber, ...)
- [ ] 10+ refined material items (cut_stone, fired_brick, sawed_plank, ...)
- [ ] 5 construction tool items (tier 1–5: trowel, hammer, saw, level, mallet)
- [ ] 6 blueprint scroll items (tent → cottage → house → manor → estate → grand_estate)
- [ ] `NPC_VENDORS` updated to sell tools and basic blueprints
- [ ] Refined material recipes (if crafting system exists; otherwise direct items)
- [ ] All items added to `ITEM_MERGE` chain
- [ ] Items usable in inventory (no errors)
- [ ] `npx tsc --noEmit` green

### Phase 3 — The house instance
- [ ] `buyPlot(plotId)` implemented — validates availability, deducts gold, assigns plot
- [ ] `HouseInstance` type and registry on `Sim`
- [ ] Interior layout generation per house tier (1 room → N rooms)
- [ ] `enterHouse()` → teleport to interior instance (door trigger or command)
- [ ] `leaveHouse()` → teleport back to plot entrance
- [ ] Plot collision (prevent building on taken plots)
- [ ] Plot persistence (save/load house state, assign plot on load)
- [ ] Plot purchase cost (tiered by plot location)
- [ ] `npx tsc --noEmit` green
- [ ] `tests/housing.test.ts` passes

### Phase 4 — Blueprint construction
- [ ] `buildBlueprint(blueprintId)` implemented
- [ ] Phase building: foundation → frame → walls → roof → doors/windows
- [ ] Material consumption at each phase (reagents consumed from inventory)
- [ ] Skill gain on phase completion (scaled by complexity)
- [ ] Trivial-at threshold (no skill gain past grey)
- [ ] Blueprint learning system (use scroll item → learn)
- [ ] Exterior visual tier progression (tent → shack → cottage → house → manor → estate)
- [ ] External collider updates after phase changes
- [ ] Tool tier gating (tier 1 tool can build wood phases, tier 3 for stone, etc.)
- [ ] `npx tsc --noEmit` green
- [ ] `tests/blueprints.test.ts` passes

### Phase 5 — Furniture & decoration
- [ ] Furniture item definitions (chair, table, bed, shelf, rug, lamp, cabinet, ...)
- [ ] Furniture tiers (rustic, sturdy, ornate, exquisite, masterwork)
- [ ] `placeFurniture` — place item at (x, z, rotY) on interior floor grid
- [ ] `moveFurniture` — reposition placed item
- [ ] `removeFurniture` — return item to inventory
- [ ] Grid snapping (0.5yd increments, aligned to room bounds)
- [ ] Collision prevention (furniture can't overlap)
- [ ] Furniture persistence (save/load placed furniture list)
- [ ] Furniture rendered in interior instance
- [ ] `npx tsc --noEmit` green

### Phase 6 — Benefits & social
- [ ] Rested XP accumulation in house (bonus scales by house tier)
- [ ] Crafting station items (workbench, anvil, alchemy station, cooking fire, loom)
- [ ] Station usage grants skill/crafting-time bonus
- [ ] Storage chest items (6–24 slots, persist contents)
- [ ] `visitHouse(pid)` — teleport to friend's house interior
- [ ] House permission system (owner, friend, public)
- [ ] `npx tsc --noEmit` green

### Phase 7 — UI & HUD
- [ ] Build mode HUD panel (blueprint list, phase progress, material requirements)
- [ ] House overview window (tier, rooms, furniture count, rested bonus)
- [ ] Furniture placement controls (pick, move, rotate, remove)
- [ ] Build mode toggle keybind (default: B)
- [ ] i18n keys for all construction UI text
- [ ] S3 drift guard green (`tests/localization_fixes.test.ts`)
- [ ] Mobile touch support for build mode
- [ ] `npx tsc --noEmit` green

### Phase 8 — Polish & balance
- [ ] Recipe balance pass (material costs feel right for each tier)
- [ ] Skill XP curve balanced (1–300: first 100 fast, 200–300 slow)
- [ ] Tool tier costs balanced against material costs
- [ ] Determinism tests (same seed → same build outcomes)
- [ ] `tests/construction_i18n.test.ts` — matchers for all house text
- [ ] `tests/construction_skill.test.ts` — skill gain and normalization
- [ ] Performance: interior furniture chunked loading
- [ ] Performance: exterior LOD for neighborhood rendering
- [ ] `npm test && npx tsc --noEmit && npm run build:env && npm run build:server && npm run build` green
- [ ] Final QA gate passes (see `qa-checklist.md`)

## Notes per phase
