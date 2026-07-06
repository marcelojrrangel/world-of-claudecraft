### QA Starter Prompt
```
This is Phase 8 QA of the Construction System feature: Verify polish & balance.
Goal: FINAL QA GATE — balance review, test coverage, determinism, performance,
full CI gate. Then offer packet teardown.

This is the LAST phase. After verifying everything, ask the user for explicit
confirmation to delete docs/construction/ before the PR.

Review dispatch:
- architecture-reviewer: YES (determinism check on all construction code)
- cross-platform-sync: YES (full feature)
- migration-safety: YES (full persistence audit)
- privacy-security-review: YES (full audit)
- qa-checklist: YES (complete the full matrix)

Run the full CI-equivalent gate:
npm test && npx tsc --noEmit && npm run build:env && npm run build:server && npm run build
```
