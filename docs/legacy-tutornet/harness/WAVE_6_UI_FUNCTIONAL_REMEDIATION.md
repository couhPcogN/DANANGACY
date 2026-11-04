# TutorNET Mobile — Wave 6: UI, Navigation, Functionality & Session Remediation

> **Status:** OPEN / NOT VERIFIED  
> **Android project root:** `frontend/app/`  
> **Ownership:** Principal Android Tech Lead / Harness Orchestrator  
> **Date:** 2026-10-30  
> **Purpose:** Correct the gaps found by reviewing actual Pixel 10 Pro XL emulator screenshots against the current TutorNET Figma `538:*` references. This is an implementation directive, not evidence that fixes are complete.

## 0. Authority, prerequisites, and non-goals

- Read applicable `AGENTS.md`, `docs/AI_WORKFLOW.md`, `docs/figma/FRAME_INVENTORY.md`, `docs/visual/references/REFERENCE_INDEX.md`, `docs/navigation/ROUTES_AND_STATES.md`, each feature README/screen/task, `docs/harness/DECISIONS.md`, and monorepo `docs/frontend/**` architectural rules.
- Verify working repository root and `git status` before modifying files. Do not assume `docs/` lives in repository root: mobile docs are under **`frontend/app/docs/`**.
- Inspect **actual code** and rerun baseline build/tests; previously reported 16 passing unit tests do not prove UI/interaction correctness.
- Current Figma source for these mobile screens is `538:*`; do not silently validate against older `475:*` designs. Treat PNGs as reference-only, **never** render them as screen backgrounds.
- Keep implementation under `frontend/app/**`; do not modify backend, infrastructure, or invent production APIs; do not commit/push.
- Current user-provided emulator screenshots show many mismatches. They do **not** prove which click handlers exist, nor whether a filter works; verify behavior in a running app.

## 1. Priority zero: shared shell & Android edge-to-edge

### Observations
- Large light/blank strip **above** maroon headers on Home/Network/Find Requests/Messaging/Me; inconsistent top bars across screens.
- Excessive bottom empty/scrim area and bottom navigation that doesn't proportionally match Figma; typography/icons appear much smaller than expected.
- Main screens use a generic maroon title bar where Figma typically has white top bars, logo/search/bell or action icons, and different section layout.
- Notifications has a simple maroon header where the reference shows white header, back arrow, title, `Mark all as read`.

### Required fixes
1. Investigate `MainActivity`, `WindowCompat` / `enableEdgeToEdge`, app theme, status/navigation bar appearance, `MainShellScreen`, `Scaffold`, nested `Scaffold`s, `contentWindowInsets`, `WindowInsets`, `statusBarsPadding`, `navigationBarsPadding`, `safeDrawing`, `imePadding`, and duplicate top/bottom padding. **Fix the real source of extra whitespace; do not compensate using negative padding or hardcoded per-device offsets.**
2. Make app surfaces extend correctly beneath status/navigation regions while keeping content outside unsafe touch regions; status-bar icons must have adequate contrast. Don't draw fake iOS status/gesture bars.
3. Keep fixed bottom navigation visible on root 5-tab screens, and keep text/composers above system nav and IME. Do not make one giant nested scaffold with duplicated bar padding.
4. Use adaptive constraints, dp/sp typography from tokens, real icon assets; inspect 390dp-target Figma versus the actual Pixel 10 Pro XL dp-width. Confirm font scale/theme/density before measuring differences.
5. Review hit area (typically >=48dp for important controls), large-text behavior, smaller 360dp device and landscape/IME states as applicable.

### Acceptance
- No unexplained top blank area; no content hidden behind status bar/navigation bar, tab bar, keyboard, cutouts.
- Bottom bar remains anchored with stable height, labels readable, icons legible; reference vs actual screenshots compared at matched viewport/content state.
- Build/tests pass after shell changes.

## 2. Priority zero: navigation and back behavior

