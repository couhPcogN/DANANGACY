# TutorNET Mobile — Multi-Agent Harness Execution Directive

**Role:** Senior Android Tech Lead + Staff Kotlin/Jetpack Compose Engineer + UI/UX Quality Owner  
**Repository:** `tutor-net`  
**Android project root:** `frontend/app/` (contains `settings.gradle.kts`)  
**Application module:** `frontend/app/app/`  
**Canonical docs root:** `frontend/app/docs/`  
**Figma file:** `1CAT8HGWvQx5GEVWmoiNtv`  
**Current mobile Figma family:** `538:*` (Page 1); old `475:*` is not canonical for changed screens.  
**Scope:** native Android Kotlin, Jetpack Compose, Material 3, MVVM + UDF, feature-first, mock-first.  
**Mode:** phased, parallel work where safe; evidence-driven quality gates; no automatic git commits/pushes.

> This directive instructs an AI harness to **audit the real checkout, orchestrate bounded sub-agent assignments, implement and integrate progressively, and verify each completed slice**. Do not treat the previous agent's table as verified facts. Code present, a route registered, Gradle PASS, and visual QA PASS are four different claims.

## 0. Non-negotiable operating rules

1. Read all applicable `AGENTS.md` files and the canonical documentation before changing code. Inspect *real* source, Git status, Gradle, dependencies, emulator availability, test infrastructure, and PNG files. Never claim to have inspected what is inaccessible.
2. Operate only in `frontend/app/**` plus explicitly permitted `docs/frontend/**`; **never modify `services/**`, infrastructure, backend APIs, database migrations, or contracts** on your own. No invented production DTOs/endpoints/Google OAuth/phone OTP flows. Describe backend unknowns as `BACKEND_CONTRACT_GAP` or `INTEGRATION_PENDING`.
3. Keep current `AuthRepository`/`FakeAuthRepository`, session architecture, Design System and successfully tested code where valid. Do not rewrite working modules for style preference.
4. Design source for the ten current mobile screens is Figma `538:*` and corresponding actual PNGs. If Figma is rate-limited, use existing user-exported PNGs with `SCREENSHOT_ESTIMATED` provenance; never claim pixel verification from metadata alone. Do not render the screenshot as the Compose screen. Do not simulate iOS status/navigation bars.
5. **Never mark a feature DONE because it has a placeholder screen, navigation route, stub, static preview, or build PASS.** Mark `SHELL_ONLY`, `IMPLEMENTED_NOT_TESTED`, `VISUAL_BLOCKED`, `VERIFIED`, etc. based on evidence.
6. Don't reset, clean, force-checkout, stash, overwrite, or discard uncommitted user work; no automatic `git commit`, `push`, PR, release, dependency upgrade, or broad refactor. Keep a change ledger and work in small bounded diffs.
7. All visible interactions must have real client behavior through mock repositories (or a clearly labeled unavailable response). No misleading buttons that silently do nothing; do not claim Google OAuth or phone authentication works.
8. Never fabricate build results, test counts, screenshots, diff artifacts, file paths, Figma token values, or completion status. If a tool/emulator is unavailable, report precisely what is blocked.
9. Orchestrator owns prioritization, conflict resolution, shared-file edits, integration, verification and final reporting. Sub-agents may propose, but never independently change architecture contracts or silently expand scope.
10. Work continuously through successive **gated slices/waves** within the session where the environment permits; after each wave, integrate and run quality checks. Stop and report when a gate fails or a material contract/design decision is unresolved. Do not claim to work asynchronously after the turn.

## 1. Required reading order and path audit

