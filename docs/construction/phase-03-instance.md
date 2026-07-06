### Starter Prompt
```
This is Phase 3 of the Construction System feature: The house instance & plot system.

Model: default (xhigh effort for the instance mechanics).
Harness: OpenCode.

Goal: Create a plot system where players purchase land, own one plot, and the house
exists as a personal instance (reusing the dungeon instance pattern). Enter/exit
triggers, interior layout generation per tier, plot persistence.

STEP 0 - PRE-FLIGHT:
- Verify `git status` is clean.

STEP 1 - LOAD CONTEXT:
Spawn an explore agent to read and return:
- docs/construction/state.md (Phase 3 deliverables)
- docs/construction/progress.md (Phase 3 checklist)

Then read directly:
- src/sim/types.ts: DungeonDef (interior field ~1319-1333), WorldContent (~2081-2103),
  BuildingDef (~1353-1358)
- src/sim/content/zone1.ts: How DungeonDef is defined (~510-540 line area for delves)
- src/sim/data.ts: How dungeons are registered
- src/sim/instances/dungeons.ts (~300 lines): enterDungeon, leaveDungeon, updateDoorTriggers
- src/sim/colliders.ts: Interior colliders pattern (INTERIOR_COLLIDERS ~267-272)
- src/sim/dungeon_layout.ts: interior layout generation (~200 lines)
- src/sim/sim_context.ts: door triggers, instance callbacks
- src/sim/sim.ts: instances field, enterDungeon/leaveDungeon, updateDoorTriggers
- server/db.ts: CharacterState persistence pattern
- src/render/dungeon.ts: how interior is rendered (renderer side, just understand pattern)

STEP 2 - EXECUTE:

A. Define plot data in src/sim/types.ts (or extend the existing building types):
   ```typescript
   export interface PlotDef {
     id: string;               // "plot_eastbrook_01"
     zoneId: string;
     x: number;                // entrance position (exterior)
     z: number;
     price: number;            // purchase cost in copper
     tier: number;             // max house tier allowed on this plot (1-6)
     status: 'available' | 'owned';
     ownerId?: number;         // only populated at runtime
   }

   export interface HouseInstance {
     id: string;               // unique instance id
     plotId: string;
     ownerPid: number;
     tier: number;             // current house tier (0 = tent, 1-6)
     phase: number;            // current construction phase (0-5)
     interior: string;         // layout key (generated per tier)
   }
   ```

B. Create src/sim/content/housing_plots.ts
   - Define a few open-world plots in Eastbrook (a "Builder's Row" neighborhood):
     - 8 plots along an empty street, prices 500g-5000g, tiers 1-6
   - Define plot zones as an area near Eastbrook that's set aside for housing
   - Export PLOTS: PlotDef[]

C. Create src/sim/professions/construction/housing.ts
   - `buyPlot(ctx, plotId, pid)`: validates player doesn't own a plot,
     plot is available, player has enough gold. Deducts gold, assigns plot.
     Marks plot as owned in a shared plot registry.
   - `enterHouse(ctx, pid)`: if player owns a plot and has a house (tier > 0),
     teleport to interior instance. If interior doesn't exist yet, generate
     a simple interior layout. Uses existing dungeon instance pattern.
   - `leaveHouse(ctx, pid)`: teleport back to plot entrance position.
   - `generateInteriorLayout(tier, rng)`: based on tier, generate a layout
     key using similar patterns to dungeon_layout.ts (rooms, walls, door).
     Tier 1: single room. Tier 6: 4+ rooms with hallway.
   - `plotRegistry`: a Map<string, number> tracking plot ID → owner PID
     (realm-wide, separate from player state). Persisted alongside market data.

D. Wire house enter/exit via door trigger or command:
   - Add an NPC or sign object at each plot that the player walks close to
     to trigger the interaction. OR simpler: add a right-click command that
     main.ts dispatches (start with chat command `/house enter` / `/house leave`
     for testing).
   - Add house door portals similar to dungeon_door ground objects

E. Add to IWorld (src/world_api/construction.ts) and implement in both Sim and ClientWorld:
   ```typescript
   interface IWorldConstruction {
     readonly constructionSkill: ConstructionView;
     // NEW:
     readonly myPlot: PlotDef | null;      // player's owned plot info
     readonly houseState: HouseView | null; // current house state
     buyPlot(plotId: string): void;
     enterHouse(): void;
     leaveHouse(): void;
   }
   ```

F. Persistence:
   - Add `plots: PlotDef[]` to a realm-level registry (like market listings)
   - Save/load plot assignments in server/db.ts alongside market state
   - Character JSONB now includes building.skill, building.plotId, building.houseTier

G. Collision:
   - Plots in the open world: add invisible collider bounds around each plot
     so nothing can be placed there (or mark it as reserved)
   - Interior: generate simple room colliders using the dungeon_layout pattern

INVARIANTS:
- Reuse dungeon instance pattern as closely as possible
- Plot ownership is realm-wide, saved separately from individual character state
- House interior generated deterministically from seed+tier (same seed = same layout)
- Interior uses pure data (no DOM/Three.js) — it's shared between sim and renderer

Out of scope:
- Visual house exterior model on the plot (Phase 4)
- Furniture placement (Phase 5)
- Plot decoration (bushes, fences)
- Multiple houses per character

STEP 3 - VALIDATION:
- `npx tsc --noEmit` green
- Manual: spawn with a cheater, buy plot, enter/leave house
- Plot registry loads and saves correctly

STEP 4 - COMMIT:
1. `feat(construction): add PlotDef and HouseInstance types`
2. `feat(construction): add housing plots to Eastbrook neighborhood`
3. `feat(construction): implement buyPlot, enterHouse, leaveHouse`
4. `feat(construction): persist plot registry and character house state`

STEP 5 - ACCEPTANCE:
- [ ] 8 plots defined in Builder's Row near Eastbrook
- [ ] buyPlot command validates availability and deducts gold
- [ ] Player can only own one plot
- [ ] enterHouse creates interior instance
- [ ] leaveHouse returns player to plot entrance
- [ ] Interior layout generated per tier (1 room at tier 1, 4+ at tier 6)
- [ ] Plot registry persisted across server restarts
- [ ] Character house state saved/loaded
- [ ] tsc green
```
