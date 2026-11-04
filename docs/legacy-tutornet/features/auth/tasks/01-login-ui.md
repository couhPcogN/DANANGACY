# VERSION UPDATE — Login implementation task

**Current reference supersedes original task text:** use **Figma Page 1 `538:454`** and `docs/visual/references/auth/login--default.png` (English burgundy design), **not** frame `475:31`. The login repository, ViewModel and unit tests have already been implemented according to an agent report. **Do not re-run this original creation task to recreate Auth**. Only perform its outstanding screenshot/visual QA or targeted fixes through the dedicated remediation tasks. The historic task is retained below for audit.

---

# AI CODING TASK — Login UI, mock-first

## Start-up instructions
Work ONLY within `frontend/app/**` and its approved mobile documentation. You must first inspect `AGENTS.md`, current Gradle/build files, existing Compose/theme/navigation source and `docs/features/auth/README.md`. Consult the master Figma-to-Compose prompt. Do not change backend, infrastructure, CI or git history without permission.

## Required Figma input
File `1CAT8HGWvQx5GEVWmoiNtv`, page `475:2`, frame `475:31`. Read high-fidelity design context AND screenshot; gather typography, fills, paddings, constraints, component instances and assets. If screenshot/assets/tokens cannot be accessed, STOP any claim of visual completion: implement only the architecture-safe mock/preview skeleton or return a missing-evidence report. The screenshot is a design reference, not an app asset.

## Deliver exactly this slice
- Feature domain `AuthRepository` interface and deterministic `FakeAuthRepository` with fixture scenarios and unit tests.
- Stateless Compose `LoginScreen` and stateful `LoginRoute` / ViewModel, lifecycle-aware collection and one-time navigation effect.
- Figma-matched layout with authentic assets and system insets; keyboard and text-scaling support; Compose previews for default/loading/error.
- Hook login success to Feed navigation only if Feed route exists; otherwise document a navigation dependency without inventing a fake finished Feed screen.
- Document confirmed visuals and gaps. No real OAuth, fake API DTO, URL, or production JWT.

## Before coding, report
1. Existing reusable code/components found.
2. Exact files to add/change and why.
3. Design evidence available vs unverified.
4. Cases requiring product decisions.

## Tests and acceptance
Run `./gradlew :app:assembleDebug` plus relevant tests where possible. Capture an emulator screenshot at a matched reference configuration, compare against Figma and iterate on discrepancies. Verify form loading/error, keyboard, narrow width, accessibility. Report tests run with exact pass/fail and screenshots/visual deltas. Do not mark 100% identical without verified comparison.

## Output format
- `Files changed` (paths and purpose)
- `Design evidence` (node IDs, screenshot, asset paths, tokens)
- `Behavior` (fake scenarios and interactions)
- `Verification` (commands actually run, screenshot differences)
- `Remaining gaps` (DESIGN_UNVERIFIED / BACKEND_CONTRACT_GAP)
