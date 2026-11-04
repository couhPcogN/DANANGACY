# TutorNET Android — Docs Index (Figma update 2026-10-30)

**Android project root:** `frontend/app/`  
**Docs root:** `frontend/app/docs/`  
**Canonical current mobile design:** Figma Page 1 `538:*` family (see `figma/FRAME_INVENTORY.md`).

## Start here

1. `../AGENTS.md` and monorepo `docs/frontend/app-architecture.md` + `docs/frontend/frontend-backend-boundary.md`.
2. `AI_WORKFLOW.md` — **one task per coding run**, build, emulator, screenshot review.
3. `figma/FRAME_INVENTORY.md` — all current screen IDs and feature owners.
4. `figma/DESIGN_CHANGELOG_2026-10-30.md` — exact differences vs older `475:*` family.
5. `visual/references/REFERENCE_INDEX.md` — exact PNG filenames and placement.
6. `navigation/ROUTES_AND_STATES.md` — shared 5-tab shell and cross-feature entry points.

## Feature documentation

| Feature | README | Current screen specs | Task |
|---|---|---|---|
| Auth | `features/auth/README.md` | Login; Register Learner/Tutor | `features/auth/tasks/05-register-entry-ui.md` (after Login visual gate) |
| Social | `features/social/README.md` | New Home Feed; older Post Detail/Create Post provisional | `features/social/tasks/01..03` existing |
| Network | `features/network/README.md` | My Network | `features/network/tasks/01-my-network-ui.md` |
| Marketplace | `features/marketplace/README.md` | Find Requests Filters open | `features/marketplace/tasks/01-find-requests-filters-ui.md` |
| Messaging | `features/messaging/README.md` | Inbox; Chat Thread | `features/messaging/tasks/01-messaging-ui.md` |
| Notifications | `features/notifications/README.md` | Notifications All | `features/notifications/tasks/01-notifications-ui.md` |
| Profile | `features/profile/README.md` | Me dashboard | `features/profile/tasks/01-me-ui.md` |

## Existing plans / caution

`00_MOBILE_PHASE_PLAN.md` now has a current-538 addendum. `02_LOGIN_475-31_AI_PROMPT.md` is replaced by an explicit **deprecated** redirect; use `02_LOGIN_538-454_AI_PROMPT.md` for current Login. The generic `01_MASTER_AI_FIGMA_TO_COMPOSE_PROMPT.md` and `03_FIGMA_FRAME_SPEC_TEMPLATE.md` remain valid. Existing Login task and Feed task also have version corrections.

## Coding and verification boundaries

All Kotlin code lives under `frontend/app/app/src/...`, feature-first; shared Compose system `core/design`. Mock data in `feature/<name>/data/fake`, contracts in `domain`, no backend modifications. Screen reference PNGs never become full-screen app bitmaps. No DONE without executed build/test and Emulator comparison with acknowledged gaps.
