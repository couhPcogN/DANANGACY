# CURRENT FIGMA VERSION OVERRIDE — 2026-10-30

> This is an **addendum**, not a rewrite of the historic phase plan. The original 475 frame inventory below is superseded for Login and Home Feed. Current mobile frames are in **Page 1, `538:*`**. Always consult `docs/figma/FRAME_INVENTORY.md` before implementing any screen.
>
> Active Login `538:454`, Home Feed `538:244`, Register Learner `538:692`, Register Tutor `538:1165`, Notifications `538:2`, Find Requests Filters `538:801`, Inbox `538:1541`, Chat `538:541`, My Network `538:1275`, Me `538:1706`.
>
> Old Post Detail `475:33` and Create Post `475:34` are **provisional** until replacement designs are confirmed. Feature tasks are independent; do not interpret phase ordering as permission to implement all screens at once. Existing Login code is done per agent report but **visual verification must pass before moving forward**.

---

# TutorNET Mobile — Development Phases & Acceptance Gates

**Prepared:** 2026-10-29  
**Repository:** `FinalPBL/tutor-net` (`dev`)  
**Figma:** `https://www.figma.com/design/1CAT8HGWvQx5GEVWmoiNtv/PBL6--Tutornet?node-id=0-1`  
**Scope:** Kotlin Android native UI first; fake repositories until backend contracts and services are ready. Do not change infrastructure or backend for these tasks.

## Verified baseline and uncertainties

- `frontend/app/AGENTS.md`, `docs/frontend/app-architecture.md`, `docs/frontend/coding-conventions.md`, `docs/frontend/frontend-backend-boundary.md` and `docs/frontend/frontend-testing.md` already define mobile architecture and engineering conventions. **Read them before writing code.**
- On `dev`, no implemented Android Gradle project was found at the expected locations (`settings.gradle.kts`, app Gradle files, AndroidManifest), and code search did not find `MainActivity` or `@Composable` source. Recheck at implementation time.
- The Figma page `TutorNET • Android Social MVP` exists. Verified frames: Login `475:31`, Feed `475:32`, Post & Comments `475:33`, Create Post `475:34`; Notifications selected node `506:1237` (not yet fully inspected as a screen). **This is not the full frame inventory.**
- Figma MCP reached its Starter-plan rate limit during inspection. No complete high-fidelity per-frame screenshots/tokens/assets have been retrieved. Do not invent visual details.
- UI may be implemented against deterministic fake data; this **does not define backend API contracts**. Backend source and infrastructure are read-only during mobile work.

## Non-negotiable development rules

1. Feature-first Kotlin packages; Compose UI with state-hoisting; MVVM/UDF with immutable `UiState` and lifecycle-aware collection.
2. UI does not directly access Retrofit, Room, preferences, or mock fixtures. It only renders state and sends actions.
3. Put repository interfaces under `feature/<name>/domain/repository/` and fake implementations + fixtures under `feature/<name>/data/fake/`. Bind the selected implementation by DI (or a small explicit composition root) rather than `if (mock)` inside UI.
4. Do not add an empty domain/use-case class merely to satisfy an architectural diagram. Use cases are useful for meaningful orchestration.
5. Shared design system is limited to semantically reusable components; no generic `BaseViewModel`, `BaseRepository`, `Utils`, or `Common` dumping grounds.
6. Do not invent backend routes, DTO fields, status codes, auth rules, or WebSocket events. Record `BACKEND_CONTRACT_GAP` separately.
7. Reuse existing documentation as the source of truth; changes must be additive and explicitly justified.
8. Per-frame implementation must preserve original visual assets and text from Figma where verified. Figma screenshots are references, not runtime assets.
9. Report every modified file and demonstrate a successful build/test (or clearly state why unable).
10. No Git commit/PR/merge or backend writes without separate authorization.

## Phase 00 — Design audit & screen inventory

**Purpose:** Know exactly which frames/variants/assets exist before splitting code.

Tasks:
- Traverse all Figma pages and collect each top-level mobile frame's node ID, title, width/height, variants, visual screenshot, tokens, asset inventory, content, auto-layout constraints, component references and interactions.
- Group frames into actual user-facing flows, **not** one feature per Figma rectangle. Map to SRS and existing docs; mark extras or missing flows.
- Build `docs/frontend/mobile/figma-frame-index.md` and `docs/frontend/mobile/screens/<screen>.md` for each confirmed screen.
- Map flows and actions into `navigation-map.md`; record UI-state variants, input/keyboard, bottom bars, overlays, deep links and accessibility concerns.
- For uninspectable frames mark `DESIGN_UNVERIFIED`; do not assume their contents.

