# TutorNET Mobile — AI Coding Workflow (current 538 design family)

**Read order:** `AGENTS.md` → `docs/README.md` → `docs/figma/FRAME_INVENTORY.md` → `docs/navigation/ROUTES_AND_STATES.md` → relevant feature README → screen spec → **one** task file → screenshot reference.

## Design-version rule

`538:*` frames in **Figma Page 1** are currently authoritative for Login, Feed, Registration, Notifications, Messaging, Find Requests Filters, My Network and Me. Old `475:31`/`475:32` are alternate earlier designs. `475:33`/`475:34` Post Detail/Create Post remain **provisional** until new variants are verified. Never mix old and new design versions in one screen by accident.

## Per-task loop

1. Inspect actual current Kotlin/Gradle code, shared `core/design`, old implementation and local screenshot files. Preserve tested architecture.
2. Open exact Figma node and reference when access allows. If Figma high-fidelity read rate-limited, use supplied PNG **with honest `DESIGN_UNVERIFIED` note**, not invented tokens/assets.
3. List intended Kotlin files and behavior changes. Work on **one task only**; no backend changes or invented production routes.
4. Implement UDF/MVVM, StateFlow, fake repository at data layer, stable demo fixtures. Keep a single source of truth for shared identity, unread counters and social actions.
5. Execute `:app:assembleDebug` and `:app:testDebugUnitTest`, and UI tests where available. Record exact outcomes; `BUILD_SUCCESSFUL` cannot be assumed from earlier reports.
6. Run the screen on Android Emulator, screenshot, compare with normalized reference and address **major layout/style mismatches first**. If emulator unavailable: `VISUAL_BLOCKED`, not PASS.
7. Report files changed, tests, screenshots/overlay/diff, design/contract gaps. Reviewer approves before next task/commit.

## Recommended next actions

Since Login Phase 03 was reported build-successful but visually differed from Figma, **finish Login visual remediation and logo verification first**. Then perform `docs/navigation/ROUTES_AND_STATES.md` review for five-tab shell. Continue with one bounded feature task at a time (Register Step 1 or Feed; then Network, Marketplace filters, Messaging, Notifications, Profile depending demo priority).

## Scope rules

No backend/infrastructure edits; no fabricated HTTP DTO or WebSocket; no real Google/phone login without contract. No Figma screenshot as app UI. All interactive buttons must have coherent mock response or explicit unavailable feedback. Fixed native status bars & IME handled via Android insets.