- **Root destinations**: Home, My Network, Find Requests, Messaging, Me are top-level tabs and do **not** need an app-bar back arrow in their root state; changing tabs must not exit the app.
- **Child destinations**: Notifications, Conversation, Post Detail, Create Post, Register, profile details, request details, etc. need a visible arrow / Cancel where Figma or common UX requires, plus Android **system back gesture/button** wired via navigation `popBackStack`. No screen may trap a user.
- Modal BottomSheet: back closes sheet first. Unsaved post: show discard confirmation before leaving. IME back closes keyboard appropriately.
- Login -> Main: clear login from back stack as appropriate; logout -> Login clears authenticated stack. Back in nested flows restores expected parent and tab state; switching tabs preserves per-tab state where possible.
- Do not override the system back at the app root unless needed; preserve predictive back behavior supported by current Navigation dependencies.
- Add Navigation Compose or instrumentation tests for push/pop, bottom tabs, notifications, conversation, logout and process return.

## 3. Priority zero: core functional journeys

### 3.1 Feed: Message author opens the **correct** conversation
- Current observation: `Message` on a feed/matched post does not lead to the actual author’s thread.
- Make every post/request have stable `authorId` / `ownerId`, `postId` / `requestId`; never route by display name only.
- On `Message` tap, resolve/create a conversation for that exact author/current user; navigate to `conversation/{threadId}`; display correct avatar/name, optionally a request context banner. If a thread does not exist, create it in the **shared fake repository**.
- InboxRoute + ConversationRoute must use the **same repository instance** via application/session-scoped dependency container or existing DI. Don't independently construct `FakeMessagingRepository()` in each route. Do not add Hilt merely for a singleton fix.
- Sending messages updates thread messages, latest-message preview, timestamps and unread counters consistently; returning to Inbox shows the new thread.
- If recipient/session missing, show contextual error, never route to some unrelated fixture by default.

### 3.2 Feed: comments & post detail
- `Comment` and comment count open Post Detail for the **specific postId**; show associated comment list, author, time, empty/loading/error states.
- User can type and submit a valid comment; comment appears immediately, count increments, list/feed state stays consistent. Empty comment disabled; errors visible. Like/save state synchronized in detail and feed.
- If user taps a feature not available yet, show accessible UI feedback (`Chức năng đang phát triển`) rather than a dead control; this is a temporary exception, **not an acceptable replacement for required core Comment functionality**.

### 3.3 Feed: composer / Create Post
- Tapping `What's on your mind?` opens a **real editable Create Post screen or sheet** rather than a non-editable decorative card.
- User can enter content, submit it, and see newly created post at the top of Feed via shared repository state; must handle empty content, loading, cancel/draft, back/discard confirmation, keyboard/IME, rotation where feasible.
- Image/document attachment buttons must be implemented safely if scoped; if deferred, clearly communicate WIP on tap—do not silently ignore or claim successful upload.
- Refer to prior provisional Post Detail/Create Post specs (`475:33`, `475:34`) **only as provisional** until current `538:*` replacement is approved. Do not invent current Figma evidence.

### 3.4 Exhaustive click/action audit
- Inventory **all** interactive controls across Login/Register, Feed, Network, Find Requests, Inbox/Conversation, Notifications, Me/Profile and nested screens.
- For each: record `screen`, `control`, `expected action`, `handler implemented?`, `observable state change?`, `navigation destination`, `test`, and `status`.
- Required MVP actions must **work**. Optional/unavailable actions must explicitly show a nonmisleading WIP notice or be visibly disabled with reason; no silent click, fake success, or misleading navigation.
- Specific audit candidates: header search/bell, photo/document, feed post overflow, like/comment/save/share/follow/message, accept/ignore, filters/reset/show results, bookmark/apply, search inbox, new message, send message, Notifications All/Unread/Mark all read/row actions, Profile view/edit/applications/saved/settings/support/logout, Register next/validation, Google login affordance. Do not pretend Google OAuth, phone OTP, push or real websocket integrations exist.

## 4. Priority zero: Remember me & session restoration

- Current login appears backed by `FakeAuthRepository`; **do not invent or persist a fake JWT** and do not store passwords. The user requests a persistent sign-in across app restarts when `Remember me` is selected.
- Determine existing LoginUiState, repository session semantics and app startup navigation. For debug/mock implementation, persist a **non-sensitive mock session identifier + rememberMe flag** using DataStore or an existing appropriate local store. Restore session before deciding start destination; show a neutral splash/loading state while reading it so Login does not flash. When rememberMe is false, don't persist a login across a cold start.
- Logout clears session and all persisted remember/session state and related user-scoped fake caches as appropriate. Support app process death and re-open, not just background/foreground.
- When connecting the actual Identity service: persist **real tokens only** according to the validated API contract and Android security requirements (Keystore-backed encryption for sensitive refresh/session secrets as applicable; expiry/refresh/revocation, no plaintext access/refresh tokens or passwords, no logging), and replace debug fake session gating. Avoid shipping a release build that authenticates users solely from a persisted fake flag.
- Tests: remember checked -> close/relaunch authenticated; unchecked -> cold start login; logout -> login after relaunch; corrupt/expired state -> unauthenticated; no secret leakage.

