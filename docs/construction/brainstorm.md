# Brainstorm — Construction System

## Feature Vision

A fully-fledged secondary profession that lets players design, build, and
upgrade their own homes — starting from a humble tent and progressing to a
grand manor. Construction synergizes with every gathering and crafting
profession, creating a vibrant material economy and a sense of place in the
world.

## Approved Design Decisions

### Profession type: Secondary (like Fishing)
- Independent skill track 1–300, separate from the 10-craft ring
- Any player can take it regardless of their other professions
- Skill gained by **building and upgrading** structures, not by gathering
- Each construction action grants skill XP (scaled by complexity; trivial
  builds give 0 skill-up past a threshold)

### Location: Both open-world + personal instance
- **Open-world**: A housing neighborhood zone (e.g. "Builder's Plot" near
  Eastbrook) with fixed plots where houses are visible to all players.
  Limited supply — first come, first served.
- **Personal instance**: Each player can enter their house interior as a
  separate instance (same pattern as dungeon instances). Interior space is
  essentially unlimited.
- Exterior shell visible in open world; interior loaded on enter trigger.
- A portal stone or house door at the plot lets you enter your instance.

### Building style: Hybrid (blueprints + free placement)
- **Structure**: Placed via blueprints in rigid phases (foundation → frame →
  walls → roof → doors/windows). Each phase has specific material
  requirements and produces a visible upgrade on the exterior.
- **Interior/Furniture**: Free-placement mode inside the instance. Place,
  rotate, move furniture items within a grid or semi-freeform bounds.

### Skill progression: By building/upgrading
- Each construction action awards skill XP
- Higher skill unlocks higher-tier blueprints (wood → stone → reinforced →
  marble → enchanted)
- Higher skill improves material efficiency (less waste per build action)
- Skill also gates artisan furniture crafting

### Materials: Hybrid chain
- Raw materials from existing gathering professions:
  - **Mining →** stone, ore, marble, clay
  - **Logging →** logs, lumber
  - **Herbalism →** resins, dyes, polishes
  - **Skinning/Harvest →** leather, hides, silk (for upholstery)
- New refined materials crafted from raw:
  - Sawed Planks, Cut Stone, Brick, Copper Nail, Iron Hinge, Glass Pane,
    Marble Tile, Enchanted Lumber
- New profession-specific hand tools (Hammer, Saw, Trowel, Level) with
  tiers 1–5, using the existing `GatherToolUse` pattern
- Tool tiers gate which materials/blueprints you can work with (e.g. Iron
  Hammer required for reinforced frame)

### Benefits: All three core hooks
1. **Rested XP bonus**: Sleeping in your own house gives significantly
   faster rested-XP accumulation than inn resting. Bonus scales with house
   tier (tent = 1.5x, manor = 5x).
2. **Crafting stations**: Placeable workbenches (Woodworking Table, Anvil,
   Alchemy Station, Cooking Fire, Loom) inside your house that grant small
   skill bonuses or reduced craft time when used.
3. **Storage**: Placeable chests with persistent storage. Low-tier chests
   are small (6 slots); high-tier chests are large (24 slots).
4. **Social visits**: Friends can enter your house via right-click →
   "Visit House". A house showcase system lets you tour notable builds.

## Creative Hooks (the "fun" part)

### 1. Visual spectacle — your house grows over time
The exterior model literally changes as you progress through phases:
- **Level 1–50**: Canvas tent with a bedroll
- **Level 51–100**: Wooden shack with a straw roof
- **Level 101–150**: Timber cottage with a chimney
- **Level 151–200**: Stone-and-timber house with glazed windows
- **Level 201–250**: Manor house with a second floor, balcony, garden
- **Level 251–300**: Grand estate with tower, courtyard, fountain

Each transition is a major milestone celebrated with a server emote.

### 2. Every profession feeds construction
- Miners extract stone, ore, and rare marble
- Loggers supply lumber and exotic woods
- Herbalists provide resins, stains, and aromatic oils
- Cooks can stock the kitchen for housewarming feasts
- Tailors make curtains, rugs, and upholstery
- Leatherworkers craft chairs and sofas
- Blacksmiths forge hinges, nails, grilles
- Jewelcrafters create decorative fixtures
- Enchanters imbue walls with magic light

→ Construction becomes the **ultimate sink** for the material economy.

### 3. Blueprint hunting
- Common blueprints: vendor-bought (standard house shapes)
- Uncommon: quest rewards, crafting discoveries
- Rare: dungeon boss drops (ornate columns, grand staircases)
- Epic: world-drop recipes (crystal chandelier, enchanted fountain)
- Legendary: raid drops (floating towers, portal rooms)

### 4. Neighborhood community
Open-world plots mean players see each other's houses evolve. A "Builder's
Row" creates a living neighbourhood that grows organically over time.
Players can wave at neighbors, show off their latest upgrade, or form a
builder's guild.

### 5. Achievement titles
Unlock titles visible on the character sheet and nameplate:
- "Tinker" (skill 50)
- "Carpenter" (skill 100)
- "Builder" (skill 150)
- "Architect" (skill 200)
- "Master Builder" (skill 250)
- "Grand Constructor" (skill 300)

## Systems to reuse

| Existing system | How it maps |
|----------------|-------------|
| `ProfessionRecipeRecord` | Blueprint recipes (reagents + skill req + trivial at) |
| `GatherToolUse` / `tools.ts` | Construction hand-tools tier gating |
| `InvSlot` + `instance` payload | Furniture items with `signer` (built by X) |
| `INVENTORY_MAX` / `bagSlots` | Storage chests = virtual bag slots |
| Dungeon instances | House interior = personal instance with its own layout |
| `DoorTrigger` / `updateDoorTriggers` | Entering/exiting house instance |
| `doorPos` / `exitOffset` | House portal placement pattern |
| `HeightStamp` / `terrainEdits` | Plot terrain flattening |
| `PlacedAsset` / `placements` | Furniture placement in interior instances |
| `WorldContent.placements` | Furniture rendered via existing asset pipeline |
| `GatheringProficiency` | Construction skill tracking pattern |
| `craftSkillsFor` | Construction skill read-surface pattern |
| `i18n` / `sim_i18n.ts` | All house UI text |
| `t()` keys in all locales | Matching S3 guard for house text |
| LootEntry + rollGroup | Blueprint drops from mobs/chests |
| `FISHING_TABLES` pattern | Blueprint discovery chance tables |

## OPEN questions (still need a design answer)
- [ ] Should open-world plots be purchased with gold or earned through a
      quest chain?
- [ ] Can multiple characters on the same account share a house?
- [ ] What happens when a player is inactive for 90+ days? Plot
      repossession?
- [ ] Number of open-world plots? Finite (e.g. 50 per realm) or unlimited
      via instanced neighborhoods?