**Exit gate:** Each frame intended for implementation has screenshot, metadata, verified assets, target feature/screen, interactions and a screen specification; gaps are listed.

## Phase 01 — Android foundation (no service API integration)

Suggested scope at `frontend/app/` (recheck actual repo first):
- Gradle Wrapper, settings/build files, version catalog and Android app module; pin a compatible tested set of AGP/Kotlin/Compose and JDK after verifying upstream compatibility.
- Manifest, application ID/package, `TutorNetApplication`, single `MainActivity`, Compose theme, dynamic/light/dark policy based on Figma/product decision, strings/resources, baseline lint and test setup.
- Navigation shell + routes (typed routes where appropriate), preview support, dependency injection (Hilt if compatible), fake runtime configuration.
- `.gitignore`, `README.md`, build instructions, minimal debug startup screen.

**Exit gate:** `./gradlew :app:assembleDebug` succeeds; app launches on phone emulator; initial composable preview works; no accidental external endpoint dependency; architecture smoke checks present.

## Phase 02 — Fidelity-first design system

- Extract color typography spacing shape elevation icon tokens from Figma; distinguish verified design tokens from inferred defaults.
- Build `core/design/` reusable controls only after comparing Figma component instances (buttons, text fields, top app bar, bottom nav, avatar, post cards, message bubbles if confirmed).
- Add previews for states (default, focused, disabled, invalid, loading).
- Preserve original SVG/image/vector assets and dimensions; store local Android-compatible resources with attribution/license and provenance notes. Never hotlink temporary Figma URLs.
- Handle system insets and IME rather than painting fake status/gesture bars.

**Exit gate:** Shared controls have a token sheet, Figma-vs-Compose comparison and visual test baselines on the agreed reference device.

## Phase 03 — Authentication UI (fake session)

Verified initial frame: Login `475:31`. Other auth screens to be added only after inventory.

- `LoginRoute` observes state from `LoginViewModel`; `LoginScreen` is a stateless UI function and has previews.
- `AuthRepository` interface with `FakeAuthRepository` and `AuthFixtures`, deterministic demo user and success/error conditions, no fabricated production tokens.
- Keyboard actions, visible password toggle if evidenced, validation and loading/invalid credentials demo, lifecycle state restoration and navigation to Feed.
- Preserve Google and Facebook design controls if visible, but mark unsupported integrations as disabled/informational rather than pretending real OAuth works. Confirm actual product requirements separately.

**Exit gate:** Reference screenshot visually checked; form interactions, error/loading state, back stack and Compose tests pass.

## Phase 04 — Feed & social UI (fake interconnected data)

Verified Figma frames: Feed `475:32`, Post & Comments `475:33`, Create Post `475:34`.

- `SocialRepository` or separate `FeedRepository`/`PostRepository` contracts only if semantics require; fake store must give consistent post counts/comments across all three screens.
- Compose `LazyColumn` with stable keys for feed; post card, actions, comment list, composer, create-post and image placeholder/real verified assets.
- Fake actions: load/refresh/paginate, like/unlike, add comment, create post, deliberate error simulation and retry. These mutate an in-memory fake single source of truth, not hardcoded UI literals.
- UI loading/empty/offline/error/long-content states; scroll restoration, image crop and layout bounds.

**Exit gate:** Feed → Detail → Comment → Feed is coherent, new post appears in Feed, visual tests and behavior tests pass.

## Phase 05 — Remaining Figma-confirmed flows

Potential SRS feature domains (NOT evidence that screens exist in the Figma file): Profile, Tutor Search, Marketplace, Scheduling, Review, Social Graph, Notification, Messaging, Subscription.

Prioritize **only after** inventory confirms corresponding frames. For each: write `screen-spec.md`, select existing or new feature owner, add state/repository/fakes, implement visual route, test.

Suggested order when designs exist: Profile → Search/Marketplace → Schedule/Review → Notification → Social → Messaging/Subscription. Actual order can change based on Figma navigation and demo priority.

**Exit gate:** Every confirmed in-scope frame has working navigation and fake behavior; each unsupported backend capability is explicitly tracked.

## Phase 06 — Screenshot-driven QA, accessibility & stability