## 5. Screen-by-screen visual discrepancies (from screenshots; verify fresh exports)

| Screen | Figma reference | Observed Emulator difference / check |
|---|---|---|
| Home Feed (`538:244`) | `social/home-feed--default.png` | Actual red search/header instead of reference white header/search/avatar/bell treatment; large top blank; much smaller typography, cards and margins; composer layout changed, missing like/comment action row on first card; post layout, count/metadata fixtures diverge. Preserve correct interactions while adjusting layout. |
| Notifications (`538:2`) | `notifications/list--all.png` | Red top bar instead of white header with back/title/**Mark all as read**; header actions absent; reference uses unread pale-maroon rows/dots, specific icon badges, contextual buttons; actual row typography/action structure differs and badge/action behavior needs test. |
| My Network (`538:1275`) | `network/my-network--default.png` | Figma white header with brand logo, search, bell; actual red title strip; invitation summary/detail tiles smaller and structurally different, suggestions spacing and card styling differ; test real Accept/Ignore/Follow state propagation. |
| Find Requests (`538:801`) | `marketplace/find-requests--filters-open.png` | **Not comparable as-is**: actual screenshot shows default list, reference shows **filters bottom sheet open**. Must tap filter, capture that state, compare sheet height, dim scrim, subject chips, grade/mode/location/budget, sticky Reset/Show results and behavior. Default list needs a matching reference or DESIGN_UNVERIFIED designation. Check whether request cards have clear action/navigation, not only bookmark. |
| Messaging Inbox (`538:1541`) | `messaging/inbox--focused.png` | Reference white title/header, search, Focused/Other, ~5 fixture threads, online/unread badges; actual red generic header, only 2 threads, text too small and density differs. Test search, tab filtering and shared conversation state. |
| Chat Thread (`538:541`) | `messaging/conversation--thread-top.png` (or currently available equivalent; verify inventory) | No new screenshot supplied in latest emulator set. Capture separately. Reference has back, participant info/presence, request context, bubbles, trial-proposal card and composer above keyboard. Treat unverified until captured, check empty/error/send/back. |
| Me / Profile (`538:1706`) | `profile/me--default.png` | Reference white header with brand icon, settings + bell; maroon decorative banner, overlapping QH avatar + Verified Tutor badge, View/Edit Profile actions; stats **8 Connections / 3 Applications / 4.9 Rating**, account management section. Actual uses red generic title strip, flat profile card, four different stats (142/4.9/67/8), no branded banner/badge/actions. Functional account menu should be scrollable. |
| Register Learner/Tutor (`538:692`, `538:1165`) | `auth/register--step-01-learner-selected.png`, `auth/register--step-01-tutor-selected.png` | Not included in latest emulator screenshots: capture both states, verify 1/5 progress, role selection, tutor advisory, validation, keyboard/scroll and navigation back. Steps 2–5 remain SPEC_BLOCKED unless separately approved. |
| Login (`538:454`) | `auth/login--default.png` | Previously reported visual PASS; rerun screenshot smoke test and check remember-me session restoration, icons and app bars. Don't mark DONE solely on old report. |

**Screenshot comparison protocol**: Capture full emulator screen and **crop away only the device-frame/mockup decorations** around exported Figma frame. Record source frame ID, exported region, emulator physical dimensions, dp width, density, font scale, Android version, system nav mode, theme, locale, app state/fixture ID. Align same **content state** and viewport; compare structure and typography manually first, then optional overlay/diff. Exclude incomparable OS status icons/gesture indicators from scoring but ensure safe insets are correct. Don't claim pixel-perfect if references or actual screenshots don't match.

## 6. Multi-agent ownership (avoid races)

- **Orchestrator / Integrator**: owns `core/navigation/**`, app shell, shared dependency container and shared Gradle; gates waves and merges changes.
- **Agent A — Edge-to-edge / Navigation**: investigate system bars, layout shell, back behavior; coordinate any `core/**` edits exclusively with Integrator.
- **Agent B — Social**: `feature/social/**`: composer, Post Detail/comments, like/save/follow, message intent; may expose typed navigation events but cannot edit AppNavigation.
- **Agent C — Messaging**: `feature/messaging/**`: shared repo state, thread creation/send, Inbox previews; coordinate shared DI with Integrator.
- **Agent D — Session / Auth**: `feature/auth/**`: rememberMe/session restoration, persistence, logout signal; coordinate initial route with Integrator.
- **Agent E — Feature Actions**: network/marketplace/notifications/profile; assign **separate nonoverlapping subfolders** to subagents if parallel.
- **Agent F — Visual QA**: captures screenshots, inventories visual mismatches, creates reference/actual/overlay evidence, does not concurrently edit feature code.
- **Agent G — Test / Architecture Review**: behavioral tests, accessibility review, security and boundary checks.

Only Integrator changes `AppNavigation.kt`, shared shell, `core/design/**`, app-scope DI and Gradle. Subagents in the same worktree must not concurrently edit common files. If concurrent branches/worktrees exist, integrate deterministically and test merged result before next wave.

## 7. Execution waves / gates

### Gate 0 — Establish a reliable baseline
- Verify file paths, `git status`, all reference PNGs, baseline build, test, ADB connection. Create action inventory and current screen screenshot matrix. **Do not mark old feature DONE by counting routes.**

### Gate 1 — Critical UX repairs
- Fix edge-to-edge/top+bottom spacing and back navigation; fix message-to-author + shared Messaging repository; implement Post Comment/CreatePost end-to-end; implement safe remembered session. Work in conflict-free subteams, then integrate. Run tests after merge.

### Gate 2 — UI state and all buttons
- Functional audit for all seven features; implement or give truthful WIP feedback on every relevant action; no dead controls. Ensure consistent mock fixture IDs across features. Add unit/UI tests.

### Gate 3 — Visual refinement per screen
- Prioritize biggest structural gaps: Home shell, Profile, Notifications, My Network, Messaging, Marketplace filter-open, Register, Chat, Login regression. Use screenshot/visual diff and iteratively fix. Preserve architecture and business logic.

### Gate 4 — Final integrated verification
- Run `:app:assembleDebug`, `:app:testDebugUnitTest`, appropriate lint and instrumentation/UI tests; `:app:installDebug`, launch emulator, deterministic scripted journeys. Capture before/after screenshots and test logs for each available frame.
- At least 3 flow tests: Login remember/relaunch/logout; Feed post -> Comment -> Message owner -> Inbox; Find Requests filters -> results -> action -> back. Test notifications and My Network actions. Check Android back gestures and keyboard.
- If an environment lacks emulator access, mark `VISUAL_BLOCKED` **and continue code/test work**; do not pretend screenshots exist.

## 8. Concrete Definition of Done

`DONE` requires (a) implemented code, (b) observable working interaction and correct cross-screen state, (c) all applicable unit/instrumentation tests pass, (d) runtime screenshot + actual visual comparison when a reference exists, (e) no P0/P1 visual/UX defects, and (f) integrator approval. `WIP_NOTICE` alone never qualifies a required core feature as DONE.

Generate/update:

- `docs/harness/HARNESS_STATUS.md` — per-feature status and evidence.
- `docs/harness/OPEN_GAPS.md` — P0/P1/P2 gap log with owner/action/verification.
- `docs/harness/DECISIONS.md` — record only new genuine architecture decisions.
- `docs/harness/INTEGRATION_REPORT.md` — changelog, precise build/test commands and results.
- `docs/harness/ACTION_COVERAGE.md` — **all** controls inventory; each action's working/WIP/disabled state and test.
- `docs/visual/reports/` — actual screenshots, overlays/diffs; avoid committing noisy binaries unless project conventions explicitly allow.

Report in Vietnamese: current status; agent ownership; P0/P1 issues fixed; changed file paths; test case pass/fail; visual evidence and residual mismatch; gaps and next wave. No fake PASS labels, no self-approval of golden baselines, no commits or pushes.

## Official Android guidance to consult before insets/back decisions

- [Compose window insets](https://developer.android.com/develop/ui/compose/system/insets)
- [Window inset consumption](https://developer.android.com/develop/ui/compose/system/insets-ui)
- [Predictive back setup](https://developer.android.com/develop/ui/compose/system/predictive-back-setup)
