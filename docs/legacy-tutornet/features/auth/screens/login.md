# Screen Spec — Log In

**Figma:** `1CAT8HGWvQx5GEVWmoiNtv`, **Page 1**, node `538:454`.  
**Reference:** `frontend/app/docs/visual/references/auth/login--default.png`.  
**Evidence:** frame ID/name verified from direct Figma metadata; composition from user-supplied screenshot; exact component token IDs/auto-layout values currently `DESIGN_UNVERIFIED`.

## Visible layout / copy

- Burgundy header with TutorNET wordmark/logo slot, **Welcome back**, supporting text about tutor requests and applications.
- White rounded card overlaps header. Centered **Log in to TutorNET** heading and **Enter your details to continue** subtitle.
- **Email or phone number**, **Password** with visibility icon; Remember me / Forgot password? row; solid Burgundy **Log in** button.
- Centered OR divider; Google-branded outlined button; **Don't have an account? Sign up** stays **inside** the white card.
- Warm off-white screen bottom; Android system status/navigation bars remain OS-controlled.

## Interactions and navigation

- Keyboard focus, password toggle, remember-me state, input errors and deterministic fake sign-in.
- Sign up navigates to shared Register entry (`538:692` state by default) once implemented; before that, no invented screen.
- Google action clearly marked unavailable for real auth unless real integration exists. Forgot password requires verified route or explicit unavailable state.
- On mock success navigate to Home, clearing Login from authenticated back stack.

## UI states and acceptance

- Idle, validation error, loading, fake success, fake failure and IME-open states.
- Screenshot captured on real emulator against the updated `538:454` reference; fix major geometry and copy before any 'pixel accurate' claim.
- Preserve existing MVVM and fake auth unit tests. Validate one navigation effect per success.

## Constraints and uncertainties

Legacy `475:31` is an **alternate older Vietnamese design** and not the current screenshot. Do not mix its book emoji, copy or component arrangement into this Login. Existing agent report claiming pixel-aligned without screenshot is not evidence. Exact Figma token GUIDs and logo opacity remain unverified.

**Visual QA:** compare matched-viewport Figma crop and Android screenshot; track typography, spacing, wraps, icon assets, scroll position, bottom nav and OS insets. A screenshot is a reference, never a runtime drawable.
