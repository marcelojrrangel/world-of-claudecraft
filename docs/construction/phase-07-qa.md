### QA Starter Prompt
```
This is Phase 7 QA of the Construction System feature: Verify UI & HUD.
Goal: Audit Phase 7 — build mode panel, furniture placement UI, house window,
keybinds, i18n completeness.

Review dispatch:
- architecture-reviewer: NO (no sim change)
- cross-platform-sync: YES (i18n matchers, SimEvent text)
- migration-safety: NO (no DB change)
- privacy-security-review: NO
- qa-checklist: NO

Key checks: S3 drift guard catches all new construction text, mobile touch targets
are comfortable, all strings have t() keys in all locales.
```
