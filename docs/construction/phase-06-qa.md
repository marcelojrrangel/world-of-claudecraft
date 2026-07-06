### QA Starter Prompt
```
This is Phase 6 QA of the Construction System feature: Verify benefits & social.
Goal: Audit Phase 6 — rested XP bonus, crafting stations, storage chests,
social visit system, permissions.

Review dispatch:
- architecture-reviewer: YES (src/sim/ rested XP integration, station bonuses)
- cross-platform-sync: YES (IWorld reads + social commands)
- migration-safety: YES (chest persistence in JSONB)
- privacy-security-review: YES (visit permissions, social data exposure)
- qa-checklist: NO
```