1. `frontend/app/AGENTS.md`, higher/lower applicable `AGENTS.md`, `frontend/app/README.md`.
2. `frontend/app/docs/README.md`, `docs/AI_WORKFLOW.md`, `docs/00_MOBILE_PHASE_PLAN.md`.
3. `docs/figma/FRAME_INVENTORY.md`, `docs/navigation/ROUTES_AND_STATES.md`, `docs/visual/README.md`, `docs/visual/references/REFERENCE_INDEX.md`.
4. `docs/design-system/README.md`, `docs/features/<feature>/README.md`, each relevant `screens/*.md` and `tasks/*.md`.
5. `../../docs/frontend/app-architecture.md`, `coding-conventions.md`, `frontend-testing.md`, `frontend-backend-boundary.md` if present, resolving paths from `frontend/app/` correctly.
6. `settings.gradle.kts`, version catalog, `build.gradle.kts`, `app/build.gradle.kts`, current `core/**`, `feature/**`, navigation, tests. Read targeted files, not huge unrelated services.

**Path normalization:** When project root is `frontend/app/`, reference paths are `docs/visual/references/...`, NOT `app/docs/visual/references/...` unless an actual checkout confirms the latter. Check existence first. Resolve the naming discrepancy for Chat Conversation (`conversation--thread-top.png` in inventory versus `conversation--trial-proposal.png` in an earlier report) by inspecting local files and visual content; don't fabricate a duplicate.

## 2. Ground-truth starting matrix — verify, don't assume

| Feature / screen | Figma ID | Canonical PNG (relative to project root) | Last user-reported code state | Starting quality status |
|---|---|---|---|---|
| Login | `538:454` | `docs/visual/references/auth/login--default.png` | `LoginScreen`, ViewModel, fake auth | Prior agent says visual PASS; must examine latest actual screenshot/evidence |
| Home Feed | `538:244` | `docs/visual/references/social/home-feed--default.png` | Tab 0 / `FoundationScreen` | Suspect `SHELL_ONLY` until real content/interactions proven |
| Register Learner | `538:692` | `docs/visual/references/auth/register--step-01-learner-selected.png` | Placeholder route | `SHELL_ONLY` |
| Register Tutor | `538:1165` | `docs/visual/references/auth/register--step-01-tutor-selected.png` | Placeholder route | `SHELL_ONLY` |
| Notifications | `538:2` | `docs/visual/references/notifications/list--all.png` | Bell action + route | Needs content/behavior/visual QA verification |
| Find Requests Filters | `538:801` | `docs/visual/references/marketplace/find-requests--filters-open.png` | Tab 2 | Needs functional bottom sheet and screenshot QA |
| Messaging Inbox | `538:1541` | `docs/visual/references/messaging/inbox--focused.png` | Tab 3 | Needs real list/search/tabs/unread mock behavior |
| Chat Conversation | `538:541` | `docs/visual/references/messaging/conversation--thread-top.png` | Route structure | Verify filename conflict, message stream/composer and actual UI |
| My Network | `538:1275` | `docs/visual/references/network/my-network--default.png` | Tab 1 | Needs invitations/accept/ignore/follow behaviors |
| Me / Profile | `538:1706` | `docs/visual/references/profile/me--default.png` | Tab 4 + logout | Needs profile detail, actions, scroll, visual QA and logout flow |

The `538:*` family contains two Register **step-one variants**. Do not invent steps 2–5: their forms, server semantics and visual states are not established in the supplied references. The old `475:33` Post Detail and `475:34` Create Post can be preserved as **provisional legacy specs**, but must not be claimed as verified `538:*` implementations.

## 3. Harness agent roster and hard write ownership

### 3.1 Controller agents (start read-only, may run in parallel)

- **Lead / Orchestrator** — sole owner of plan, priorities, architecture decisions, final integration, status ledger and permission to touch shared files. Spawn/assign tasks. Keep a shared task board and file ownership registry; reject collisions.
- **Repo Auditor** — read-only first pass: Git changes, actual Kotlin/Gradle modules, build configuration, navigation, feature completeness, tests; returns file- and line-grounded findings and baseline commands/results.
- **Figma & UX Auditor** — read-only first pass: verify which reference PNGs exist; enumerate frame mapping and design/source conflicts; build per-screen acceptance checklist and screenshot comparison rubric. Never fill missing image by invention.
- **Architecture & Security Reviewer** — read-only independent review: MVVM/UDF dependency direction, fake auth gating, persistence boundaries, session/logout, password handling, accessibility and navigation. Reports P0/P1/P2 findings.
- **QA & Visual Agent** — owns tests and screenshot/diff **artifacts** (`docs/visual/reports/**`, appropriate test files as assigned), not production source unless Lead explicitly delegates a fix. Runs emulator and interaction tests after integration.

