# Screen Spec — My Network

**Figma:** `1CAT8HGWvQx5GEVWmoiNtv`, **Page 1**, node `538:1275`.  
**Reference:** `frontend/app/docs/visual/references/network/my-network--default.png`.  
**Evidence:** frame ID/name verified from direct Figma metadata; composition from user-supplied screenshot; exact component token IDs/auto-layout values currently `DESIGN_UNVERIFIED`.

## Visible layout / copy

- Top bar TutorNET logo, **My Network**, network search, bell badge.
- Two summary cards: **Invitations (2)** and **Connections (8)**.
- Invitations panel with See all (2), cards for **Le Thi Lan** and **Dang Van Khoa**, mutual/same-school info, **Ignore** and burgundy **Accept** buttons.
- People you may know panel with suggested people such as **Ba Khang Huynh**, **Gia Han Trinh**, + Follow button, dismiss X.
- Shared five-tab bottom bar, My Network active; content scrolls beneath fixed bar.

## Interactions and navigation

- Search people, Accept/Ignore invitation, Follow/Unfollow, remove suggestion and See all via defined navigation or demo feedback.
- Invitation count and list stay consistent; no fake backend request to Profile Service.

## UI states and acceptance

- With invitations, empty invitations, search empty, loading/error, accepted/ignored, follow state.
- Screenshot compare tile sizes, avatar chips, button heights and sticky bar.

## Constraints and uncertainties

Names/counts are demonstration fixtures. Cross-feature acceptance notification may be coordinated in fake stores only when explicitly designed; no invented server event.

**Visual QA:** compare matched-viewport Figma crop and Android screenshot; track typography, spacing, wraps, icon assets, scroll position, bottom nav and OS insets. A screenshot is a reference, never a runtime drawable.
