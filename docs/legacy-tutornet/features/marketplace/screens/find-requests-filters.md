# Screen Spec — Find Requests — Filters sheet open

**Figma:** `1CAT8HGWvQx5GEVWmoiNtv`, **Page 1**, node `538:801`.  
**Reference:** `frontend/app/docs/visual/references/marketplace/find-requests--filters-open.png`.  
**Evidence:** frame ID/name verified from direct Figma metadata; composition from user-supplied screenshot; exact component token IDs/auto-layout values currently `DESIGN_UNVERIFIED`.

## Visible layout / copy

- Dimmed Find Requests page behind a nearly full-height white bottom sheet with drag handle.
- Header **Filters**, close icon. Subject pill chips (Math selected; Physics, Chemistry, Biology, English, + More).
- Grade dropdown; Teaching mode segmented pills (Online, **Offline** selected, Hybrid).
- Location dropdown; Budget Min/Max amount inputs with đ currency labels.
- Sticky footer actions **Reset** and **Show results** above system gesture region.

## Interactions and navigation

- Open, close via X, scrim or Back; vertical sheet scrolling to budget controls.
- Chips and teaching mode selectable. Grade/location options require explicit fixtures; budget validates min ≤ max, nonnegative.
- Reset clears/reverts all controls consistently; Show results applies filter in fake domain and closes sheet.

## UI states and acceptance

- Sheet open/closed, selected chips, invalid budget, no result and keyboard-open.
- Visual diff sheet content with screenshot after cropping decorative black/noise frame; ensure footer remains accessible on small heights.

## Constraints and uncertainties

Current frame only confirms bottom-sheet-open state. The visual of the underlying request list is partially dimmed/obscured; do not infer entire screen from hidden pixels.

**Visual QA:** compare matched-viewport Figma crop and Android screenshot; track typography, spacing, wraps, icon assets, scroll position, bottom nav and OS insets. A screenshot is a reference, never a runtime drawable.
