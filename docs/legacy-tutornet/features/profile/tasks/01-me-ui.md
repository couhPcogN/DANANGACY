# Coding Task — Me dashboard + fake session logout

**Scope:** one bounded feature slice under `frontend/app/**`; **not a request to build the entire app**. Status: READY_FOR_IMPLEMENTATION_AFTER_DESIGN_GATES.

## Read first

- `frontend/app/AGENTS.md`, `frontend/app/docs/AI_WORKFLOW.md`, `frontend/app/docs/figma/FRAME_INVENTORY.md`
- Feature `../README.md` and screen spec(s): `../screens/me.md`
- `frontend/app/docs/visual/references/REFERENCE_INDEX.md` and the actual referenced PNG(s).
- Monorepo `docs/frontend/app-architecture.md`, `docs/frontend/frontend-backend-boundary.md`; inspect existing Kotlin classes and Gradle files.

## Implementation boundary

Implement MeRoute/ViewModel/Screen using a stable fake profile consistent with `DemoSession`. Prefer a single state source for identity; preserve existing AuthRepository logout. Reuse shared bottom nav, avatar/card/badge components. Ensure all seven account management rows can scroll, and only verified destinations navigate. Do not implement Edit Profile or profile update backend as side effects.

## Acceptance and tests

- Tests: session identity consistency, dashboard content, scroll to lower rows, logout clears session/navigation, accessible labels and badges.
- Emulator screenshot/diff against `profile/me--default.png`; test fixed tabs while scrolling.

## Required report

Changed paths, UI state/actions, build/test commands with PASS/FAIL, reference vs actual screenshot and diff, unverified visual details, backend contract gaps. No changes to backend/infra, no invented API, no auto commit or automatic next phase.
