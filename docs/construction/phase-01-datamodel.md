### Starter Prompt
```
This is Phase 1 of the Construction System feature: Data model & profession setup.

Model: default (xhigh effort as needed for the seam work).
Harness: OpenCode.

Goal: Add Construction as a secondary profession (1-300) with its data types,
IWorld facet, offline Sim implementation, online ClientWorld mirror, wire
encoding, and JSONB persistence key — but NO gameplay logic yet (no building,
no blueprints, no materials). This is the architectural foundation all later
phases build on.

STEP 0 - PRE-FLIGHT:
- Run `git status --short`. Verify the tree is clean. If dirty, ask the user.

STEP 1 - LOAD CONTEXT:
Spawn an explore agent to read and return a focused summary of:
- docs/construction/state.md (locked decisions: profession = secondary, skill 1-300,
  profession ID = `construction`, wire key = `const`, persistence key = `building`)
- docs/construction/progress.md (Phase 1 deliverable checklist)

Then read these source files directly in your main context (they are small enough):
- src/sim/professions/types.ts (ProfessionRecord shape, 60 lines)
- src/sim/content/professions.ts (GATHERING_PROFESSIONS + CRAFT_RING patterns, 120 lines)
- src/sim/professions/gathering.ts (emptyGatheringProficiency + normalize pattern, 336 lines)
- src/sim/professions/wheel.ts (CraftSkills + gainCraftSkill pattern, 57 lines)
- src/world_api/professions.ts (IWorldProfessions facet shape, ~40 lines)
- src/world_api.ts (how facets are aggregated + IWORLD_MEMBERS pattern, ~200 lines)
- src/sim/types.ts (PlayerMeta, BuildingDef lines around 1337-1401)
- src/sim/sim.ts (find professionsStateFor — ~line 6590, PlayerMeta fields ~700-800)
- src/sim/sim_context.ts (SimContext seam — callback registry)
- src/net/online.ts (ClientWorld applySnapshot delta decode pattern ~1600-1650)
- server/game.ts (selfWireJson pattern ~3353-3450, maybe('...'))
- server/db.ts (CharacterState JSONB serialization ~1912-1950)
- tests/world_api_parity.test.ts (IWORLD_MEMBERS list)
- src/sim/CLAUDE.md (appendix: adding a mechanic checklist)
- src/net/CLAUDE.md (adding a networked action)
- server/CLAUDE.md (adding a command, persistence model)

STEP 2 - EXECUTE:

Create the following changes. Each change is self-contained; you can do them
sequentially in one session.

A. Add `CONSTRUCTION_PROFESSION` to src/sim/content/professions.ts
   - Create a new `SecondaryProfessionDef` following the same pattern as
     `GatheringProfessionDef` but with `category: 'secondary'`
   - id: 'construction', name: 'Construction', icon: 'construction',
     maxSkill: 300, category: 'secondary'
   - Add a constant `SECONDARY_PROFESSIONS` record (like GATHERING_PROFESSIONS)
   - Add `SECONDARY_PROFESSION_IDS` readonly array (initially just ['construction'])
   - Export all from the file

B. Add `ConstructionSystem` type to src/sim/types.ts
   ```typescript
   export interface ConstructionSystem {
     skill: number;               // 0-300
     plotId: string | null;       // owned plot (Phase 3)
     houseTier: number;           // 0-6 (Phase 3-4)
     knownBlueprints: string[];   // learned blueprints (Phase 4)
     phasesBuilt: Record<string, number>;  // blueprint → phase count (Phase 4)
     furniture: PlacedFurniture[];         // placed items (Phase 5)
   }
   export interface PlacedFurniture {
     id: string;                  // unique instance id
     itemId: string;              // item def id
     x: number; z: number;
     rotY: number;
   }
   ```
   - Add `construction: ConstructionSystem` to `PlayerMeta`
   - Initialize in `createPlayer` / `baseEntity` (default: `{ skill: 0, plotId: null,
     houseTier: 0, knownBlueprints: [], phasesBuilt: {}, furniture: [] }`)

C. Create `src/sim/professions/construction/index.ts`
   - Barrel re-export of types and functions (stub for now, just export the types)

D. Create `src/world_api/construction.ts`
   - `IWorldConstruction` interface:
     ```typescript
     export interface ConstructionView {
       skill: number;
       maxSkill: number;
     }
     export interface IWorldConstruction {
       readonly constructionSkill: ConstructionView;
     }
     ```
   - Import and aggregate in `src/world_api.ts` via `IWorldConstruction`
   - Add to `IWorld extends IWorldConstruction`

E. Implement in `src/sim/sim.ts`
   - Add `constructionSkill` getter: returns `{ skill, maxSkill: 300 }` from
     `this.primaryMeta().construction`
   - Add a helper `constructionSkillFor(pid)` for the server

F. Implement in `src/net/online.ts` (ClientWorld)
   - Add `constructionSkill: ConstructionView = { skill: 0, maxSkill: 300 }` field
   - In `applySnapshot`, add delta decode:
     ```typescript
     if (s.const !== undefined) this.constructionSkill = s.const ?? { skill: 0, maxSkill: 300 };
     ```

G. Wire in `server/game.ts`
   - Add `maybe('const', this.sim.constructionSkillFor(anchorSession.pid))`
     in `selfWireJson`

H. Update registries
   - `ALL_DELTA_KEYS`: add `'const'`
   - `TERSE_TO_IWORLD`: add `const → 'constructionSkill'`
   - `IWORLD_MEMBERS`: add the new members, pin count

I. Add `normalizeConstructionSystem(saved)` function in a new helper
   - Following `normalizeGatheringProficiency` / `normalizeCraftSkills` pattern
   - Default missing fields to safe empty values
   - Call it in `addPlayer` / deserialize path so old characters load safely

J. Add persistence key `building` to `CharacterState` serialization/deserialization
   in `src/sim/sim.ts` serialize/deserialize methods

INVARIANTS:
- Determinism: Construction state is pure data on PlayerMeta; no RNG needed yet.
- Seam: IWorldConstruction is the ONLY way render/UI sees construction data.
- Server authority: only exposing read surface in this phase (no commands yet).
- i18n: No player-visible text in this phase (pure API surface).
- Back-compat: normalizeConstructionSystem MUST handle missing/null/partial state.

Out of scope:
- No building mechanics, no blueprints, no materials, no tools
- No plot system, no instance, no furniture
- No UI, no i18n text, no HUD

STEP 3 - VALIDATION:
- `npx tsc --noEmit` green
- `npx vitest run tests/world_api_parity.test.ts` green (IWORLD_MEMBERS count)
- `npx vitest run tests/snapshots.test.ts` green (ALL_DELTA_KEYS + TERSE_TO_IWORLD)
- `npm run ci:changed` green (Biome on changed files)

STEP 4 - COMMIT:
Aim for 2-3 commits with explicit paths:
1. `feat(construction): add ConstructionSystem type and CONSTRUCTION_PROFESSION`
2. `feat(construction): add IWorldConstruction facet with Sim + ClientWorld impl`
3. `feat(construction): register wire key const, persistence key building`

STEP 5 - ACCEPTANCE:
- [ ] Construction skill appears in IWorld (read via constructionSkill getter)
- [ ] Sim returns constructionSkill from PlayerMeta
- [ ] ClientWorld mirrors it from snapshot delta
- [ ] Server encodes `maybe('const', ...)` in selfWireJson
- [ ] IWORLD_MEMBERS updated and pinned
- [ ] Old character saves load cleanly (normalize fills defaults)
- [ ] ALL_DELTA_KEYS + TERSE_TO_IWORLD include 'const'
- [ ] tsc + world_api_parity + snapshots green

STEP 6 - UPDATE DOCS:
- docs/construction/progress.md: mark Phase 1 deliverables complete
- docs/construction/state.md: update with any drift discovered
```
