# Me / My Profile — TutorNET Mobile

**Design authority:** updated mobile family `538:*` in **Figma Page 1**, file `1CAT8HGWvQx5GEVWmoiNtv`. **Status:** DESIGN_REFERENCE_AVAILABLE / IMPLEMENTATION_NOT_VERIFIED. Screenshot supplied; Figma structural metadata verified for top-level frames, high-fidelity properties/tokens not retrieved due Starter limit.

## Frames and visual reference

| Screen | Figma node | Screen spec | Local PNG |
|---|---|---|---|
| Me dashboard | `538:1706` | `screens/me.md` | `profile/me--default.png` |

## Product goal and in-scope behaviors

Show the user's Tutor profile summary, availability, verification state, teaching subjects and session rate; statistics; account-management rows and logout. This is a Me dashboard, not the full profile-edit flow.

## Route and state contract

Bottom tab Me enters dashboard. View Profile/Edit Profile/My Profile, Applications, Saved Items, Connections, Settings, Help & Support route only when backed by approved screen specs; otherwise explicit informational placeholder, not fabricated production pages. Log out clears fake auth session and returns to Login.

## Mock-first implementation

`ProfileRepository` client interface/fake profile fixture, or reuse a shared `DemoSession` identity from auth. Avoid inconsistent QH name/role across screens. Keep mock profile stats consistent where linked to Network/Applications; no production Profile Service integration in this UI slice.

## Quality gates

- Reuse `core/design` and the existing five-tab Android app shell rather than composing another bottom bar inside nested screens.
- Verify `Loading`, `Content`, `Empty`, `Error`, and relevant interaction-specific states (not necessarily all visually present in a single Figma screenshot).
- Every clickable affordance must either perform a coherent demo action or visibly explain that integration is unavailable; no dead-looking buttons that pretend to work.
- Render with proper Android system bars and IME insets; never draw iPhone status/gesture bars or embed an entire screenshot as UI.
- Build `:app:assembleDebug`, run relevant tests, compare emulator screenshot to its matching reference and report actual/diff paths. `VISUAL_UNVERIFIED` if no emulator screenshot.
- Do not infer backend DTOs, endpoint paths, push protocols, or auth rules from a Figma screenshot. Record `BACKEND_CONTRACT_GAP` instead.

## Notes / dependencies

FULL Figma node structure for `538:1706` was read: inner scroll content height > viewport, profile card + statistics + account management + fixed top header and bottom nav. Use node sizing as reference only, not absolute Compose dp mapping.