### 3.2 Implementation agents (bounded per-feature ownership)

- **Core/Navigation Integrator** — sole authorized editor of `core/navigation/**`, `MainActivity.kt`, app entry point, shared Gradle files, app-wide dependency wiring and shared `core/design/**`. Establish interfaces/routes first. No other implementation agent edits these shared files directly.
- **Auth Agent** — owns `feature/auth/**`: preserve existing Login; implement Register step-one learner/tutor toggles, validation, UI, tests; interface changes coordinated with Core owner; no invented real auth contract or steps 2–5.
- **Feed/Social Agent** — owns `feature/social/**`: actual Feed list, composer affordances, card rendering, interactions, fake state, tests; respect `538:244` for Feed. Post Detail/Create Post provisional until design authority is established.
- **Marketplace Agent** — owns `feature/marketplace/**`: Find Requests list, filter modal/bottom sheet, Reset/Show results, mock filters, tests; Node `538:801` includes sheet-open state.
- **Network Agent** — owns `feature/network/**`: invitations, Accept/Ignore, counts, suggestions, Follow, tests.
- **Messaging Agent** — owns `feature/messaging/**`: inbox Focused/Other and conversation detail/composer, shared fake store, unread behavior, keyboard; owns its feature end-to-end to avoid internal collisions.
- **Notifications Agent** — owns `feature/notifications/**`: All/Unread, mark all as read, item actions, seeded events/counts, tests.
- **Profile Agent** — owns `feature/profile/**`: Me screen, profile card, stats, account actions, scrolling, logout event routed via shared session contract, tests.

**No two agents may write the same source file concurrently.** For any shared `core/**`, `AppNavigation.kt`, Gradle or Design System change, feature agent submits a small interface/patch proposal to Core Integrator; core owner integrates after reviewing impacts. If the harness uses isolated worktrees/branches, merge controlled diffs only with explicit permitted workflow; no unapproved commits or destructive merges.

## 4. First action: evidence audit + project baseline (Wave 0)

Run read-only agents simultaneously, then Lead consolidates their reports. Initial audit must produce:

- Current branch, `git status --short`, modified/untracked files (redact sensitive data; never expose passwords).
- Actual project root, module, package names, Gradle/Kotlin/Compose/AGP versions **from files**; avoid guessing versions and upgrading blindly.
- Compile/test baseline on available OS: `./gradlew :app:assembleDebug :app:testDebugUnitTest` or `gradlew.bat` on Windows. Run `:app:lintDebug` if supported; check instrumentation capability with `adb devices` and emulator/device profiles.
- Screenshot inventory: existence/dimensions, which image is *design-only* and which is *emulator actual*, crop/outer mockup/insets analysis; missing images flagged, never substituted.
- Implemented components versus stubs, route destinations, fake repository and state holders, tests that meaningfully assert behavior (avoid only checking constant values).
- A **truthful matrix** with `SCREEN_IMPLEMENTED`, `ROUTE_ONLY`, `STUB`, `NOT_STARTED`, `VISUAL_UNVERIFIED`, `VERIFIED`, `BLOCKED`; provide exact evidence and links/paths.
- List of P0 blockers (compile failure, missing assets, invalid session wiring, user changes at risk, mismatched design version) and P1 problems (navigation gaps, visual drift, empty-state coverage, inaccessible controls).

**Stop implementation** until the baseline is understood. If build fails, assign one narrowly scoped fix and rerun. If the old project has uncommitted work, preserve it; do not reset.

## 5. Architecture contracts before parallel writes (Wave 1)

Lead + Core Integrator document minimal contracts in `docs/harness/DECISIONS.md` as necessary:

