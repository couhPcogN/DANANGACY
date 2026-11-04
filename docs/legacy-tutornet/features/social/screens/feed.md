# Screen Spec — Home Feed — current variant

**Figma:** `1CAT8HGWvQx5GEVWmoiNtv`, **Page 1**, node `538:244`.  
**Reference:** `frontend/app/docs/visual/references/social/home-feed--default.png`.  
**Evidence:** frame ID/name verified from direct Figma metadata; composition from user-supplied screenshot; exact component token IDs/auto-layout values currently `DESIGN_UNVERIFIED`.

## Visible layout / copy

- Global search header with QH avatar, **Search in TutorNET**, notification bell with badge.
- Warm background with white composer card: QH avatar, **What's on your mind?**, image and attachment shortcuts.
- First post **Mai Tran**, parent looking for tutor: MATCHED request card, Accepted status, **Math Tutor · Grade 8**, location, preferred times, applicants, pricing, **Message** CTA. Its visible action row includes Save and Send; do not force legacy Like/Comment controls into this card without confirmation.
- Second post **Vinh Tan Huynh** with exam-prep tip, engagement counts and Like / Comment / Save / Send action row.
- Fixed shared bottom tabs: Home, My Network, Find Requests, Messaging, Me.

## Interactions and navigation

- Composer starts Create Post only if route/design remains approved.
- Search/notifications navigate to defined shell destinations; post actions mutate stable fake state when supported.
- Message from matched request routes into conversation if implemented; otherwise explicit demo unavailable. Follow, Save, Like, Comment have deterministic mock behavior and correct counters.
- Scrollable post list with stable keys; status/navigation bars OS-managed.

## UI states and acceptance

- Content, loading, empty and retry error; like/save/follow variations with consistent fake state; text overflow and long content.
- Visual diff with **new** Home reference, not `475:32`. Verify card nesting and icon counts against screenshot.

## Constraints and uncertainties

This `538:244` layout differs structurally from the old `475:32` Feed. Preserve old Social workflows only where they do not conflict with new frame. Confirm exact SVG assets before using icon substitutes.

**Visual QA:** compare matched-viewport Figma crop and Android screenshot; track typography, spacing, wraps, icon assets, scroll position, bottom nav and OS insets. A screenshot is a reference, never a runtime drawable.
