# Notifications — TutorNET Mobile

**Design authority:** updated mobile family `538:*` in **Figma Page 1**, file `1CAT8HGWvQx5GEVWmoiNtv`. **Status:** DESIGN_REFERENCE_AVAILABLE / IMPLEMENTATION_NOT_VERIFIED. Screenshot supplied; Figma structural metadata verified for top-level frames, high-fidelity properties/tokens not retrieved due Starter limit.

## Frames and visual reference

| Screen | Figma node | Screen spec | Local PNG |
|---|---|---|---|
| Notifications list | `538:2` | `screens/list.md` | `notifications/list--all.png` |

## Product goal and in-scope behaviors

Show notifications grouped by TODAY, YESTERDAY, THIS WEEK, with unread highlights and contextual CTA buttons. Include All/Unread tabs, Mark all as read, individual overflow menu and View older notifications.

## Route and state contract

Bell icon → Notifications; Back returns to previous tab/screen; tapping item or CTA opens a verified destination or an explicit demo-unavailable state. The five-tab bottom bar in screenshot belongs to app shell; central overlay/screen must not duplicate it.

## Mock-first implementation

`NotificationRepository` domain contract + deterministic fake list with read/unread state. Shared badge count derived from the same fake store, not hardcoded separately in bell icon or bottom bar. Changing tab must not mutate read status.

## Quality gates

- Reuse `core/design` and the existing five-tab Android app shell rather than composing another bottom bar inside nested screens.
- Verify `Loading`, `Content`, `Empty`, `Error`, and relevant interaction-specific states (not necessarily all visually present in a single Figma screenshot).
- Every clickable affordance must either perform a coherent demo action or visibly explain that integration is unavailable; no dead-looking buttons that pretend to work.
- Render with proper Android system bars and IME insets; never draw iPhone status/gesture bars or embed an entire screenshot as UI.
- Build `:app:assembleDebug`, run relevant tests, compare emulator screenshot to its matching reference and report actual/diff paths. `VISUAL_UNVERIFIED` if no emulator screenshot.
- Do not infer backend DTOs, endpoint paths, push protocols, or auth rules from a Figma screenshot. Record `BACKEND_CONTRACT_GAP` instead.

## Notes / dependencies

The screenshot visibly shows application acceptance, message, connection, review and search-impression item types. Their real backend event contracts are not established by the image.
