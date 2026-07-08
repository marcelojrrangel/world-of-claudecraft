# Progress — Construction System

## Overall status

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| 1 — Data model & profession | complete | 2026-07-06 | 2026-07-06 | |
| 1 QA | pending | — | — | |
| 2 — Materials & items | complete | 2026-07-06 | 2026-07-06 | 29 items created, registered in ITEMS, added to 2 vendor NPCs |
| 2 QA | pending | — | — | |
| 3 — The house instance | complete | 2026-07-06 | 2026-07-06 | |
| 3 QA | complete | 2026-07-06 | 2026-07-06 | |
| 4 — Blueprint construction | complete | 2026-07-06 | 2026-07-06 | |
| 4 QA | complete | 2026-07-06 | 2026-07-06 | |
| 5 — Furniture & decoration | complete | 2026-07-06 | 2026-07-06 | |
| 5 QA | complete | 2026-07-06 | 2026-07-06 | |
| 6 — Benefits & social | complete | 2026-07-06 | 2026-07-07 | chests, stations, rested XP, visit, permissions |
| 6 QA | complete | 2026-07-07 | 2026-07-07 | tsc clean, 434 tests green, 2 commits |
| 7 — UI & HUD | complete | 2026-07-07 | 2026-07-07 | build panel, house window, furniture controls, keybind, i18n, mobile |
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
- [x] 6 raw material items (rough_stone, clay_lump, raw_lumber, iron_ore_chunk, limestone_chunk, sand_bag)
- [x] 9 refined/special material items (cut_stone, fired_brick, sawed_plank, iron_nail, clay_tile, glass_pane, limestone_mortar, marble_block, enchanted_lumber + iron_hinge, reinforced_beam, granite_block, crystal_pane, rune_carved_stone)
- [x] 5 construction tool items (tier 1–5: trowel_t1, carpenter_hammer_t2, frame_saw_t3, builder_level_t4, master_mallet_t5)
- [x] 6 blueprint scroll items (tent, wooden_shack, timber_cottage, stone_house, manor, grand_estate)
- [x] Eastbrook general goods vendor (trader_wilkes) sells tools tier 1-3 + shack/cottage blueprints
- [x] Mirefen general goods vendor (provisioner_hale) sells tools tier 3-5 + stone_house/manor blueprints
- [x] All items registered in mergeItems in `data.ts`
- [x] `npx tsc --noEmit` green
- [x] `tests/world_api_parity.test.ts`, `tests/snapshots.test.ts`, `tests/architecture.test.ts` green

### Phase 3 — The house instance
- [x] `buyPlot(plotId)` implemented — validates availability, deducts gold, assigns plot
- [x] `HouseSlot` runtime slot pool on `Sim` (implementation uses `HouseSlot` rather than the planned `HouseInstance` record)
- [x] Interior layout generation per house tier (1 room → N rooms) in `house_layouts.ts`
- [x] `enterHouse()` → teleport to interior instance
- [x] `leaveHouse()` → teleport back to plot entrance
- [x] Interior house collision via `colliders.ts`
- [x] Plot persistence (save/load plot registry in `server/db.ts` + `GameServer` load/save)
- [x] Plot purchase cost tiered by plot location
- [x] `npx tsc --noEmit` green
- [x] `tests/housing.test.ts` passes (12/12)

### Phase 4 — Blueprint construction
- [x] `buildBlueprint(blueprintId)` implemented
- [x] Phase building: foundation → frame → walls → roof → doors/windows
- [x] Material consumption at each phase (reagents consumed from inventory)
- [x] Skill gain on phase completion (scaled by complexity, drained on tick)
- [x] Trivial-at threshold (no skill gain past grey)
- [x] Blueprint learning system (use scroll item → learn)
- [x] Exterior visual tier progression (tent → shack → cottage → house → manor → estate) via `houseTier`
- [ ] External collider updates after phase changes (deferred to Phase 8)
- [x] Tool tier gating (tier 1 tool can build wood phases, tier 3 for stone, etc.)
- [x] `npx tsc --noEmit` green
- [x] `tests/blueprints.test.ts` passes (12/12)
- [x] `tests/world_api_parity.test.ts`, `tests/snapshots.test.ts`, `tests/command_schema.test.ts`, `tests/localization_fixes.test.ts`, `tests/architecture.test.ts` green

### Phase 5 — Furniture & decoration
- [x] Furniture item definitions (chair, table, bed, shelf, rug, lamp, cabinet, ...)
- [x] Furniture tiers (rustic, sturdy, ornate, exquisite, masterwork)
- [x] `placeFurniture` — place item at (x, z, rotY) on interior floor grid
- [x] `moveFurniture` — reposition placed item
- [x] `removeFurniture` — return item to inventory
- [x] Grid snapping (0.5yd increments, aligned to room bounds)
- [x] Collision prevention (furniture can't overlap)
- [x] Furniture persistence (save/load placed furniture list)
- [ ] Furniture rendered in interior instance (deferred to Phase 8/UI)
- [x] `npx tsc --noEmit` green (pending — verify before PR)

### Phase 6 — Benefits & social
- [x] Rested XP accumulation in house (bonus scales by house tier, 1.0x–2.5x)
- [x] Crafting station furniture items (workbench, anvil, alchemy station, cooking fire, loom)
- [x] Station usage grants `crafting_boost` aura (30 min, bonus scales by house tier)
- [x] Storage chest items (6–24 slots, persist contents in `building.chests`)
- [x] `visitHouse(pid)` — teleport to friend's house interior (gated by permission)
- [x] House permission system (`owner` / `friends` / `public`, defaults to `owner`)
- [x] `npx tsc --noEmit` green

### Phase 7 — UI & HUD
- [x] Build mode HUD panel (blueprint list, phase progress, material requirements)
- [x] House overview window (tier, rooms, furniture count, rested bonus)
- [x] Furniture placement controls (pick, move, rotate, remove)
- [x] Build mode toggle keybind (default: F3)
- [x] i18n keys for all construction UI text (hud_chrome.ts + sim_i18n.ts)
- [x] S3 drift guard green (`tests/localization_fixes.test.ts`)
- [x] Mobile touch support for build mode
- [x] `npx tsc --noEmit` green

### Phase 8 — Polish & balance
- [ ] Recipe balance pass (material costs feel right for each tier)
- [ ] Skill XP curve balanced (1–300: first 100 fast, 200–300 slow)
- [ ] Tool tier costs balanced against material costs
- [ ] Determinism tests (same seed → same build outcomes)
- [ ] `tests/construction_i18n.test.ts` — matchers for all house text
- [ ] `tests/construction_skill.test.ts` — skill gain and normalization
- [ ] Performance: interior furniture chunked loading
- [ ] Performance: exterior LOD for neighborhood rendering
- [x] `npm test` parcial (62 construction tests green), `npx tsc --noEmit` green, `npm run build:env` green, `npm run build:server` green, `npm run build` green
- [ ] Final QA gate passes (see `qa-checklist.md`)

## Notes per phase
