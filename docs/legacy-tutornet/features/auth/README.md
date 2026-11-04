# TutorNET Mobile — Authentication Feature (current Figma 538 family)

**Design authority:** Figma **Page 1** current frames, file `1CAT8HGWvQx5GEVWmoiNtv`. Login `538:454`; Register Learner `538:692`; Register Tutor `538:1165`. Former Login `475:31` is **not the active visual reference**. **Implementation:** Login Phase 03 exists according to agent report; code and tests were reported PASS, but visual fidelity not accepted until emulator diff review.

## Screens and local reference files

| Screen | Node | Spec | Reference | Implementation |
|---|---|---|---|---|
| Login | `538:454` | `screens/login.md` | `auth/login--default.png` | Implemented, visual remediation pending review |
| Register (Learner selected) | `538:692` | `screens/register-learner.md` | `auth/register--step-01-learner-selected.png` | Not implemented |
| Register (Tutor selected) | `538:1165` | `screens/register-tutor.md` | `auth/register--step-01-tutor-selected.png` | Not implemented |

## Bounded behavior and architecture

- Keep existing `AuthRepository`, `FakeAuthRepository`, `LoginViewModel` and current unit-tested fake session; **do not rewrite Login logic** because Figma changed.
- Registration is one shared client-side flow with role state (`learner` or `tutor`), not two independent sign-up implementations. The screenshots show *Step 1/5*; **steps 2–5 are not verified** and must not be invented.
- Learner variant: name, email/phone label, password/confirm password, terms checkbox, Create account button, Google button, Login link.
- Tutor variant adds a tutor-specific explanatory notice and selects the Tutor side of the role control. Validate required fields and password confirmation.
- Screenshots use English UI copy. For visual review match selected screenshot language first; future Vietnamese localization is a separate acceptance target.
- Login mock: keep deterministic credentials in fake data layer; never log password, never ship fake credentials/implementation as production authentication.
- Google OAuth UI is not real Google authentication; phone/OTP contract and Tutor role assignment/onboarding require backend confirmation. `BACKEND_CONTRACT_GAP` or `INTEGRATION_PENDING` as appropriate.

## Visual resources

`docs/visual/references/auth/*` is screenshot reference, not drawable. Reuse the official `tutornet_logo.png` local Android asset where the design displays the logo; do not substitute emoji/icon. Some Login frame variants show an extremely subtle/low-contrast mark; compare exact node before adjusting prominence. Keep Android status bar/system insets real.

## Tasks and acceptance

- Existing `tasks/01-login-ui.md` describes the implementation that was performed; the old `475:31` references inside it must be interpreted as **superseded visual authority**, not an instruction to regress the UI.
- Existing `tasks/02-login-visual-verification.md`, `03-login-visual-fidelity-remediation.md`, `04-login-brand-logo-integration.md` remain applicable; complete emulator screenshot review first.
- New `tasks/05-register-entry-ui.md` covers **only registration Step 1 for both role variants**; do not implement unverified steps 2–5.
- PASS requires build/unit tests plus real Emulator screenshots for Login and registration variants; no fake OAuth success or invented backend DTOs.

Canonical constraints: `frontend/app/AGENTS.md`, monorepo `docs/frontend/app-architecture.md`, `docs/frontend/frontend-backend-boundary.md`.
