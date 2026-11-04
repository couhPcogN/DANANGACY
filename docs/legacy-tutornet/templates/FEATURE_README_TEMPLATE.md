# Feature: <Feature name>

> Status: `PLANNED | DESIGN_AUDITED | MOCK_UI | VERIFIED_UI | API_INTEGRATED`
> Feature owner: `<team/person>`
> Last reviewed: `<YYYY-MM-DD>`

## 1. Goal and scope
- **User goal:** What outcome does this feature enable?
- **In scope:** Concrete user actions and screens for THIS increment.
- **Out of scope:** What this agent must NOT implement.
- **Dependencies:** Other features, shared components, design system, route contracts.

## 2. Source of truth and evidence
- Figma file and page: `<URL, page name>`
- Confirmed frame(s): `<screen title, node ID, link>`
- Screenshots: `<local path, capture date, viewport/density/font scale>`
- Tokens/assets: `<verified names, paths, license/provenance>`
- Product rules: `<SRS or approved UX decision>`
- Architecture: `docs/frontend/app-architecture.md` and `frontend/app/AGENTS.md`
- API contract: `<approved source, or UNAVAILABLE>`
- **Unknowns:** Explicitly mark `DESIGN_UNVERIFIED` or `BACKEND_CONTRACT_GAP`; never fabricate data.

## 3. Screens and navigation
| Screen | Figma node | Route | Entry | Exit | Spec | Status |
|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | `screens/<name>.md` | ... |

Flow: `<screen> -> <screen>`; define back stack, system back, deep links and unauthenticated behavior.

## 4. UX and states
- Content, loading, empty, validation, error, offline/retry, success, disabled.
- Keyboard/IME and focus behavior.
- Accessibility: semantics, content descriptions, text scaling, minimum targets.
- Device/window/reference screenshot configuration and adaptive behavior.

## 5. Data model and mock-first contract
- **Client/domain model:** Only fields justified by visible UI behavior; not invented backend DTOs.
- **Repository interface:** `feature/<x>/domain/repository/<X>Repository.kt`
- **Fake implementation:** `feature/<x>/data/fake/Fake<X>Repository.kt`
- **Fixtures and scenarios:** `feature/<x>/data/fake/<X>Fixtures.kt`
- **State rules:** Define how fake mutations remain consistent across screens.
- **DI selection:** Fake in demo/debug; real implementation added later under data/remote with approved contract.
- Do NOT create fake REST endpoints, production JWTs, or static fake data inside Composables/ViewModels.

## 6. File ownership
```text
feature/<feature>/
  presentation/<screen>/...        # route, screen, state, ViewModel
  presentation/components/...    # feature-local reusable UI
  domain/model/...                # only if needed
  domain/repository/...           # interface
  domain/usecase/...              # only for meaningful behavior
  data/fake/...                   # fake repository, fixtures, scenarios
```
Document any justified deviation. Keep backend/infra read-only.

## 7. Acceptance criteria
| ID | Given / When / Then | Evidence (test/screenshot) | Status |
|---|---|---|---|
| AC-01 | ... | ... | pending |
| AC-02 | ... | ... | pending |

Minimum checks: `./gradlew :app:assembleDebug`; relevant ViewModel/UI tests; full-size reference screenshot comparison; small-screen/text-scale/IME; design discrepancies documented.

## 8. AI implementation slices (one task per PR/agent turn)
| Task | Scope | Depends on | Expected files | Verification |
|---|---|---|---|---|
| 01 | Design evidence and screen spec | None | `screens/...` | Reference available |
| 02 | State/repository/mock | 01 | `domain/...`, `data/fake/...` | Unit tests |
| 03 | Compose UI + navigation | 02 | `presentation/...` | Build + UI tests |
| 04 | Visual refinement | 03 | In-scope UI only | Screenshot comparison |

## 9. Completion report
- Files added/changed and rationale.
- Commands actually executed and results; never claim unrun tests passed.
- Reference vs actual screenshots and remaining visual differences.
- Backend/design gaps and deferred work.
- Explicit approval required before committing, merging, or touching backend.