- Five main destinations: `Home`, `My Network`, `Find Requests`, `Messaging`, `Me`; Notifications via bell, Chat from Messaging, Register from Login. Preserve normal back stack; don't leave Login accessible after successful auth without explicit logout behavior.
- Navigation event contracts owned by shared integrator; feature UIs emit callbacks/intents, not arbitrary route string literals or direct NavController dependency everywhere.
- Session source of truth via existing `AuthRepository` interface; Login route uses its state; logout clears it and returns to Login with auth back stack removed.
- Fake data contract: shared fixture identifiers, profile names, request IDs, conversation IDs, unread notifications, invitation counts, and basic cross-feature scenarios. Keep fake repositories in `data/fake`, not Composables; never treat mock fixtures as production API DTOs.
- Design tokens from `core/design` including burgundy `#6C1111` currently `SCREENSHOT_ESTIMATED`, official `tutornet_logo` asset, typography/spacing shapes. Do not add new global tokens without evidence and review.
- Stable route and UI-state shapes (loading/content/empty/error/disabled) and mock event expectations, with no unnecessary generic Base classes.

After contracts, Core Integrator verifies the navigation **shell** and design components once. If already sound, do not rewrite; run a smoke test instead.

## 6. Implementation schedule — maximize parallelism, minimize collisions

### Wave 2 — parallel isolated vertical slices (3–4 at a time)

Assign 3–4 independent features with existing screenshots and no shared-file overlap. Default recommendation:

1. **Auth Register step one** — learner/tutor selected variants; tests; visible navigation from Login; do not invent unfinished later steps.
2. **Home Feed** — replace `FoundationScreen` placeholder with genuine Feed list; cards, likes/comments/action states, test data. Match `538:244` rather than legacy `475:32`.
3. **Find Requests** — list + filter sheet with subjects, grade, mode, location, budget, Reset and Show results; persist filter state while sheet opens/closes.
4. **My Network** — invitations, Accept/Ignore, suggestions, Follow, consistent counts.

Feature agents do not edit `AppNavigation.kt` or Design System; instead provide clear public screen/route interfaces and requested integration changes to Core Integrator.

After each feature is integrated, run compile/tests, basic route smoke test, actual emulator screenshot (if available), visual review, and regression check. Reject placeholders and obvious visual differences. Do not pile up four noncompiling features before integration.

### Wave 3 — more stateful flows

1. **Messaging** — real Inbox Focused/Other, search/unread badges, Chat screen with message list, chat composer, send action, keyboard/insets, stable mocked conversation state.
2. **Notifications** — read/unread filtering, mark all read, action routing, mock event updates; integrate badge across shared top bar.
3. **Me/Profile** — profile summary, verified/status badges, stats, account management, off-screen scroll, navigation to existing screens, logout backed by auth session (no account persistence invented).

Cross-feature contract tests: accepting invitation changes Network count; inbox unread updates messaging badge; notification mark-read updates bell count; logout returns to Login and clears session. If a cross-feature effect lacks a confirmed product contract, record it as design/behavior assumption and keep implementation minimal.

### Wave 4 — final verification, gap closure

- Audit all **10 current reference screens/states**; required UI behavior, deterministic mock fixtures, visual QA, accessibility/keyboard, error/empty states, performance sanity checks.
- Evaluate provisional `Post Detail`/`Create Post` specs separately: implement only if in approved MVP scope and design reference is available, otherwise record as `DESIGN_PENDING` (do not call product complete).
- Register steps 2–5 are `DESIGN_PENDING` until approved specs/screens exist; never claim complete 5-step registration.
- Add no backend integration without confirmed API contracts and explicit user authorization.

## 7. Mandatory Definition of Done (per screen/feature)

A feature may be `VERIFIED` only if ALL applicable gates pass:

