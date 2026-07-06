### Starter Prompt
```
This is Phase 6 of the Construction System feature: Benefits & social.

Model: default.
Harness: OpenCode.

Goal: Make houses mechanically meaningful — rested XP bonus, placeable crafting
stations with skill buffs, storage chests, and a social visit system.

STEP 0 - PRE-FLIGHT:
- Verify `git status` is clean.

STEP 1 - LOAD CONTEXT:
Spawn an explore agent to read and return:
- docs/construction/state.md (Phase 6 deliverables)
- docs/construction/progress.md (Phase 6 checklist)
- docs/construction/phase-03-instance.md (house instance)
- docs/construction/phase-04-blueprints.md (house tiers)
- docs/construction/phase-05-furniture.md (placement pattern)

Then read:
- src/sim/progression/xp.ts: rested XP system (how rested XP works, ~100 lines)
- src/sim/sim.ts: where rested XP is ticked in the per-player loop
- src/sim/professions/wheel.ts: gainCraftSkill pattern (for station bonus)
- src/sim/bags.ts: bag slots pattern (for chest storage)
- src/sim/social/chat.ts: how social commands are dispatched (for visit house)
- server/game.ts: how WS commands are dispatched
- src/sim/content/items.ts: look at existing bags (bagSlots field) for chest pattern

STEP 2 - EXECUTE:

A. House Rested XP bonus
   - In src/sim/professions/construction/benefits.ts:
     - `houseRestedMultiplier(tier)`: returns 1.5x for tent, 2x for shack,
       3x for cottage, 4x for house, 5x for manor, 6x for estate
     - `isInOwnHouse(ctx, pid)`: check if player is inside their own house
       interior instance
     - Integrate with rested XP: when the player ticks inside their own house,
       the rested XP accumulation is multiplied by houseRestedMultiplier.
       Modify the rested-XP tick in progression/xp.ts or the tick loop to
       check isInOwnHouse and apply the bonus.
   - Add IWorld read surface: `houseRestedBonus: number`

B. Crafting stations (placeable items in the house)
   - Add 5 station items to construction_items.ts:
     - workbench: "Woodworking Workbench", quality: common, use: { type: 'craftStation', stationType: 'woodworking', skillBonus: 2 }
     - anvil: "Portable Anvil", quality: common, use: { type: 'craftStation', stationType: 'metalworking', skillBonus: 2 }
     - alchemy_table: "Alchemy Table", quality: common, use: { type: 'craftStation', stationType: 'alchemy', skillBonus: 2 }
     - cooking_hearth: "Cooking Hearth", quality: common, use: { type: 'craftStation', stationType: 'cooking', skillBonus: 2 }
     - loom: "Standing Loom", quality: common, use: { type: 'craftStation', stationType: 'textile', skillBonus: 2 }
   - Add `{ type: 'craftStation', stationType: string, skillBonus: number }` to ItemUse in types.ts
   - Station items placed via the same furniture system (Phase 5)
   - Station bonus: when player is near a placed station and opens the matching
     craft (e.g. anvil + weaponcrafting), apply a small skill bonus (+2-10 based
     on station tier)
   - Station detection: check PlayerMeta.construction.furniture for any craftStation
     items when entering a crafting UI

C. Storage chests
   - Add 3 chest items to construction_items.ts:
     - wooden_chest_small: "Small Wooden Chest", quality: common, bagSlots: 6, sellValue: 50
     - ironbound_chest: "Ironbound Chest", quality: uncommon, bagSlots: 12, sellValue: 200
     - rune_sealed_chest: "Rune-Sealed Chest", quality: rare, bagSlots: 24, sellValue: 1000
   - Each chest stores items like a bag: use the same bag/slot system
   - Chest storage is persisted as part of the house instance (in CharacterState
     JSONB under building.chests[chestId])
   - Player can open the chest UI and deposit/withdraw items
   - Chest items are part of the inventory system (add/removeItem for chests)

D. Social visits
   - `visitHouse(ctx, targetPid, visitorPid)`:
     - Target player must own a plot with a house (tier > 0)
     - Target can set permissions: 'private' (no one enters), 'friends only',
       'public' (anyone can enter)
     - If allowed: teleport visitor to the house interior entrance
     - To leave: use the regular leaveHouse flow
   - Add IWorld: `visitHouse(playerId: string)`
   - Add permission system:
     ```typescript
     export type HousePermission = 'private' | 'friends' | 'public';
     // Default: 'friends' (party members + friend list)
     ```
   - Permissions stored in PlayerMeta.construction (or house instance)

E. Update IWorld construction facet:
   ```typescript
   readonly houseRestedBonus: number;
   readonly housePermissions: HousePermission;
   setHousePermission(perm: HousePermission): void;
   visitHouse(playerId: number): void;
   readonly houseChests: ChestView[];
   openChest(chestId: string): void;
   closeChest(chestId: string): void;
   ```

INVARIANTS:
- Rested XP bonus is sim-only (no client-side advantage)
- Station bonuses are small (+2-10 skill) so they don't break crafting balance
- Chest storage uses the same bag system for consistency
- Visit permissions are validated server-side (player can't enter a private house)
- All new text uses i18n keys (add to sim_i18n.ts)

Out of scope:
- House guest list UI (just use party/friend list for now)
- Bulk item deposit/withdraw
- Housing guild halls
- Decorative storage (e.g. visible item display)

STEP 3 - VALIDATION:
- `npx tsc --noEmit` green
- Manual: enter house, verify rested XP multiplier
- Place crafting station, verify skill bonus in crafting window
- Open chest, deposit/withdraw items
- Visit another player's house
- Test permission changes

STEP 4 - COMMIT:
1. `feat(construction): add house rested XP bonus`
2. `feat(construction): add crafting station items`
3. `feat(construction): add storage chest items`
4. `feat(construction): implement house visit system with permissions`

STEP 5 - ACCEPTANCE:
- [ ] Rested XP bonus scales by house tier (1.5x-6x)
- [ ] 5 crafting stations with matching skill bonuses
- [ ] 3 chest sizes with persistent storage
- [ ] visitHouse command works (validates permissions)
- [ ] Permission system: private/friends/public
- [ ] All benefits persist across save/load
- [ ] tsc green
```
