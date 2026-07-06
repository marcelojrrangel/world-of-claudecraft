# State — Construction System

## Current phase: 1 — Data model & profession (complete)

### What was delivered
- `CONSTRUCTION_PROFESSION` (`id: 'construction'`, `category: 'secondary'`, `maxSkill: 300`) in `src/sim/content/professions.ts`
- `ConstructionSystem` + `PlacedFurniture` types in `src/sim/types.ts`
- `PlayerMeta.construction: ConstructionSystem` field
- `IWorldConstruction` facet (`ConstructionView` + `constructionSkill` getter) in `src/world_api/construction.ts`, aggregated in `src/world_api.ts`
- `Sim.constructionSkill` / `Sim.constructionSkillFor(pid)` delegates
- `ClientWorld.constructionSkill` field with `applySnapshot` delta decode from `const` wire key
- `maybe('const', ...)` in `server/game.ts` `selfWireJson`
- `normalizeConstructionSystem()` in `src/sim/professions/construction/index.ts`
- Persistence: `building?: ConstructionSystem` in `CharacterState`, serialize/deserialize in `sim.ts`
- Wire: `ALL_DELTA_KEYS` +1 (`const`, now 31), `TERSE_TO_IWORLD` entry (`const → constructionSkill`)
- IWorld: `IWORLD_MEMBERS` +1 (`constructionSkill`, now 171: 43 data + 128 method)
- All registries/parity/snapshot/command-schema/architecture tests green

### Phase 1 drift from the plan
- `ConstructionView` reuses `maxSkill: number` field, not a separate constant (matches `ProfessionRecord` pattern).
- The `construction` field name on `PlayerMeta` matches the facet name, not `building` (which is the persistence key only).

## Locked design decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Profession type | Secondary (1–300) | Like Fishing; doesn't occupy craft ring slot |
| Skill gain | By building/upgrading | Incentivises active construction |
| Building location | Open-world plot + interior instance | Both visibility and scalability |
| Building style | Blueprint phases + free furniture placement | Structure rigidity + custom expression |
| Materials | New refined items from existing raw materials | Creates production chain, all professions feed in |
| Benefits | Rested XP + crafting stations + storage + social visits | All three core hooks |
| Tool gating | `GatherToolUse` pattern, tiers 1–5 | Reuses existing tool system |
| Profession ID | `construction` | Matches snake_case convention |
| Wire key | `const` | Short, unique, not conflicting |
| Persistence key | `building` | JSONB key on character save row |
| Plot key | `plots` | Realm-wide plot registry in market/mail pattern |
| IWorld facet name | `IWorldConstruction` | Under `world_api/construction.ts` |

## Non-negotiable constraints

- **Determinism**: all randomness via `Rng`; no `Math.random` / `Date.now` /
  `performance.now` in `src/sim/`.
- **Seam**: extend `IWorld` first, then implement in BOTH `Sim` and
  `ClientWorld`.
- **Server authority**: client never decides build outcomes; WS commands
  validated server-side.
- **i18n**: every new player string is a `t()` key in every locale; sim/server
  emit English re-localized via matchers.
- **JSONB back-compat**: loading a character saved before this feature must
  not throw or lose data (default missing fields).
- **Append-only registries**: `COMMAND_NAMES`, `ALL_DELTA_KEYS`,
  `TERSE_TO_IWORLD`, `IWORLD_MEMBERS`, `SimContext` callbacks.

## Validation matrix

| Change type | Commands |
|-------------|----------|
| sim-only | `npx tsc --noEmit` + `npx vitest run tests/sim.test.ts` |
| content-only | `npx tsc --noEmit` + `npx vitest run tests/progression.test.ts` |
| server-only | relevant server suites + `npx tsc --noEmit` + `npm run build:server` |
| net/wire | `npx vitest run tests/snapshots.test.ts tests/env_protocol.test.ts` |
| ui/render | `npx tsc --noEmit` + `npx vitest run tests/localization_fixes.test.ts` + mobile screenshot |
| full-stack | `npm test && npx tsc --noEmit && npm run build:env && npm run build:server && npm run build` |
| any code change | `npm run ci:changed` (Biome on changed files) |

## Key file paths

### Existing files that will be modified
- `src/sim/types.ts` — add `BuildingSystem`, `PlotDef`, `BlueprintDef`, `FurnitureDef`
- `src/sim/sim.ts` — `PlayerMeta` extensions, thin delegates
- `src/sim/sim_context.ts` — new callbacks
- `src/sim/content/items.ts` — new construction items
- `src/sim/content/professions.ts` — `CONSTRUCTION_PROFESSION` def
- `src/sim/data.ts` — merge new items
- `src/world_api.ts` — `IWorldConstruction` facet
- `src/world_api/professions.ts` — `constructionSkill` read surface
- `src/net/online.ts` — `ClientWorld` implementation
- `server/game.ts` — wire encoding, command dispatch
- `server/db.ts` — JSONB persistence keys
- `src/sim/instances/dungeons.ts` — reuse instance enter/exit pattern
- `src/sim/colliders.ts` — house interior colliders
- `src/sim/professions/gathering.ts` — harvest table for construction mats
- `src/sim/professions/wheel.ts` — construction skill tracking
- `src/sim/professions/tools.ts` — construction tool gating
- `src/ui/sim_i18n.ts` — construction text matchers
- `src/ui/server_i18n.ts` — server construction matchers
- `tests/` — construction test files

