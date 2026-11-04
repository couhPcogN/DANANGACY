# My Network — TutorNET Mobile

**Design authority:** updated mobile family `538:*` in **Figma Page 1**, file `1CAT8HGWvQx5GEVWmoiNtv`. **Status:** DESIGN_REFERENCE_AVAILABLE / IMPLEMENTATION_NOT_VERIFIED. Screenshot supplied; Figma structural metadata verified for top-level frames, high-fidelity properties/tokens not retrieved due Starter limit.

## Frames and visual reference

| Screen | Figma node | Screen spec | Local PNG |
|---|---|---|---|
| My Network main | `538:1275` | `screens/my-network.md` | `network/my-network--default.png` |

## Product goal and in-scope behaviors

Display invitation and connection summary tiles, pending invitations with Ignore/Accept, and People you may know with Follow/Remove suggestions. Show list state from deterministic, cross-screen mock social network data.

## Route and state contract

Bottom tab My Network; invitation summary opens invitation section/route; connections summary opens existing known list if implemented. Follow/Accept/Ignore update shared fake state, counts and row visibility.

## Mock-first implementation

Domain `NetworkRepository` + fake user/connection/invitation models; avoid building graph/social backend API from UI labels. Counts and invitation cards derive from the same fake list.

## Quality gates

- Reuse `core/design` and the existing five-tab Android app shell rather than composing another bottom bar inside nested screens.
- Verify `Loading`, `Content`, `Empty`, `Error`, and relevant interaction-specific states (not necessarily all visually present in a single Figma screenshot).
- Every clickable affordance must either perform a coherent demo action or visibly explain that integration is unavailable; no dead-looking buttons that pretend to work.
- Render with proper Android system bars and IME insets; never draw iPhone status/gesture bars or embed an entire screenshot as UI.
- Build `:app:assembleDebug`, run relevant tests, compare emulator screenshot to its matching reference and report actual/diff paths. `VISUAL_UNVERIFIED` if no emulator screenshot.
- Do not infer backend DTOs, endpoint paths, push protocols, or auth rules from a Figma screenshot. Record `BACKEND_CONTRACT_GAP` instead.

## Notes / dependencies

The design shows badges of 2 invitations and 8 connections, which are fixture data, not hardcoded production counts.
