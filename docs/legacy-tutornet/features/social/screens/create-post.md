# Screen Spec — 04 Tạo bài viết

**Figma:** file `1CAT8HGWvQx5GEVWmoiNtv`, frame `475:34`, 390 × 844. Top-level frame and some nested nodes were retrieved; detailed full-frame screenshot, assets and interactions not yet verified.

## Confirmed visible elements

- Android status reference; top app bar with back action and title `Tạo bài viết`.
- Author row `Gia Hân Trịnh` and supporting `Chia sẻ với cộng đồng`.
- Scrollable content panel is present. **Other fields, action placement, media options and publishing labels require high-fidelity Figma verification.**

## Behavior contract for mock demo (not a Figma claim)

- Preserve a draft text state and validate nonempty content before publishing.
- `FakeSocialRepository` creates new post with deterministic ID/current demo author; Feed observes the new item.
- Prevent double submit, show loading/success/failure, preserve draft on failure.
- Only add media picker/visibility controls if confirmed in screenshot/node hierarchy; do not invent unverified UI controls.

## Visual checklist

Fetch exact screenshot and context first; inspect layout constraints, field styles, compose area, keyboard behavior, action placement, colors/type/spacing and image resources. No final visual QA until all design evidence is available.

**Task:** `../tasks/03-post-ui.md` | **Feature:** `../README.md`.
