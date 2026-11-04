# Screen Spec — Messaging Inbox — Focused

**Figma:** `1CAT8HGWvQx5GEVWmoiNtv`, **Page 1**, node `538:1541`.  
**Reference:** `frontend/app/docs/visual/references/messaging/inbox--focused.png`.  
**Evidence:** frame ID/name verified from direct Figma metadata; composition from user-supplied screenshot; exact component token IDs/auto-layout values currently `DESIGN_UNVERIFIED`.

## Visible layout / copy

- Header **Messaging** and new-message/edit icon.
- Search messages field and tabs **Focused** (selected) / **Other**.
- Rows show avatar initials, full name, subject/role snippet, latest message preview, time, unread indicator (red dot) and online badge (where shown).
- Five-tab shared bottom navigation with Messaging active; badge count must be derived from mock unread state.

## Interactions and navigation

- Search/filter conversations, tab selection, tap conversation to `538:541`, mark read on entry.
- New-message action requires a verified user-picker flow or obvious demo-unavailable feedback.

## UI states and acceptance

- Focused content, Other content, search empty, loading/error, unread/read row variants.
- Test ordering/time presentation and unread badge syncing; compare text wraps and scroll viewport.

## Constraints and uncertainties

Do not invent actual instant-messaging transport, presence subscriptions, or video call functionality from visible icons.

**Visual QA:** compare matched-viewport Figma crop and Android screenshot; track typography, spacing, wraps, icon assets, scroll position, bottom nav and OS insets. A screenshot is a reference, never a runtime drawable.
