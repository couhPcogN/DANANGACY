# AI TASK 01 — Social client model + deterministic fake store

**Scope:** `feature/social/domain/**`, `feature/social/data/fake/**`, corresponding unit tests. No Compose screen changes unless required to compile an existing dependency.

## Read first

`frontend/app/AGENTS.md`, `docs/frontend/app-architecture.md`, `docs/features/social/README.md`, `docs/features/social/screens/*.md`, actual Gradle files and existing source. Search before create.

## Deliver

- Domain models for only those fields required by Feed/Post Detail/Create Post UI.
- `SocialRepository` domain interface with observable feed, get post by ID, like/unlike, add comment, create post; methods/return types chosen for client needs, not speculative HTTP.
- `FakeSocialRepository`: **single instance** in application composition/DI, stable fixtures, no runtime randomness unless injected, shared updates across screens, deterministic recoverable error scenarios.
- Unit tests proving unlike/like counters don't drift, comments increment once, new post is visible in feed, error mode does not mutate data, duplicate submit can be blocked at caller/use-case boundary.
- Add only the minimum DI plumbing actually needed; no Retrofit/Room/remote DTO, no backend writes.

## Gate

`./gradlew :app:assembleDebug` + relevant unit tests pass; describe how mock can later be replaced by real implementation without modifying Compose UI. No screen fidelity claim is relevant to this task.
