# Figma Design Change Audit — 2026-10-30

**Scope:** new current mobile frame family `538:*` in Figma Page 1. Figma top-level page count is still three. This audit updates **documentation only**; it does not modify the user's local Kotlin project or Figma itself.

## Superseded / conflicting references

- **Login:** use `538:454` instead of old `475:31` for the active burgundy, English-language Login. Preserve auth behavior already implemented; only visual spec changes.
- **Home Feed:** use `538:244` instead of old `475:32` for current header, global search, composer and post-card layout. Old Feed spec content must not override new layout.
- **Notifications:** `538:2` is now explicitly verified as a top-level mobile frame, replacing prior `506:1237` selected-only evidence.
- **Registration:** independent Learner `538:692` and Tutor `538:1165` visual variants are confirmed; this does **not** verify every other onboarding step or a production account-creation flow.
- **Find Requests:** filter-open bottom-sheet state is `538:801`; standalone closed-list/success screens were not verified in the new family.
- **Messaging:** current inbox `538:1541`, chat `538:541`; do not invent media calls, live sockets, delivered/read receipts or trial-booking API behavior.
- **New feature families:** My Network `538:1275`; Me/Profile `538:1706`.
- **Post Detail/Create Post:** previously documented `475:33`, `475:34` remain as legacy candidates; current-version replacements not confirmed.

## Visible system differences relevant to Android

- Branding consistently uses deep burgundy; login has a large burgundy hero, white rounded overlap card, English copy.
- Five-tab bottom bar shared among main authenticated screens: Home, My Network, Find Requests, Messaging, Me; do not duplicate it inside a chat detail screen.
- Header formats differ by screen, but use shared architecture and reusable components where it preserves appearance.
- Notification and profile lists contain long content; implement scroll with correct fixed bottom navigation and system inset handling.
- Figma screenshots sometimes include decorative black/noisy image margins and iOS-like system symbols; crop only non-app canvas for visual compare, and never paint fake OS bars.

## Updated docs (replacement files in this package)

`docs/README.md`, `docs/AI_WORKFLOW.md`, `docs/design-system/README.md`, `docs/features/auth/README.md`, `docs/features/auth/screens/login.md`, `docs/features/social/README.md`, `docs/features/social/screens/feed.md`, `docs/visual/references/REFERENCE_INDEX.md`.

## Newly added docs

`docs/figma/*`, `docs/navigation/ROUTES_AND_STATES.md`, screen specs/feature READMEs/tasks for registration, marketplace, notifications, messaging, network and profile.

## Evidence and limitations

Direct Figma metadata confirms frame IDs, names and dimensions. Detailed metadata for `538:1706` confirms internal profile sections, statistic row, account settings, fixed top bar, and five-tab bottom bar. For other frames, layout and copy are grounded in user-supplied screenshots. The high-fidelity Figma design context/variable GUIDs and original SVG assets remain unverified because of Figma Starter rate limits.

## Existing prompt/task migration guards

`00_MOBILE_PHASE_PLAN.md` now has a 538 version override; older `02_LOGIN_475-31_AI_PROMPT.md` is a deprecation redirect to `02_LOGIN_538-454_AI_PROMPT.md`; the original Login, Feed and Post coding task files include safe migration notes. Do not re-run historical Login implementation as if no code existed.
