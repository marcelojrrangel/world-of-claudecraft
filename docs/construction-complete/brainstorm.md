# Construction Complete - Brainstorm

## Visao

Tornar o sistema de construcao (Phases 1-8) completamente jogavel no navegador,
tanto offline (Sim direto) quanto online (servidor). Um tutorial guiado ensina
o player a comprar um lote, construir uma casa, e colocar mobilia.

## Estado atual

### O que funciona (sim + server + UI)
- Compra de lote, construcao de fases, mobilia, baús, estacoes, permissoes
- 13 comandos roteados no server, ClientWorld envia todos
- 6 campos wire (`const`, `bps`, `fprog`, `furn`, `hben`, `chests`) OK
- UI: build mode window, house window, F3 keybind, mobile
- Colisao interior da casa (colliders.ts)
- XP descansado (rested) dentro de casa

### O que falta

1. **Bug: isDelvePos pega casa** (`data.ts:465-466`): `x >= DELVE_BAND_X_MIN`
   retorna true para x=15000, entrando em modo delve. FIX: adicionar
   `|| x >= HOUSE_X` na exclusive check ou inverter logica.

2. **Wire: houseState / myPlot / houseStations nao sao enviados**
   O servidor nao serializa `myPlot`, `houseState`, `houseStations`.
   ClientWorld tem stubs que sempre retornam null/0/[]. A UI (build mode
   window, house window) le esses campos e mostra tudo zerado.

3. **Sem renderizacao 3D do interior**
   Nenhum codigo no renderizador para interiores de casa. Precisa de
   geometria (paredes, piso, teto) e mobilia 3D.

4. **Sem UI de posicionamento de mobilia**
   `hud.ts:9648` chama `placeFurniture(itemId, 0, 0, 0)` - fixo em (0,0).
   Nao ha grid overlay, drag, ou input de coordenadas.

5. **Sem tutorial**
   O player nao tem orientacao de como comecar a construir.

## Ideias aprovadas

- Interiores usam o mesmo KayKit dungeon pack ja existente no manifest
- Placeholder geometry (paredes/chaos coloridos) enquanto nao ha arte final
- Grid overlay no chao da casa para posicionar mobilia (click-to-place)
- Tutorial: NPC mestre-de-obras na zona inicial que da quest guiada
- Tooltips explicativos no build mode window

## Fora de escopo (por enquanto)
- Exterior LOD (casas vizinhas em low-poly)
- Multiplayer: visitar casa de amigo com rendering
- Iluminacao dinâmica (tochas, lampadas)