### New files to create
- `src/sim/professions/construction/` — new module directory
  - `blueprints.ts` — Blueprint definitions
  - `housing.ts` — House instance logic
  - `furniture.ts` — Furniture placement logic
  - `benefits.ts` — Rested XP, station bonuses, storage
  - `index.ts` — barrel
- `src/sim/content/blueprints.ts` — Blueprint data table
- `src/sim/content/house_layouts.ts` — House interior layout generation
- `src/world_api/construction.ts` — `IWorldConstruction` facet
- `src/render/house_interior.ts` — Interior rendering for placed furniture
- `src/render/house_exterior.ts` — Exterior tier models
- `src/ui/windows/house_window.ts` — House overview window
- `src/ui/windows/build_mode.ts` — Build mode panel
- `src/ui/windows/furniture_placement.ts` — Furniture placement controls
- `tests/blueprints.test.ts`
- `tests/housing.test.ts`
- `tests/construction_skill.test.ts`
- `tests/construction_i18n.test.ts`

## New IWorld members (added per phase)

| Phase | Member | Direction | Type |
|-------|--------|-----------|------|
| 1 | `constructionSkill` | read | `{ skill: number; maxSkill: number }` |
| 1 | `buildingSystem` | read | `BuildingSystemView` |
| 3 | `buyPlot` | command | `(plotId: string) => void` |
| 3 | `enterHouse` | command | `() => void` |
| 3 | `leaveHouse` | command | `() => void` |
| 4 | `buildBlueprint` | command | `(blueprintId: string) => void` |
| 4 | `knownBlueprints` | read | `string[]` |
| 5 | `placeFurniture` | command | `(itemId, x, z, rotY) => void` |
| 5 | `moveFurniture` | command | `(placedId, x, z, rotY) => void` |
| 5 | `removeFurniture` | command | `(placedId) => void` |
| 6 | `houseRestedBonus` | read | `number` |
| 6 | `houseStations` | read | `StationView[]` |
| 6 | `visitHouse` | command | `(playerId) => void` |

## New SimEvents

| Phase | Event | Purpose |
|-------|-------|---------|
| 3 | `{type: 'house_enter', pid, houseId}` | Entered house instance |
| 3 | `{type: 'house_leave', pid, houseId}` | Left house instance |
| 4 | `{type: 'construction_progress', pid, blueprintId, phase}` | Phase built |
| 4 | `{type: 'construction_milestone', pid, level}` | Skill milestone reached |
| 6 | `{type: 'house_visit', hostPid, visitorPid}` | Social visit started |

## New wire fields

| Phase | Wire key | Maps to |
|-------|----------|---------|
| 1 | `const` | `constructionSkill` |
| 3 | `plot` | `plotData` |
| 4 | `bps` | `knownBlueprints` |
| 5 | `furn` | `placedFurniture` |
| 6 | `hben` | `houseRestedBonus` |

## New server endpoints

| Phase | Endpoint | Method | Purpose |
|-------|----------|--------|---------|
| 3 | `house/enter` | WS cmd | Enter house instance |
| 3 | `house/leave` | WS cmd | Leave house instance |
| 4 | `build` | WS cmd | Build blueprint phase |
| 5 | `furn/place` | WS cmd | Place furniture item |
| 5 | `furn/move` | WS cmd | Move placed furniture |
| 5 | `furn/remove` | WS cmd | Remove placed furniture |
| 6 | `house/visit` | WS cmd | Visit another player's house |

## New DB persistence keys

| Phase | JSONB key | Type | Description |
|-------|-----------|------|-------------|
| 1 | `building.skill` | `number` | Construction skill (0-300) |
| 3 | `building.plotId` | `string \| null` | Owned plot ID |
| 3 | `building.houseTier` | `number` | Current house tier (1-6) |
| 4 | `building.blueprints` | `string[]` | Known blueprint IDs |
| 4 | `building.phasesBuilt` | `Record<string, number>` | Blueprint → phases completed |
| 5 | `building.furniture` | `PlacedFurniture[]` | Placed furniture in instance |
| 6 | `building.chests` | `StoredItem[][]` | Storage chest contents |

## i18n keys to add (across phases)

Prefix: `house.`, `build.`, `furniture.`, `plot.`

Initial set:
- `house.title` — "House"
- `house.enter` — "Enter House"
- `house.leave` — "Leave House"
- `house.visit` — "Visit {name}'s House"
- `house.restedBonus` — "House Rested Bonus: {bonus}x"
- `build.skill` — "Construction"
- `build.noPlot` — "You do not own a building plot."
- `build.phaseComplete` — "Phase built: {phase}"
- `build.milestone` — "Construction has reached level {level}!"
- `furniture.place` — "Place Furniture"
- `furniture.remove` — "Remove"
- `furniture.move` — "Move"
- `plot.buy` — "Buy Plot"
- `plot.sold` — "This plot is already taken."
- `plot.own` — "You already own a plot."
