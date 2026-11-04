# AI TASK 02 — Feed screen (538:244)

**Scope:** UI + navigation for the **new Page 1 Home Feed**; use already-implemented `SocialRepository`. Do not implement PostDetail/CreatePost screen bodies here.

## Read first

`frontend/app/AGENTS.md`, `docs/01_MASTER_AI_FIGMA_TO_COMPOSE_PROMPT.md`, `docs/features/social/README.md`, `docs/features/social/screens/feed.md`, current Gradle/theme/navigation code.

## Required design evidence

Get high-fidelity Figma node context **and screenshot** of `538:244`; inspect component instances and exact image/assets. If inaccessible, report `DESIGN_UNVERIFIED` and do not fabricate visual fidelity, but architecture/test scaffolding may proceed.

## Implementation

- `FeedRoute` state collection/navigation callbacks; stateless `FeedScreen`; `FeedViewModel`, immutable `FeedUiState` and feature-local post card components when justified.
- Fetch and observe fake feed via repository; handle loading/content/empty/retryable errors, refresh only when approved by design.
- Use `LazyColumn` stable keys, visible actions and **shared app-shell** bottom navigation consistent with `538:244`. Do not copy legacy `475:32` component layout or force its first-post Like/Comment row onto the current matched-request card.
- Navigation callbacks for Post Detail/Create Post may be exposed as contracts; only navigate when destination exists.
- Previews for content/loading/empty/error with static sample UiState; UI tests for post click, like, empty state, screen scroll.

## Gate

Build/test pass; screenshot comparison with Figma at matched viewport/font scale and documented differences; no use of Figma screenshot as runtime artwork; no fabricated backend API.
