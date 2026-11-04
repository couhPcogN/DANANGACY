# Messaging — TutorNET Mobile

**Design authority:** updated mobile family `538:*` in **Figma Page 1**, file `1CAT8HGWvQx5GEVWmoiNtv`. **Status:** DESIGN_REFERENCE_AVAILABLE / IMPLEMENTATION_NOT_VERIFIED. Screenshot supplied; Figma structural metadata verified for top-level frames, high-fidelity properties/tokens not retrieved due Starter limit.

## Frames and visual reference

| Screen | Figma node | Screen spec | Local PNG |
|---|---|---|---|
| Inbox / Focused | `538:1541` | `screens/inbox.md` | `messaging/inbox--focused.png` |
| Conversation / Nguyen Minh Anh | `538:541` | `screens/conversation.md` | `messaging/conversation--thread-top.png` |

## Product goal and in-scope behaviors

Messaging inbox with Focused/Other tabs, search, unread indicators, conversation previews and compose-new icon; selected chat thread with contact status, request context bar, message bubbles, proposal card and bottom composer.

## Route and state contract

Bottom tab Messaging → Inbox; tap row → Conversation. Chat back → Inbox; preserve scroll. Conversation header shows actions but calling/video are not evidence of real VoIP capability.

## Mock-first implementation

One shared `MessagingRepository` fake holding thread list, messages and unread counters. Sending demo message updates both conversation and inbox preview in one source of truth. No WebSocket or fake production event IDs.

## Quality gates

- Reuse `core/design` and the existing five-tab Android app shell rather than composing another bottom bar inside nested screens.
- Verify `Loading`, `Content`, `Empty`, `Error`, and relevant interaction-specific states (not necessarily all visually present in a single Figma screenshot).
- Every clickable affordance must either perform a coherent demo action or visibly explain that integration is unavailable; no dead-looking buttons that pretend to work.
- Render with proper Android system bars and IME insets; never draw iPhone status/gesture bars or embed an entire screenshot as UI.
- Build `:app:assembleDebug`, run relevant tests, compare emulator screenshot to its matching reference and report actual/diff paths. `VISUAL_UNVERIFIED` if no emulator screenshot.
- Do not infer backend DTOs, endpoint paths, push protocols, or auth rules from a Figma screenshot. Record `BACKEND_CONTRACT_GAP` instead.

## Notes / dependencies

Trial-session proposal is visible in the user-supplied design. Treat confirmation as a local demo transition only until scheduling/booking contract is approved.
