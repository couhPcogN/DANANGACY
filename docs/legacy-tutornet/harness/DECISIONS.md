# TutorNET Mobile — Architecture Decisions Log

**Maintained by:** Tech Lead / Orchestrator

---

## D-001: Navigation Implementation
**Decision:** Retain existing `mutableStateOf("route")` pattern instead of introducing Jetpack Navigation Compose.  
**Rationale:** App is pre-production; introducing Navigation Compose now requires significant refactoring. Current pattern works for fake-data phase.  
**Impact:** Feature agents navigate via string route callbacks passed from AppNavigation.  
**Status:** ACCEPTED

## D-002: DI Strategy
**Decision:** Continue with manual `remember { FakeRepository() }` injection at AppNavigation level.  
**Rationale:** Hilt requires KSP plugin and Application class modification — risky mid-project.  
**Impact:** Each feature's ViewModel receives its repository through constructor injection from AppNavigation.  
**Status:** ACCEPTED

## D-003: Feature Package Structure
**Decision:** Each new feature follows `feature/<name>/{presentation,domain/model,domain/repository,data/fake}` mirroring the auth pattern.  
**Status:** ACCEPTED

## D-004: AppNavigation Ownership
**Decision:** Only the Tech Lead/Integrator agent modifies `AppNavigation.kt`. Feature agents output Route composables only.  
**Rationale:** Prevents merge conflicts and route collision during parallel development.  
**Status:** ACCEPTED

## D-005: Design Token Provenance
**Decision:** All color/typography tokens remain `SCREENSHOT_ESTIMATED` provenance until Figma variable export is available.  
**Rationale:** Figma MCP Starter plan rate-limits deep inspection.  
**Status:** ACCEPTED

## D-006: Visual QA Status
**Decision:** Mark all screens `VISUAL_BLOCKED` if no Android Emulator screenshot is captured.  
**Rationale:** Compliance with `docs/AI_WORKFLOW.md` rule #6 and `frontend/app/AGENTS.md` §4.7–4.8.  
**Status:** ACCEPTED

## D-007: Register Steps 2–5
**Decision:** Do NOT implement Register Steps 2–5. Only Step 1 is design-verified.  
**Rationale:** `docs/features/auth/README.md` explicitly states "steps 2–5 are not verified and must not be invented."  
**Status:** ACCEPTED

## D-008: Post Detail / Create Post
**Decision:** Keep `475:33` / `475:34` as PROVISIONAL. No implementation unless `538:*` equivalents confirmed.  
**Status:** ACCEPTED

## D-009: Chat Thread Route
**Decision:** Chat Thread (`538:541`) is a sub-route of Messaging via "conversation" string route in AppNavigation.  
**Status:** ACCEPTED

## D-010: Shared Notification Badge
**Decision:** Notification unread count driven from shared fake NotificationRepository once Notifications feature lands; placeholder hardcoded as `3` until then.  
**Status:** PENDING_REPLACEMENT

## D-011: lifecycle-runtime-compose Dependency
**Decision:** Add `androidx.lifecycle:lifecycle-runtime-compose` to `libs.versions.toml` and `build.gradle.kts` to enable `collectAsStateWithLifecycle`.  
**Rationale:** Required for lifecycle-aware StateFlow collection in Route composables.  
**Status:** ACCEPTED
