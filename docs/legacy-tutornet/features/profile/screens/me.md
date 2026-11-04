# Screen Spec — Me — My Profile Dashboard

**Figma:** `1CAT8HGWvQx5GEVWmoiNtv`, **Page 1**, node `538:1706`.  
**Reference:** `frontend/app/docs/visual/references/profile/me--default.png`.  
**Evidence:** frame ID/name verified from direct Figma metadata; composition from user-supplied screenshot; exact component token IDs/auto-layout values currently `DESIGN_UNVERIFIED`.

## Visible layout / copy

- Fixed top header uses the TutorNET butterfly logo mark, **Me**, settings and notification icon (badge).
- Large white profile card with maroon banner, **Open for new requests** badge, initials QH avatar + verified check, **Verified Tutor**, **Quang Huy Nguyen**, **Mathematics & Physics Tutor**, grades/experience/location, Math and Physics chips, fee range.
- Actions **View Profile**, **Edit Profile**. Three stats cards Connections 8, Applications 3 (1 offer pending), Rating 4.9 / 32 reviews.
- **ACCOUNT MANAGEMENT** section (DUT Verified ID) with rows **My Profile**, **Your Applications**, **Saved Items**. Figma metadata additionally confirms lower rows **My Connections**, **Settings**, **Help & Support**, **Log out** and app version/footer note below the current viewport.
- Five-tab fixed bottom bar, Me selected. The long internal content must scroll behind/above it correctly.

## Interactions and navigation

- Toggle availability demo if defined interactive; View/Edit navigate only when destination exists.
- Account management actions report unavailable where no approved screen exists. Log out invokes existing fake session repository and clears navigation back stack.
- Notification bell enters Notifications; tapping stat tile uses approved route or explicit demo feedback.

## UI states and acceptance

- Content, fake profile loading/error, long scroll, badge/availability updates, logout confirmation if approved.
- Test all lower rows are reachable by vertical scrolling and never hidden behind bottom bar.

## Constraints and uncertainties

Figma metadata confirms `538:1706` outer 390×884, inner edge-to-edge 390×844 viewport, scroll content ~1036px, profile section, stats row and 7 management rows. These are structural measurements only; adaptive Compose layout and real Android OS bars still required.

**Visual QA:** compare matched-viewport Figma crop and Android screenshot; track typography, spacing, wraps, icon assets, scroll position, bottom nav and OS insets. A screenshot is a reference, never a runtime drawable.
