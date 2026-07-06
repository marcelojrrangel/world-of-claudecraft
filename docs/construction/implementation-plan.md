# Implementation Plan — Construction System

8 implementation phases + 8 QA phases (16 total sessions). Each phase
builds on the previous one. See `state.md` for locked decisions.

## Phase summary

| # | Phase | Area | Delivers | Depends on |
|---|-------|------|----------|------------|
| 1 | Data model & profession | sim | Types, IWorld facet, skill tracking | nothing |
| 2 | Materials & items | sim+content | Construction items, tools, blueprints as items | 1 |
| 3 | The house instance | sim+server | Plot system, house interior instance, enter/exit | 1 |
| 4 | Blueprint construction | sim | Phase building, skill gain, material consumption | 1,2,3 |
| 5 | Furniture & decoration | sim+render | Furniture items, placement mode, interior rendering | 1,2,3 |
| 6 | Benefits & social | sim+server | Rested XP, crafting stations, storage, social visits | 1,3,4 |
| 7 | UI & HUD | ui+game+i18n | Build mode, furniture placement UI, house window | 4,5,6 |
| 8 | Polish & balance | all | Recipe balance, tests, determinism, performance | all |

## Canonical workflow (every phase)

1. **Pre-flight**: `git status` clean; read `state.md` locked decisions and
   `progress.md` phase checklist.
2. **Load context**: spawn Explore agent to read planning docs + relevant
   source files. Keep raw doc reads out of main context.
3. **Execute**: parallel agent fan-out (sim + server + client + tests) or,
   for batch-heavy phases, an `ultracode` Workflow.
4. **Validate**: `npx tsc --noEmit`; affected test suites; i18n S3 guard
   if player text changed; wire/snapshot suites if protocol changed.
5. **Review**: dispatch review agents per the matrix in `state.md`.
6. **Commit**: Conventional Commits with `construction` scope, explicit
   paths, no `git add -A`.
7. **Update docs**: `progress.md`, `state.md`.

## Per-phase starter prompts

See the `phase-NN-*.md` files under this directory. Each is a self-contained
prompt that a fresh Claude Code session can run.

### Implementation phases

**Phase 1 — Data model & profession**
- `docs/construction/phase-01-datamodel.md`
- Extends: `types.ts`, `PlayerMeta`, `IWorld` (new facet)
- Adds: `ConstructionSkill` type, `BuildingSystem` state, `CONSTRUCTION_PROFESSION` definition

**Phase 2 — Materials & items**
- `docs/construction/phase-02-materials.md`
- Extends: `content/items.ts`, `ITEM_MERGE`, vendor lists
- Adds: ~20 new items (raw + refined), 5 construction tools, 6 vendor items

**Phase 3 — The house instance**
- `docs/construction/phase-03-instance.md`
- Extends: dungeon instance system, `colliders.ts`, `WorldContent`
- Adds: `HouseInstance` type, plot purchase, interior layout generation, enter/exit triggers

**Phase 4 — Blueprint construction**
- `docs/construction/phase-04-blueprints.md`
- Extends: `gathering.ts` pattern (but for building), `wheel.ts`
- Adds: Blueprint system, phase building, material consumption, skill gain on build

**Phase 5 — Furniture & decoration**
- `docs/construction/phase-05-furniture.md`
- Extends: `PlacedAsset`, `placements` pipeline, `render/placed_assets.ts`
- Adds: Furniture items, placement mode, grid snapping, interior rendering

**Phase 6 — Benefits & social**
- `docs/construction/phase-06-benefits.md`
- Extends: `rested-xp.ts`, crafting station system, `bagSlots` pattern, social system
- Adds: House rested XP, workbench bonuses, storage chests, visit house command

**Phase 7 — UI & HUD**
- `docs/construction/phase-07-ui.md`
- Extends: `hud.ts`, build mode, `sim_i18n.ts`
- Adds: Build mode panel, furniture placement controls, house overview window

**Phase 8 — Polish & balance**
- `docs/construction/phase-08-polish.md`
- Extends: all construction files
- Adds: Recipe balance pass, determinism tests, performance optimization, final QA
