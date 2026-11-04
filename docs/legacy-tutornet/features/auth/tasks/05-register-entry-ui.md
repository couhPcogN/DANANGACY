# Coding Task — Register entry Step 1 (Learner + Tutor)

**Scope:** one bounded feature slice under `frontend/app/**`; **not a request to build the entire app**. Status: READY_FOR_IMPLEMENTATION_AFTER_DESIGN_GATES.

## Read first

- `frontend/app/AGENTS.md`, `frontend/app/docs/AI_WORKFLOW.md`, `frontend/app/docs/figma/FRAME_INVENTORY.md`
- Feature `../README.md` and screen spec(s): `../screens/register-learner.md`, `../screens/register-tutor.md`
- `frontend/app/docs/visual/references/REFERENCE_INDEX.md` and the actual referenced PNG(s).
- Monorepo `docs/frontend/app-architecture.md`, `docs/frontend/frontend-backend-boundary.md`; inspect existing Kotlin classes and Gradle files.

## Implementation boundary

Implement one RegisterRoute/Screen, immutable registration UiState with selected role and form values, ViewModel event handling and validation. Wire Sign up from Login and Log in back. Reuse Design System. Add tutor-only notice. Do not create later onboarding steps or perform real account creation. A deterministic demo submit may show a clearly labeled completion/unavailable state pending backend contract (not a fake real signup). Preserve existing fake login/session architecture.

## Acceptance and tests

- Unit tests for role toggling preserving form draft, password mismatch, terms required, invalid email/phone handling as specified, submit loading/no duplicates.
- Emulator screenshots of both `538:692` and `538:1165` variants, portrait & IME open. Diff against correct PNGs.
- No backend source modifications, no OAuth simulation, no fabrication of steps 2–5.

## Required report

Changed paths, UI state/actions, build/test commands with PASS/FAIL, reference vs actual screenshot and diff, unverified visual details, backend contract gaps. No changes to backend/infra, no invented API, no auto commit or automatic next phase.
