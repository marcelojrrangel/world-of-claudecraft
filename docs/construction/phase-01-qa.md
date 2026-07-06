### QA Starter Prompt
```
This is Phase 1 QA of the Construction System feature: Verify data model & profession.

Model: default.
Harness: OpenCode.

Goal: Audit Phase 1 implementation for correctness, missing tests, back-compat,
three-host parity, and determinism purity.

STEP 0 - PRE-FLIGHT:
- Verify `git status` is clean (Phase 1 should already be committed).

STEP 1 - LOAD CONTEXT:
Spawn an explore agent to read and return:
- docs/construction/state.md (Phase 1 decisions: wire key `const`, persistence `building`)
- docs/construction/progress.md (Phase 1 deliverables checklist)
- docs/construction/phase-01-datamodel.md (what was promised)
- git diff against the phase-start commit to see all changes

STEP 2 - QA AUDIT:

Correctness checks:
- CONSTRUCTION_PROFESSION defined with correct shape (secondary, maxSkill: 300)
- ConstructionSystem type covers all future fields (skill, plotId, houseTier,
  knownBlueprints, phasesBuilt, furniture)
- PlayerMeta.construction initialized in createPlayer
- IWorldConstruction exposes `constructionSkill: { skill, maxSkill }`
- Sim.constructionSkillFor(pid) reads from the right PlayerMeta field
- ClientWorld.constructionSkill field + delta decode: `if (s.const !== undefined)`
- Server selfWireJson: `maybe('const', ...)`
- ALL_DELTA_KEYS includes 'const'
- TERSE_TO_IWORLD maps const → constructionSkill
- IWORLD_MEMBERS updated and count pinned
- normalizeConstructionSystem() handles null/undefined/missing keys
- Persistence key 'building' round-trips through serialize/deserialize

Test coverage:
- Verify IWORLD_MEMBERS count is correct in tests/world_api_parity.test.ts
- Verify snapshots.test.ts still passes with new delta key
- Add a test: normalizeConstructionSystem with null → returns defaults
- Add a test: normalizeConstructionSystem with partial state → preserves fields
- Add a test: normalizeConstructionSystem with extra fields → ignores extra
- Add a test: Sim.constructionSkill returns expected shape

Dead code & cleanup:
- No unused imports in new/modified files
- No src/sim/ imports from render/ui/game/net
- No comments left behind from copying patterns
- Types are clean (no `any`)

Review dispatch:
- architecture-reviewer: YES (src/sim/ changed — determinism, SimContext seam)
- cross-platform-sync: YES (IWorld + src/sim + ClientWorld + server wire changed)
- privacy-security-review: NO (no server/auth/secrets)
- migration-safety: YES (JSONB persistence key `building` added)
- qa-checklist: NO (not phase-complete yet only Phase 1)

STEP 3 - FIX:
Apply all BLOCKING and SHOULD-FIX items. Re-run validation. Commit fixes.

STEP 4 - UPDATE DOCS:
- progress.md: mark Phase 1 QA complete
- state.md: update with any drift

STEP 5 - FINAL RESPONSE:
QA verdict (PASS / PASS-WITH-FOLLOWUPS / FAIL), counts, one-line handoff for Phase 2.
```
