# Screen Spec — Messaging — Chat thread

**Figma:** `1CAT8HGWvQx5GEVWmoiNtv`, **Page 1**, node `538:541`.  
**Reference:** `frontend/app/docs/visual/references/messaging/conversation--thread-top.png`.  
**Evidence:** frame ID/name verified from direct Figma metadata; composition from user-supplied screenshot; exact component token IDs/auto-layout values currently `DESIGN_UNVERIFIED`.

## Visible layout / copy

- Header back arrow, initials avatar, **Nguyen Minh Anh**, green active marker, call/video and more buttons.
- Request context strip: **Về yêu cầu: Math Tutor · Grade 8 ...** with View request.
- Pale chat background, Today separator, left white bubbles and right burgundy reply bubble, sender avatar/timestamps.
- A trial-session proposal card appears lower in the full design, including date/time, teaching mode, duration, confirmation action.
- Bottom composer with attach plus, **Nhập tin nhắn...**, emoji and send arrow; no main five-tab bar on this detail route.

## Interactions and navigation

- Enter and send text through fake repository; append bubble once and update inbox preview.
- Scroll to newest when appropriate; IME must not cover input. Confirm trial is a **mock-only** action pending schedule contract.
- Back returns to inbox. Call/video controls cannot claim real RTC integration.

## UI states and acceptance

- Empty composer disabled, loading/history, sent/pending/error, IME open, long message wrap, list restoration and proposal CTA.
- Compare screenshot at a *known scroll position*: upper screenshot may not show entire proposal; don't mistake cropped content for missing design.

## Constraints and uncertainties

Earlier `messaging/conversation--trial-proposal.png` is an additional screenshot showing lower proposal; keep it as optional supplementary reference if present. New `--thread-top.png` captures the recent top-of-thread screenshot.

**Visual QA:** compare matched-viewport Figma crop and Android screenshot; track typography, spacing, wraps, icon assets, scroll position, bottom nav and OS insets. A screenshot is a reference, never a runtime drawable.