- **Design:** canonical node and real PNG exist; no conflict with `475:*`; visual mismatches reported. Verify assets/icons and copy; do not replace logos with emoji or render Figma PNG as screen.
- **Behavior:** every visible enabled control works; form validation; navigation/back; role-dependent UI; loading/empty/error states; mock success/failure; consistent state after returning to screen.
- **Architecture:** feature-first, MVVM/UDF, immutable state, StateFlow, repository/fake data separation, coroutine/lifecycle safety, no direct data ops inside Composables, no hidden fake HTTP semantics.
- **Testing:** build PASS, meaningful unit tests PASS, UI/instrumented/smoke tests for critical flows where tooling allows. Report exact commands/exits; do not equate compilation with UX correctness.
- **Visual:** screenshot of **running Android UI** at a documented emulator device/resolution/density/font scale/theme/locale, reference and actual normalized to same content viewport, overlay/diff if available. Compare structure, position, fonts, copy, colors, spacing, clipping, bottom bar, status/navigation insets. **Mask or assess native system bars separately**, do not paint fake iOS bars. Report major mismatches and fix before marking verified. A reference with noise/outer black mockup must be cropped or compared to the correct internal canvas, with cropping recorded.
- **Accessibility:** readable labels/semantics, touch target sizing, contrast, TalkBack discoverability, focus/IME behavior; check long text and smaller displays.
- **Review:** Architecture reviewer accepts dependency/safety, QA checks testing evidence, Lead integrates with no unrelated regression. User review required for major UX/design discrepancies, not for routine deterministic fixes.

Without emulator/screenshot: mark `VISUAL_BLOCKED` or `VISUAL_UNVERIFIED`, NEVER `VISUAL_PASS`. Test pass does not automatically equal `DONE`.

## 8. Per-sub-agent dispatch contract (Lead must fill this for EACH assignment)

```text
ASSIGNMENT ID: <e.g., W2-FEED-01>
ROLE: <one of the agents above>
FEATURE: <one, exact path>
OWNED WRITE PATHS: <exclusive files or subtree>
READ-ONLY DEPENDENCIES: <shared core, docs>
DESIGN: <Figma node ID + actual PNG path>
SCREEN SPEC + TASK: <exact existing doc paths>
STARTING EVIDENCE: <actual code status / prior tests / known mismatches>
GOAL: <one coherent vertical slice>
ACCEPTANCE: <specific UI behavior, mock transitions, tests, screenshot>
FORBIDDEN: AppNavigation, common Gradle, core/design, backend, auto commit
EXPECTED OUTPUT: proposed shared-contract changes, changed file list,
  code/test results, screenshots/diff paths, unresolved issues
INTEGRATION HANDOFF: only Lead/Core Integrator may touch shared routes
```

Ask sub-agents to run compile/test within their environment when possible, but **only the integration workspace's final build and tests** qualify as integrated PASS. Do not let parallel agents all claim a shared green build.

## 9. Required shared report artifacts (within `frontend/app/docs/harness/`)

- `HARNESS_STATUS.md`: table per screen: ID, screenshot presence, code state, behavior tests, visual evidence, owner, last verification, blocker, next action.
- `DECISIONS.md`: only notable architecture/design decisions and conflicts, with evidence/provenance and owner.
- `INTEGRATION_REPORT.md`: each merged slice, files changed, exact commands/results, regressions and screenshots.
- `OPEN_GAPS.md`: `BACKEND_CONTRACT_GAP`, `DESIGN_PENDING`, Figma accessibility/rate limit, assets missing; include affected screens and user-visible behavior.

Do not create verbose generated artifacts unless they materially help coordination. Keep the task board updated as work actually occurs.

## 10. Final response / escalation format

```text
A. Real baseline: branch/dirty state, Gradle versions, build/test outputs, emulator status.
B. Audit truth table: 10 screens, CODE / BEHAVIOR / TEST / VISUAL (NOT just a single PASS).
C. Agent assignments: name, owned paths, dependencies, parallel vs serial.
D. Wave results: implemented slices, files changed, screenshot evidence and tests.
E. Integration: navigation, cross-feature mock consistency and regression result.
F. P0/P1 blockers: precise reason, missing files/contract, safe next step.
G. Next bounded wave: ready tasks, required prerequisites.
```

**Success condition:** deliver the greatest number of genuinely implemented, tested, visually reviewed native Android features safely possible with the available repo, emulator and design evidence. No fabricated completion and no uncontrolled simultaneous edits. The harness is the execution environment; the Lead is the accountable integrator.
