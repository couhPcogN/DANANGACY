# Screen Spec — Notifications — All

**Figma:** `1CAT8HGWvQx5GEVWmoiNtv`, **Page 1**, node `538:2`.  
**Reference:** `frontend/app/docs/visual/references/notifications/list--all.png`.  
**Evidence:** frame ID/name verified from direct Figma metadata; composition from user-supplied screenshot; exact component token IDs/auto-layout values currently `DESIGN_UNVERIFIED`.

## Visible layout / copy

- Header back, **Notifications**, **Mark all as read**.
- Two tabs: **All** selected, **Unread**.
- TODAY section shows three highlighted unread entries (application, tutor request accepted, message) with left unread dots and contextual icon/avatar badges. First item includes View Profile / Send a message.
- YESTERDAY contains connection acceptance and a five-star review; THIS WEEK contains profile search impressions, Finalize the dossier CTA.
- Footer **View older notifications**. Fixed shared bottom tabs when displayed in this design.

## Interactions and navigation

- All/Unread filtering; mark-all and individual mark-read; contextual action dispatch based on item type; older notifications pagination demo.
- Navigate only to existing routes; unavailable destinations must not become fabricated screens.

## UI states and acceptance

- Content + unread-only empty + errors; mark-all button disabled or subtle when no unread.
- Badge and unread dots update in sync with store; screenshot and test both states.

## Constraints and uncertainties

`538:2` is verified as a top-level mobile frame. `506:1237` from old docs is no longer the primary reference.

**Visual QA:** compare matched-viewport Figma crop and Android screenshot; track typography, spacing, wraps, icon assets, scroll position, bottom nav and OS insets. A screenshot is a reference, never a runtime drawable.
