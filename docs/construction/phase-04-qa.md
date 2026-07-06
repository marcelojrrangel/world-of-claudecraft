### QA Starter Prompt
```
This is Phase 4 QA of the Construction System feature: Verify blueprint construction.
Goal: Audit Phase 4 — blueprint definitions, learn/build mechanics, material consumption,
skill gain, tool gating, trivial-at threshold.

Review dispatch:
- architecture-reviewer: YES (src/sim/ behavior, skill gain in tick loop)
- cross-platform-sync: YES (IWorld reads + command)
- migration-safety: NO (no new persistence keys beyond Phase 3)
- privacy-security-review: NO
- qa-checklist: NO
```
