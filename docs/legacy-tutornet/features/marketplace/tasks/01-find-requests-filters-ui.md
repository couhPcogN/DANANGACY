# Coding Task — Find Requests filters bottom sheet

**Scope:** one bounded feature slice under `frontend/app/**`; **not a request to build the entire app**. Status: READY_FOR_IMPLEMENTATION_AFTER_DESIGN_GATES.

## Read first

- `frontend/app/AGENTS.md`, `frontend/app/docs/AI_WORKFLOW.md`, `frontend/app/docs/figma/FRAME_INVENTORY.md`
- Feature `../README.md` and screen spec(s): `../screens/find-requests-filters.md`
- `frontend/app/docs/visual/references/REFERENCE_INDEX.md` and the actual referenced PNG(s).
- Monorepo `docs/frontend/app-architecture.md`, `docs/frontend/frontend-backend-boundary.md`; inspect existing Kotlin classes and Gradle files.

## Implementation boundary

Implement the filter sheet and its state/validation. Use Material 3 modal bottom sheet where it can be configured to match; avoid a new generalized form framework. Wire to the Find Requests tab and a deterministic fake filtered result set only if a request repository already exists or is needed for functional demonstration. Do not build application/payment/contract workflows.

## Acceptance and tests

- Tests: chip/mode selection, reset/apply, budget validation, Android Back/dismiss, input preservation, IME.
- Real screenshot/diff with `marketplace/find-requests--filters-open.png`, including dim layer and sticky footer.

## Required report

Changed paths, UI state/actions, build/test commands with PASS/FAIL, reference vs actual screenshot and diff, unverified visual details, backend contract gaps. No changes to backend/infra, no invented API, no auto commit or automatic next phase.
