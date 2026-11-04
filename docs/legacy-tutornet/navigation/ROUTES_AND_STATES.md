# TutorNET Mobile — Navigation & UI State Contract (current 538 family)

**Status:** Proposed application-level navigation mapping grounded in visible `538:*` frames; internal route strings are implementation choices, not URLs or backend endpoints. Reconcile with existing `AppNavigation.kt` before editing.

| Entry/route concept | Destination | Design evidence | Back behavior |
|---|---|---|---|
| Unauthenticated entry | Login | `538:454` | OS/system exit as appropriate |
| Login → Sign up | Register / Learner selected | `538:692` | Back to Login, preserve local draft as appropriate |
| Register role change | Register / Tutor selected | `538:1165` | Same registration route, role state change; do not spawn unrelated app flows |
| Login mock success | Home | `538:244` | No back to authenticated Login; clear correctly |
| Bottom tabs | Home / My Network / Find Requests / Messaging / Me | `538:244`, `538:1275`, `538:801`, `538:1541`, `538:1706` | Tab back-stack behavior explicit and tested |
| Bell icon | Notifications | `538:2` | Return to previous screen |
| Messaging conversation row | Chat thread | `538:541` | Return to Inbox with scroll preserved |
| Find Requests filters | Modal bottom sheet | `538:801` | Back or scrim dismiss without losing draft filters unless Reset |
| Me → logout | Clear demo session → Login | `538:1706` labels, current Auth fake repo | Clear authenticated back stack |
| Profile/Network/Notifications actions | Appropriate screen if implemented; else explicit demo unavailable | Visual affordances only | No dead taps or invented endpoints |

## Shared UI state vocabulary

`Loading`, `Content`, `Empty`, `Error` as appropriate, plus `Submitting`, `Success`, and action-specific flags such as `selectedRole`, `selectedTab`, `unreadCount`, `selectedFilters`, `pendingInvitation`, `draftMessage`. Share one source of truth where cross-screen counters/identities are the same.

## Rules for the agent

Keep the app shell and bottom navigation single-owner; state-hoist Compose screens; use `StateFlow` immutable states and lifecycle-aware collection; avoid navigating during composition. No fake OS bars. Do not manufacture routes to missing screens just to satisfy screenshot buttons; use clear safe affordance states. Verify with Android Back and process recreation tests.
