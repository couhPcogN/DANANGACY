# DESIGN GATE WARNING — Post/Comments + Create Post

The verified current 538 mobile group **does not contain a replacement** for older nodes `475:33` and `475:34`. This is a **provisional older design task**. Do **not** start a pixel-fidelity implementation or claim that its old visual styling matches the new `538:244` Feed until the designer approves these screens as current or supplies new nodes/screenshots. Data/interaction work may proceed only as a separately reviewed bounded task.

---

# AI TASK 03 — Post detail, comments and create post UI

**Depends on:** social fake store task and Feed route. **Scope:** `feature/social/presentation/postdetail`, `createpost`, feature-local shared components, targeted navigation/test files.

## Read first

`frontend/app/AGENTS.md`, `docs/01_MASTER_AI_FIGMA_TO_COMPOSE_PROMPT.md`, `docs/features/social/README.md`, `docs/features/social/screens/post-detail.md`, `docs/features/social/screens/create-post.md`, current app source.

## Required design evidence

Get high-fidelity Figma node context AND screenshots for `475:33` and `475:34`, exact assets/icons/tokens/component instances. If inaccessible, document unverified visual areas and stop before declaring fidelity completed.

## Implement

- Detail route takes stable client post ID; UI shows same post as Feed and shared repository counts; comments list, send composer, keyboard/insets, error/loading/not-found.
- Create route with editable draft, validation, mock publish operation, double-submit protection, failure retention, navigate back to Feed after success.
- Stateless Compose content, route-level state collection, ViewModels orchestrate repository calls; no fake posts in Composables; retain draft on rotation/process recreation when appropriate.
- Test Feed → Detail → Comment → Feed, Feed → Create → Publish → Feed, failure/retry, empty input, keyboard layout and accessibility labels.
- Do not invent media button, additional form fields or labels whose Figma design has not been verified; record missing evidence.

## Gate

Build, unit/UI tests and per-screen screenshot comparison. Detail/Create Post screenshots and remaining differences must be listed; no backend/infra modifications or invented contracts.
