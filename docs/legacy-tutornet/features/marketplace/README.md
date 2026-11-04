# Find Requests / Filters — TutorNET Mobile

**Design authority:** updated mobile family `538:*` in **Figma Page 1**, file `1CAT8HGWvQx5GEVWmoiNtv`. **Status:** DESIGN_REFERENCE_AVAILABLE / IMPLEMENTATION_NOT_VERIFIED. Screenshot supplied; Figma structural metadata verified for top-level frames, high-fidelity properties/tokens not retrieved due Starter limit.

## Frames and visual reference

| Screen | Figma node | Screen spec | Local PNG |
|---|---|---|---|
| Filters bottom sheet open | `538:801` | `screens/find-requests-filters.md` | `marketplace/find-requests--filters-open.png` |

## Product goal and in-scope behaviors

Browse tutoring requests and filter by Subject, Grade, Teaching mode, Location and Budget. The verified current frame specifically captures an **open Filters bottom sheet**, not a separate completed Find Requests list design.

## Route and state contract

Bottom tab Find Requests enters request browsing shell; Filters button opens a dismissible bottom sheet. Reset restores defaults; Show results applies filters and closes sheet. Back first dismisses sheet; preserve selected values appropriately.

## Mock-first implementation

`RequestRepository` fake for deterministic requests if browsing screen exists; `FilterUiState` scoped to UI with stable selections and validation. Never invent tutor request application HTTP endpoints or acceptance flow.

## Quality gates

- Reuse `core/design` and the existing five-tab Android app shell rather than composing another bottom bar inside nested screens.
- Verify `Loading`, `Content`, `Empty`, `Error`, and relevant interaction-specific states (not necessarily all visually present in a single Figma screenshot).
- Every clickable affordance must either perform a coherent demo action or visibly explain that integration is unavailable; no dead-looking buttons that pretend to work.
- Render with proper Android system bars and IME insets; never draw iPhone status/gesture bars or embed an entire screenshot as UI.
- Build `:app:assembleDebug`, run relevant tests, compare emulator screenshot to its matching reference and report actual/diff paths. `VISUAL_UNVERIFIED` if no emulator screenshot.
- Do not infer backend DTOs, endpoint paths, push protocols, or auth rules from a Figma screenshot. Record `BACKEND_CONTRACT_GAP` instead.

## Notes / dependencies

Prior screenshots include request cards but their latest standalone node is not confirmed in `538:*`; treat list geometry as DESIGN_UNVERIFIED, focus implementation acceptance on sheet state.
