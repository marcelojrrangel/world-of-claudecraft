# QA Checklist - Construction Complete

## Três hosts
- [ ] Offline Sim: comprar lote, construir, entrar, mobilia, bau, estacao
- [ ] Online (server + ClientWorld): mesmas operacoes via comandos WS
- [ ] Headless: Sim roda sem erros (build:env)

## Wire
- [ ] `houseState`, `myPlot`, `houseStations` no snapshot
- [ ] ClientWorld decodifica e expoe corretamente
- [ ] UI le os valores reais (nao stubs)

## Renderer
- [ ] Entrar na casa mostra interior (paredes, piso, teto)
- [ ] Mobilia renderizada no lugar correto
- [ ] Colisao continua funcionando
- [ ] Sair da casa volta ao exterior

## UI
- [ ] Build mode window (F3) mostra blueprints, progresso, materiais
- [ ] House window mostra tier, mobilia, rested bonus
- [ ] Posicionamento de mobilia com grid/click
- [ ] Mobile: botoes de build mode funcionam

## Tutorial
- [ ] NPC mestre-de-obras presente na zona inicial
- [ ] Quest guiada: comprar lote -> construir fase 1 -> entrar
- [ ] Textos localizados (i18n)

## Builds
- [ ] `npx tsc --noEmit` green
- [ ] `npm run build:server` green
- [ ] `npm run build` green
