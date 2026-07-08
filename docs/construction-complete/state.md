# State - Construction Complete

## Decisoes locked

- Interior renderer usa KayKit dungeon pack (ja no manifest)
- Grid snap de 0.5yd para mobilia (reaproveitar logica existente)
- Tutorial via NPC mestre-de-obras com quest guiada
- `HOUSE_X = 15000` permanece (nao mudar)
- `HOUSE_SLOT_COUNT = 50`, `HOUSE_SLOT_SPACING = 200`

## Validacao por tipo de mudanca

| Tipo | Comandos |
|------|----------|
| sim-only | `npx tsc --noEmit`, `npx vitest run tests/housing.test.ts tests/furniture.test.ts tests/construction_*.test.ts` |
| server | `npx tsc --noEmit`, `npm run build:server` |
| net/wire | `npx vitest run tests/snapshots.test.ts` |
| ui/render | `npx tsc --noEmit`, `npx vitest run tests/localization_fixes.test.ts` |
| tutorial | `npx vitest run tests/quests.test.ts tests/localization_fixes.test.ts` |
| pre-merge | `npx tsc --noEmit && npm run build:server && npm run build` |

## Arquivos-chave

### Existentes
- `src/sim/data.ts` - isDelvePos bug (line ~465)
- `src/net/online.ts` - ClientWorld construction stubs (line ~955-970)
- `server/game.ts` - selfWireJson encoder (line ~3513), command dispatch (line ~2551)
- `src/render/renderer.ts` - updateAmbience (line ~3692)
- `src/render/dungeon.ts` - DungeonInteriors (padrao para interior)
- `src/render/interior_kit.ts` - asset loading
- `src/render/assets/manifest.generated.ts` - GLB assets
- `src/ui/hud.ts` - build mode + furniture placement callbacks (line ~9648)
- `src/ui/build_mode_window.ts` - build mode panel
- `src/sim/professions/construction/housing.ts` - enterHouse (line ~71)
- `src/sim/content/construction_items.ts` - furniture defs
- `src/sim/professions/construction/furniture.ts` - PlacedFurniture type + catalog

### Novos (a criar)
- `src/render/house_interior.ts` - orquestrador de interior de casa
- `src/render/furniture_render.ts` - renderizacao de mobilia 3D
- `tests/house_interior_render.test.ts` - testes do renderer
- `src/sim/content/tutorial_quests.ts` - questoes do tutorial (ou estender quests existentes)
