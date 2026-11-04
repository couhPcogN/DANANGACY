# TutorNET Mobile — Integration Report

**Maintained by:** Tech Lead / Orchestrator

---

## Integration Wave Log

### Wave 0 — Audit (COMPLETE)
- Repository audit confirmed 31 Kotlin source files
- Feature packages: only `feature/auth` with full MVVM+UDF
- Navigation: string-based `mutableStateOf("route")` in AppNavigation.kt
- 5-tab bottom nav wired; tabs 1–4 are placeholders
- Design system: 7 components + 5 theme files
- Tests: LoginViewModelTest, FakeAuthRepositoryTest, AppNavigationTest, DesignSystemTest, ExampleUnitTest

### Wave 1A — Home Feed (IN PROGRESS)
- Agent dispatched to implement `feature/social`
- Files: FeedPost, FeedRepository, FakeFeedRepository, FeedFixtures, FeedUiState, FeedUiEvent, FeedViewModel, FeedScreen, FeedRoute
- Test: FeedViewModelTest
- Integration point: AppNavigation Tab 0 replace FoundationScreen() → FeedRoute()

### Wave 1B — Register Step 1 (QUEUED)
- Target: RegisterScreen (Learner + Tutor role toggle)
- Files: RegisterUiState, RegisterUiEvent, RegisterViewModel, RegisterScreen, RegisterRoute
- Integration point: AppNavigation "register" route replace RegisterPlaceholderScreen

### Wave 2A — My Network (QUEUED)
- Target: MyNetworkScreen with invitation and connection sections
- Files: NetworkRepository, FakeNetworkRepository, NetworkFixtures, MyNetworkUiState/Event/ViewModel/Screen/Route

### Wave 2B — Find Requests + Filters (QUEUED)
- Target: FindRequestsScreen + FiltersBottomSheet
- Files: RequestRepository, FakeRequestRepository, RequestFixtures, FindRequestsUiState/Event/ViewModel/Screen/Route

### Wave 2C — Notifications (QUEUED)
- Target: NotificationsScreen with All/Unread tabs, grouped list
- Files: NotificationRepository, FakeNotificationRepository, NotificationFixtures, NotificationsUiState/Event/ViewModel/Screen/Route

### Wave 3A — Messaging (QUEUED)
- Target: InboxScreen + ConversationScreen
- Files: MessagingRepository, FakeMessagingRepository, MessagingFixtures, InboxUiState/Event/ViewModel/Screen/Route, ConversationUiState/Event/ViewModel/Screen/Route

### Wave 3B — Me/Profile (QUEUED)
- Target: MeScreen (profile dashboard + logout)
- Files: ProfileRepository, FakeProfileRepository, ProfileFixtures, MeUiState/Event/ViewModel/Screen/Route

---

## Shared Contract Touchpoints

| Contract | Owner | Consumers |
|---|---|---|
| DemoSession (auth identity) | `feature/auth/domain/model/DemoSession.kt` | Profile, Notifications (avatar/name) |
| FakeAuthRepository.logout() | `feature/auth` | AppNavigation logout callback |
| AppNavigation route strings | Core (Tech Lead only) | All features via callback |
| TutorNetBottomBar tabs | `core/design/component` | AppNavigation MainShellScreen |
| Notification unread count | `feature/notifications` (future) | MainShellScreen badge |
