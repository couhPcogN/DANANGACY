# Coding Task — My Network + invitations demo

**Scope:** one bounded feature slice under `frontend/app/**`; **not a request to build the entire app**. Status: READY_FOR_IMPLEMENTATION_AFTER_DESIGN_GATES.

## Read first

- `frontend/app/AGENTS.md`, `frontend/app/docs/AI_WORKFLOW.md`, `frontend/app/docs/figma/FRAME_INVENTORY.md`
- Feature `../README.md` and screen spec(s): `../screens/my-network.md`
- `frontend/app/docs/visual/references/REFERENCE_INDEX.md` and the actual referenced PNG(s).
- Monorepo `docs/frontend/app-architecture.md`, `docs/frontend/frontend-backend-boundary.md`; inspect existing Kotlin classes and Gradle files.

## Implementation boundary

Implement NetworkRepository fake data and a stateless `MyNetworkScreen`; ViewModel events for accept, ignore, follow, dismiss and search. Wire one My Network tab in shared navigation. Use existing avatar/badge/card/button components; no backend API.

## Acceptance and tests

- Tests: accept/ignore adjusts invitation count, follow/unfollow state, query filters, empty view, Back/tab navigation.
- Emulator screenshot/diff with `network/my-network--default.png`.

## Required report

Changed paths, UI state/actions, build/test commands with PASS/FAIL, reference vs actual screenshot and diff, unverified visual details, backend contract gaps. No changes to backend/infra, no invented API, no auto commit or automatic next phase.
