### Starter Prompt
```
This is Phase 7 of the Construction System feature: UI & HUD.

Model: default.
Harness: OpenCode.

Goal: Build the player-facing interface — build mode HUD panel, furniture
placement controls, house overview window. All text localized through i18n.
Works on both desktop and mobile (touch safe areas).

STEP 0 - PRE-FLIGHT:
- Verify `git status` is clean.

STEP 1 - LOAD CONTEXT:
Spawn an explore agent to read and return:
- docs/construction/state.md (Phase 7 deliverables + i18n keys)
- docs/construction/progress.md (Phase 7 checklist)
- docs/construction/phase-04-blueprints.md (blueprint data shape)
- docs/construction/phase-05-furniture.md (furniture data shape)

Then read directly:
- src/main.ts: how keybinds are registered (find B key or similar)
- src/game/input.ts: keybind dispatch pattern
- src/ui/hud.ts: existing HUD structure (approximately line 1-100 for structure,
  grepping for 'window' or 'toggle')
- src/ui/windows/ directory: existing window patterns (inventory, quest, etc.)
- src/ui/sim_i18n.ts: how matchers work (EXACT + RULES)
- src/ui/i18n.ts: how t() works, how new keys are added
- src/game/keybinds.ts: keybind definitions
- src/render/characters/rendered_player.ts: example of how renderer reads IWorld state

STEP 2 - EXECUTE:

The UI in this game uses a vanilla DOM overlay (not React/Vue). Follow the
existing window patterns exactly.

A. i18n: Add construction keys to src/ui/i18n.ts and all locale files.
   Required keys (group by t() path):
   ```
   house.title = "House"
   house.enter = "Enter House"
   house.leave = "Leave House"
   house.visit = "Visit {name}'s House"
   house.restedBonus = "House Rested Bonus: {bonus}x"
   house.permissions = "House Permissions"
   house.permissions.private = "Private"
   house.permissions.friends = "Friends Only"
   house.permissions.public = "Public"

   build.title = "Build Mode"
   build.skill = "Construction"
   build.skillLevel = "Skill: {skill}/{max}"
   build.currentBlueprint = "Current Blueprint"
   build.phase = "Phase {index}/{total}"
   build.phase.foundation = "Foundation"
   build.phase.frame = "Frame"
   build.phase.walls = "Walls"
   build.phase.roof = "Roof"
   build.phase.details = "Details"
   build.materials = "Materials"
   build.material.missing = "Missing: {item}"
   build.toolRequired = "Requires Tool Tier {tier}"
   build.buildPhase = "Build Phase"
   build.milestone = "Construction reached level {level}!"
   build.phaseComplete = "{phase} built!"
   build.blueprintsComplete = "Blueprint complete! Upgrade your house."
   build.noPlot = "You do not own a building plot."
   build.houseComplete = "House complete!"

   furniture.title = "Furniture"
   furniture.place = "Place"
   furniture.move = "Move"
   furniture.remove = "Remove"
   furniture.rotate = "Rotate"
   furniture.tier = "Tier {tier}"
   furniture.noRoom = "Not enough room to place here."
   furniture.tooClose = "Too close to another object."

   plot.title = "Building Plot"
   plot.buy = "Buy Plot ({price}g)"
   plot.sold = "Already Owned by {name}"
   plot.own = "You already own a plot."
   plot.noGold = "Not enough gold."
   plot.info = "Plot {id} — Max Tier {tier}"
   ```

B. Add matcher rules in src/ui/sim_i18n.ts:
   Follow existing RULES pattern. Add matchers for construction SimEvents:
   - "Construction reached level {level}!" → t('build.milestone', { level })
   - "{phase} built!" → t('build.phaseComplete', { phase })
   - "You do not own a building plot." → t('build.noPlot')
   - "House complete!" → t('build.houseComplete')
   - "Not enough room to place here." → t('furniture.noRoom')

C. Build mode HUD (src/ui/windows/build_mode.ts):
   - Toggle with B key (or a build mode button in the action bar area)
   - Panel shows:
     - Construction skill + level bar
     - Current blueprint name, phases progress bar
     - Per-phase: name, materials list (green/red for have/don't have), tool req
     - "Build Phase" button (enabled when materials met + tool equipped)
   - When player has no plot: show "You do not own a building plot."
   - When blueprints are complete: prompt to upgrade
   - Follows existing window positioning (centered or to the side)

D. Furniture placement mode (integrated into build mode or separate):
   - When build mode is active and player is in their house:
     - Show a list of furniture items they can place (from inventory)
     - Click "Place" → enter placement mode
     - In placement mode: item ghost follows cursor, grid snap indicator
     - Click to confirm placement, right-click/Esc to cancel
     - Click existing furniture → show Move/Remove buttons
   - Wire to WS commands: placeFurniture, moveFurniture, removeFurniture

E. House overview window (src/ui/windows/house_window.ts):
   - Shows: house name, tier, current phase progress
   - Rested bonus indicator
   - "Enter House" button (when outside)
   - "Leave House" button (when inside)
   - "Visit [name]'s House" in player right-click menu
   - Permission selector (private/friends/public)

F. Keybinds (src/game/keybinds.ts):
   - Toggle build mode: B key
   - Confirm placement: Left click / Enter
   - Cancel placement: Right click / Esc
   - Rotate placement: R key / scroll wheel

G. Update main.ts:
   - Instantiate and register build mode + house windows
   - Wire toggle keybind
   - Add house visit action to right-click menu for player targets

INVARIANTS:
- All player-visible strings use t() keys (never English literals in UI)
- Follow existing window patterns (vanilla DOM, no React)
- Touch-safe: tap targets at least 44px, no hover-dependent info
- Mobile safe areas respected (follow existing window positioning)
- S3 drift guard passes with new matchers

Out of scope:
- 3D rendering of furniture/house exterior (separate renderer phase)
- Animated transitions
- Build mode tutorial

STEP 3 - VALIDATION:
- `npx tsc --noEmit` green
- `npx vitest run tests/localization_fixes.test.ts` green (S3 drift guard)
- Manual: toggle build mode, verify panels show
- Manual: enter house, place furniture via UI
- Manual: verify B key toggle works

STEP 4 - COMMIT:
1. `feat(construction): add i18n keys and matchers for construction UI`
2. `feat(construction): add build mode HUD panel`
3. `feat(construction): add furniture placement controls`
4. `feat(construction): add house overview window and visit action`

STEP 5 - ACCEPTANCE:
- [ ] Build mode HUD shows skill, blueprints, materials
- [ ] Furniture placement works with grid snapping indicator
- [ ] House overview window shows tier, bonus, enter/leave
- [ ] Visit house in right-click menu
- [ ] B key toggles build mode
- [ ] All text uses t() keys in all locales
- [ ] S3 drift guard green
- [ ] Mobile touch targets comfortable
- [ ] tsc green
```
