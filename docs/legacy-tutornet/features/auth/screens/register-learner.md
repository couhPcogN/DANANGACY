# Screen Spec — Register Step 1 — Learner

**Figma:** `1CAT8HGWvQx5GEVWmoiNtv`, **Page 1**, node `538:692`.  
**Reference:** `frontend/app/docs/visual/references/auth/register--step-01-learner-selected.png`.  
**Evidence:** frame ID/name verified from direct Figma metadata; composition from user-supplied screenshot; exact component token IDs/auto-layout values currently `DESIGN_UNVERIFIED`.

## Visible layout / copy

- Header TutorNET logo and split wordmark; **Step 1/5 — Create account** and five-segment progress indicator (first segment active).
- Rounded white card; **Create your TutorNET account**; **Free, and it only takes a minute**.
- Segmented role choice: **I'm a learner** selected; **I'm a tutor** unselected.
- Required fields Full name, Email or phone number (verification helper copy), Password, Confirm password; required Terms of Service and Privacy Policy agreement.
- Burgundy Create account button, Google sign-up option, existing-account Log in link; form scrolls with keyboard.

## Interactions and navigation

- Select Tutor role → Tutor variant/spec (same route/state); entering fields persists across role toggle when reasonable.
- Validate all required fields, password length/match and terms acceptance. Do not pretend to have sent an OTP or completed server registration.
- Log in returns to existing Login route. Legal links open known safe targets only if a verified destination exists; otherwise record gap.

## UI states and acceptance

- Learner-selected, focus/IME, validation errors, password visible/hidden, submitting state, offline/failure demo.
- Show Step 1/5 as design; steps 2–5 explicitly `DESIGN_UNVERIFIED` and cannot be generated from guesses.

## Constraints and uncertainties

Production phone verification, Google sign-up and role creation semantics have unapproved/missing integration contracts. Do not create backend endpoints or persist fake accounts as real.

**Visual QA:** compare matched-viewport Figma crop and Android screenshot; track typography, spacing, wraps, icon assets, scroll position, bottom nav and OS insets. A screenshot is a reference, never a runtime drawable.