- Capture Android screenshots at the same reference viewport/density/font scale/theme as Figma; mask/don't penalize OS-controlled system status elements.
- Compare manually and optionally with image diff: alignment, geometry, text wraps, colors, fonts, icons, crop, list composition. Record deltas with before/after images. No universal numeric similarity score is a substitute for review.
- Test compact widths, smaller heights, text scale, font weights, TalkBack/semantics, 48dp interactive targets where applicable, keyboard/IME, edge-to-edge, offline and process recreation.
- Add screenshot regression using the approach compatible with the project AGP; select the currently supported screenshot-testing setup rather than blindly copying deprecated plugins.

**Exit gate:** No critical visible mismatches, essential interactions usable, no clipped UI or accessibility regressions, automated UI behavior tests pass.

## Phase 07 — Replace fakes with real API implementations when ready

- Take source contract from approved OpenAPI and service-owned docs, not from mock fixture fields.
- Add `data/remote/` + `Remote*Repository`/data source and DTO/mapper only where an API is confirmed.
- Switch DI binding in a dedicated integration PR; keep deterministic fake mode for screenshots/tests/offline demos.
- Identity integration and token storage must follow accepted Identity contract and Android security requirements. Do not store real tokens in plaintext logs or demo fixture files.
- Verify network errors, session expiry, refresh concurrency, status handling and authorization.

**Exit gate:** UI/route signature remains largely unchanged; real backend contract tests pass; fake test mode still works.

## Initial frame inventory

| Node | Verified title | Suggested owner | Evidence status |
|---|---|---|---|
| `475:31` | `01 • Đăng nhập` | `feature/auth` | Structural Figma metadata retrieved; screenshot/tokens pending |
| `475:32` | `02 • Trang chủ / Feed` | `feature/feed` | Structural metadata retrieved; screenshot/tokens pending |
| `475:33` | `03 • Bài viết & bình luận` | `feature/socialcontent` | Structural metadata retrieved; screenshot/tokens pending |
| `475:34` | `04 • Tạo bài viết` | `feature/socialcontent` | Structural metadata retrieved; screenshot/tokens pending |
| `506:1237` | `TutorNET Mobile - Notifications` (current selection) | `feature/notification` | Selected node only; screen classification not verified |

## Suggested architecture (packages within one app module to start)

```text
frontend/app/
├── AGENTS.md                       # existing rules; keep
├── README.md                       # populate after foundation
├── settings.gradle.kts
├── build.gradle.kts
├── gradle/libs.versions.toml
├── app/src/main/java/com/tutornet/app/
│   ├── MainActivity.kt
│   ├── TutorNetApplication.kt
│   ├── core/
│   │   ├── design/                # theme/tokens/shared composables
│   │   ├── navigation/            # app-level navigation
│   │   ├── network/               # only when APIs exist
│   │   ├── security/              # session when needed
│   │   └── error/
│   └── feature/
│       ├── auth/
│       │   ├── presentation/login/
│       │   ├── domain/repository/AuthRepository.kt
│       │   └── data/fake/{FakeAuthRepository,AuthFixtures}.kt
│       ├── feed/
│       │   ├── presentation/
│       │   ├── domain/repository/FeedRepository.kt
│       │   └── data/fake/
│       └── socialcontent/
│           ├── presentation/
│           ├── domain/repository/
│           └── data/fake/
└── docs/                            # optional mobile-specific colocated docs
```

Keep authoring docs under `docs/frontend/mobile/` if maintaining the repository's current documentation hierarchy. Do not create empty placeholder packages for unconfirmed screens.

## Recommended PR slicing

1. `docs(mobile): audit verified Figma screens and workflow` (Phase 00; docs only)
2. `feat(mobile): bootstrap Kotlin Compose app` (Phase 01)
3. `feat(mobile): implement Figma design system` (Phase 02)
4. `feat(mobile): login UI with fake auth` (Phase 03)
5. `feat(mobile): feed and post detail UI with fakes` (Phase 04a)
6. `feat(mobile): create post and comments UI` (Phase 04b)
7. One focused PR per remaining verified feature, followed by screenshot/accessibility fixes and later real-API integration PRs.

## Priorities and deliberately deferred decisions

- **Now:** UI fidelity, navigation behavior, fake repo organization, deterministic tests, README/spec discipline.
- **Later:** realtime backend integration, production notifications, payment, end-to-end cryptography, complex offline sync, K3s/GitOps.
- **Need evidence before decisions:** complete Figma frame list, design variable export, font availability/licensing, prototype interactions, final Google/Facebook product behavior, exact API contracts.
