# QA Checklist — Construction System

Final integration matrix verified at packet completion.

## Three-host parity

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Offline Sim builds phase correctly | — | |
| Online ClientWorld mirrors construction state | — | |
| Headless env exposes construction obs (if applicable) | — | |
| Same seed → same build outcomes | — | |

## Determinism

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| No `Math.random` / `Date.now` / `performance.now` in `src/sim/` construction code | — | |
| All construction RNG via `ctx.rng.next()` | — | |
| `tests/architecture.test.ts` (sim-purity guard) green | — | |

## i18n completeness

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Every player-visible construction string is a `t()` key | — | |
| Keys present in all locales (`translations/*.json`) | — | |
| Sim/server emits have matcher rules in `sim_i18n.ts` / `server_i18n.ts` | — | |
| `npx vitest run tests/localization_fixes.test.ts` (S3 guard) green | — | |
| Numbers/money go through `formatNumber` / `formatMoney` | — | |

## Server authority

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Build commands validated server-side | — | |
| Client cannot place furniture outside owned instance | — | |
| Material consumption happens on server | — | |
| Plot purchase race-condition handled (first-come-first-served) | — | |

## Persistence

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Characters saved before feature still load (back-compat) | — | |
| Construction state save/load round-trip verified | — | |
| Storage chest contents persist and restore | — | |
| Plot assignments persist across server restart | — | |
| DDL changes are additive and idempotent | — | |

## Performance

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Interior furniture chunked loading (not all at once) | — | |
| Exterior LOD for neighborhood rendering | — | |
| Snapshot bandwidth: build state delta-guarded | — | |
| No per-tick allocations in hot build paths | — | |
| `npm run perf:tour` within budget | — | |

## Build gate

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| `npm test` green | — | |
| `npx tsc --noEmit` green | — | |
| `npm run build:env` green | — | |
| `npm run build:server` green | — | |
| `npm run build` green | — | |
| `npm run ci:changed` (Biome) green | — | |

## Copy review

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| No em dashes in player-facing text | — | |
| No emojis (raw or Unicode) in game text | — | |
| British spelling conventions consistent | — | |
| Construction terms clear and consistent (plot vs lot, build vs construct) | — | |
