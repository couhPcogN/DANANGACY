# Coding Task — Messaging inbox + conversation demo

**Scope:** one bounded feature slice under `frontend/app/**`; **not a request to build the entire app**. Status: READY_FOR_IMPLEMENTATION_AFTER_DESIGN_GATES.

## Read first

- `frontend/app/AGENTS.md`, `frontend/app/docs/AI_WORKFLOW.md`, `frontend/app/docs/figma/FRAME_INVENTORY.md`
- Feature `../README.md` and screen spec(s): `../screens/inbox.md`, `../screens/conversation.md`
- `frontend/app/docs/visual/references/REFERENCE_INDEX.md` and the actual referenced PNG(s).
- Monorepo `docs/frontend/app-architecture.md`, `docs/frontend/frontend-backend-boundary.md`; inspect existing Kotlin classes and Gradle files.

## Implementation boundary

Implement one bounded messaging feature across two verified screens using a single fake repository. Build inbox/search/tabs, thread bubbles, composer and mock message send; wire shared nav/badges. Add proposal view and local confirm feedback only if renderable without inventing booking workflow. Explicitly disable/unavailable call, video and unverified contact picker destinations.

## Acceptance and tests

- Tests: thread open/back, search/filter, send updates both thread/inbox, unread count updates, duplicate-submit prevention, keyboard insets.
- Capture separate Inbox and Conversation screenshots matched to each reference; record chat scroll position.

## Required report

Changed paths, UI state/actions, build/test commands with PASS/FAIL, reference vs actual screenshot and diff, unverified visual details, backend contract gaps. No changes to backend/infra, no invented API, no auto commit or automatic next phase.
