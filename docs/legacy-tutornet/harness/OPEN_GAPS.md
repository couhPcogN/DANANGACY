# TutorNET Mobile — Open Gaps

**Maintained by:** Tech Lead / Orchestrator

---

## BACKEND_CONTRACT_GAP Entries

### BCG-001: Google OAuth Sign-In
- **Required behavior:** "Continue with Google" button triggers real Google authentication
- **Current:** Button disabled in FakeAuthRepository; `SubmitGoogle` event does nothing
- **Missing contract:** Google Identity Services, backend token exchange, user creation/lookup
- **Proposed backend:** identity-service to support OAuth token exchange
- **Safe mock:** ✅ Current disabled/informational state is safe

### BCG-002: Phone OTP Verification
- **Required behavior:** Phone number login/registration triggers OTP flow
- **Current:** Email or phone field accepts both; no OTP flow
- **Missing contract:** SMS delivery service, OTP validation endpoint
- **Safe mock:** ✅ Fake accepts email format only

### BCG-003: Register Backend Persistence
- **Required behavior:** Creating an account persists to backend
- **Current:** Registration Step 1 is UI-only
- **Missing contract:** User creation API, role assignment API
- **Safe mock:** ✅ Fake "success" redirect acceptable for demo

### BCG-004: Messaging WebSocket
- **Required behavior:** Real-time message delivery in Chat Thread
- **Current:** Not implemented; will use fake in-memory store
- **Missing contract:** WebSocket protocol, message event schema, presence protocol
- **Safe mock:** ✅ FakeMessagingRepository with deterministic messages

### BCG-005: Push Notifications
- **Required behavior:** Real push notification delivery
- **Current:** Notifications screen shows static fake list
- **Missing contract:** FCM token registration, notification event schema
- **Safe mock:** ✅ FakeNotificationRepository

---

## DESIGN_UNVERIFIED Items

| Item | Screen | Note |
|---|---|---|
| Color tokens | All | SCREENSHOT_ESTIMATED; no Figma Variable GUID export |
| Typography scale | All | Inferred from screenshots |
| Exact spacing/dp values | All | No AutoLayout values retrieved |
| Logo opacity | Login | Subtle mark; exact opacity not confirmed |
| Post card icons | Feed | Material Icons used as approximation |
| Network graph assets | My Network | Not retrieved |
| Filter chip variants | Find Requests | Not retrieved |

---

## INTEGRATION_PENDING Items

| Item | Status |
|---|---|
| Google OAuth (Login/Register) | Blocked on BCG-001 |
| Phone OTP | Blocked on BCG-002 |
| Real user registration | Blocked on BCG-003 |
| Scheduling / booking from matched request | No design spec |
| VoIP / video call from Chat header | No design spec |
| Payment / subscription | No design spec |
