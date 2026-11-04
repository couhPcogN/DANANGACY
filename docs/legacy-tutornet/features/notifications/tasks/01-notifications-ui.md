# Coding Task — Notifications list & read state

**Scope:** one bounded feature slice under `frontend/app/**`; **not a request to build the entire app**. Status: READY_FOR_IMPLEMENTATION_AFTER_DESIGN_GATES.

## Read first

- `frontend/app/AGENTS.md`, `frontend/app/docs/AI_WORKFLOW.md`, `frontend/app/docs/figma/FRAME_INVENTORY.md`
- Feature `../README.md` and screen spec(s): `../screens/list.md`
- `frontend/app/docs/visual/references/REFERENCE_INDEX.md` and the actual referenced PNG(s).
- Monorepo `docs/frontend/app-architecture.md`, `docs/frontend/frontend-backend-boundary.md`; inspect existing Kotlin classes and Gradle files.

## Implementation boundary

Create one notifications feature with repository interface, stateful fake data, UiState/ViewModel and a stateless Compose screen. Reuse shared app shell. Wire bell action from Home and appropriate badge counters. Implement All/Unread, mark read/all, older list, contextual demo buttons without inventing backend event schema.

## Acceptance and tests

- Tests: filter by unread, mark all, mark one, badge consistency, Back to origin.
- Emulator diff against `notifications/list--all.png`; verify long scroll and fixed bottom bar.

## Required report

Changed paths, UI state/actions, build/test commands with PASS/FAIL, reference vs actual screenshot and diff, unverified visual details, backend contract gaps. No changes to backend/infra, no invented API, no auto commit or automatic next phase.
