# Screen Spec — Register Step 1 — Tutor

**Figma:** `1CAT8HGWvQx5GEVWmoiNtv`, **Page 1**, node `538:1165`.  
**Reference:** `frontend/app/docs/visual/references/auth/register--step-01-tutor-selected.png`.  
**Evidence:** frame ID/name verified from direct Figma metadata; composition from user-supplied screenshot; exact component token IDs/auto-layout values currently `DESIGN_UNVERIFIED`.

## Visible layout / copy

- Same shell, progress and form structure as learner registration.
- Segmented role control selects **I'm a tutor**.
- Tutor-only explanatory pale panel: **After creating your account, you'll complete your teaching profile — certificates, experience, and rates — in the next step.**
- Full name, Email or phone number, Password, Confirm password, terms and submit controls share components/state with learner variant.
- Screenshot viewport may crop lower content due scroll; do not delete content below the fold.

## Interactions and navigation

- Toggle Learner restores learner variant without destroying shared form draft.
- Tutor notice is contextual client content; it does **not** prove backend tutor-role creation.
- Validate inputs identically; remain on Step 1 until real/approved next-step specification exists.

## UI states and acceptance

- Tutor-selected, validation error, form scrolling and keyboard, disabled/loading demo.
- Confirm card height changes from tutor notice without overlaps; capture tutor-mode screenshot.

## Constraints and uncertainties

Treat `538:692`/`538:1165` as **variants of Step 1**, not proof of two independent five-step flows. Product/backend role policy requires confirmation.

**Visual QA:** compare matched-viewport Figma crop and Android screenshot; track typography, spacing, wraps, icon assets, scroll position, bottom nav and OS insets. A screenshot is a reference, never a runtime drawable.
