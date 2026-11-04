# TutorNET Android — Design System Evidence (updated 2026-10-30)

**Implementation location:** `frontend/app/app/src/main/java/com/tutornet/app/core/design/`. The Phase 02.1 agent reported burgundy theme `#6C1111`, warm backdrop `#F8F3F3`, Material 3 tokens, Button/TextField/Avatar/Card/Badge/TopAppBar/BottomBar. This is an **agent report, not an independently audited code snapshot**.

## Current design authority

Figma **Page 1, `538:*` mobile family**, plus screenshots in `docs/visual/references` and `docs/figma/FRAME_INVENTORY.md`. Existing legacy page `475:2` is not authoritative for updated Login/Home. Exact variable definitions and SVG exports are **unverified due Starter rate limit**; current color tokens are `SCREENSHOT_ESTIMATED`, not `DESIGN_VERIFIED`.

## Required reusable patterns

- Burgundy primary vs Facebook brand blue kept separate; Google logo uses approved genuine asset, not red letter glyph.
- Five-tab bottom nav (Home / My Network / Find Requests / Messaging / Me) is **one app-level component**. Active icon/text burgundy, inactive muted. Badges read from fake state and aren't hardcoded across screens.
- Screen headers vary by context: Login burgundy hero; Home global search+notification; Me logo+settings+notification; Messaging header; Chat toolbar; Notifications title/back/actions.
- Components: `TutorNetButton` (primary/outlined/social), TextField (validation/password eye), Avatar (initials/status), Card (outlined/elevated), Badge (status/count), typography/spacing/radius/icon assets.
- Preserve consistent border and corner treatments. Verify `Me` profile card stats/buttons and `Network` two-column summary against images before promoting one-off geometry to shared tokens.
- Use native insets/IME, long-list scrolling, accessible dynamic text sizes. No fake system bars, no Figma screenshot embedded as UI.

## Fidelity gate

For each component state: identify an exact Figma node/render or screenshot evidence, record selected token provenance, render Compose on the actual emulator, compare normalized image crops/typography, and document remaining diffs. `DESIGN_UNVERIFIED` for missing high-fidelity variables; `VISUAL_UNVERIFIED` for missing emulator evidence.

## Brand logo

Use the original supplied logo Android drawable `app/src/main/res/drawable-nodpi/tutornet_logo.png` where reference visibly shows the TutorNET mark. Do not invent an emoji equivalent. Check slot-specific size/contrast in Login, Register, Home, Network and Me; do not force the same background box on every context.
