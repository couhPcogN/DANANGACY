# MASTER PROMPT — Figma → Kotlin Jetpack Compose (TutorNET)

> Paste this complete prompt into an AI coding agent that has repo access, Android build/test access and (ideally) Figma design tools. Fill all `{{...}}` variables before execution. Use one frame / tightly coupled screen per coding task.

## Context

You are implementing a high-fidelity **native Android Kotlin Jetpack Compose** UI for TutorNET. The design authority is Figma. The architectural authority is the repository's existing frontend documentation. Build the UI with functional interactions and deterministic fake repositories; backend APIs are **not** a prerequisite.

- Repo: `FinalPBL/tutor-net`, current working branch: `{{BRANCH}}`.
- Figma file: `https://www.figma.com/design/1CAT8HGWvQx5GEVWmoiNtv/PBL6--Tutornet`.
- Screen frame node: `{{FRAME_NODE_ID}}`.
- Frame title: `{{FRAME_TITLE}}`.
- Target feature: `{{FEATURE_NAME}}`.
- Target path: `frontend/app/`.
- Reference emulator: `{{DEVICE_MODEL}}`, logical window `{{WIDTH_DP}}x{{HEIGHT_DP}}dp`, density `{{DENSITY}}`, font scale `{{FONT_SCALE}}`, UI mode `{{LIGHT_OR_DARK}}`.

## Step 0 — Read before modifying anything

Read all of:

1. `frontend/app/AGENTS.md`
2. `docs/frontend/app-architecture.md`
3. `docs/frontend/coding-conventions.md`
4. `docs/frontend/frontend-backend-boundary.md`
5. `docs/frontend/frontend-testing.md`
6. Existing source paths, available components, assets, theme, Gradle and version catalog.

Use **REUSE → EXTEND → COMPOSE → CREATE** for shared code. Limit writes to `frontend/app/**` and `docs/frontend/**`, unless otherwise authorized. Do not make commits unless explicitly asked.

## Step 1 — Acquire visual evidence (mandatory fidelity gate)

1. Fetch `get_design_context` for the target frame with screenshot enabled, inspect full node hierarchy, layout and instances.
2. If the returned metadata is sparse, fetch the relevant child nodes. If screenshot absent, fetch the screenshot separately.
3. Extract and save all asset files from official design tooling, respecting each asset's exact composition, aspect ratio and slot. Avoid temporary Figma URL references in generated source.
4. Read actual design variables: colors (hex/alpha), text styles (family/weight/lineHeight/letterSpacing), spacing, padding, radii, strokes, effects, alignments, auto-layout, viewport, visibility and interactive component variants.
5. Write a compact `DESIGN_EVIDENCE` table *before coding*, with each important element's Figma node ID, exact metrics, source, asset path, and whether confirmed or unknown.

**Stop condition:** If the screenshot or essential design information is unavailable, do not claim pixel-perfect fidelity and do not invent colors, fonts, icons, images, spacing, or screen elements. You may implement clearly labeled structural scaffolding only if the user explicitly approves partial fidelity. Record missing evidence and request screenshot/metadata export.

**Important distinction:** Figma structure might resemble HTML/XML or generated CSS, but it is **not** an Android layout implementation. Translate design intent to Compose primitives. Do not paste HTML into WebView, and do not use a screenshot as an entire UI background.

## Step 2 — Model behavior and data boundaries

For this screen, record:
- Inputs / outputs and clickable areas; exact text and validation.
- Route entry, route exit, back-navigation and deep-link actions.
- UI states: success/idle, loading, empty, error, disabled, offline, form errors where relevant.
- Which state is local (`rememberSaveable`) and which is screen-owned (`ViewModel`).
- Domain repository interface (if needed) and `data/fake/` implementation with deterministic fixtures. Fake data **must not** be embedded in Composable or ViewModel.
- Unsupported backend needs as `BACKEND_CONTRACT_GAP` (do not invent endpoints/DTOs).

State shape example:

```kotlin
data class SampleUiState(
    val isLoading: Boolean = false,
    val message: String? = null
)
```

Apply `collectAsStateWithLifecycle` for ViewModel flows. UI has `Screen(state, onAction)` and a separate Route that wires ViewModel/DI/navigation.

## Step 3 — Implement the UI

- `Modifier` and Compose layout must express the Figma hierarchy via `Column`, `Row`, `Box`, `LazyColumn`, `Spacer`, `weight`, `padding`, proper alignment and constraints. Use absolute pixel positioning **only** for truly fixed decorative overlays.
- Treat Figma's 390×844 (if applicable) as a **reference viewport**, not a hard-coded size. Use `dp`/`sp` appropriately, responsive constraints, safe scrolling and IME handling.
- Use system status/navigation bars rather than drawing the mock status bar and gesture handle from the Figma screenshot. Handle edge-to-edge and insets correctly; preserve matching content placement.
- Use exact Figma content, verified colors/tokens/font metrics and local image/vector assets. Do not swap icons or add stock imagery. No runtime links to Figma assets.
- Reuse shared design components when semantically equivalent; do not replace design-specific components with visually mismatched default Material widgets.
- Add `@Preview` for the reference, empty/error/loading where appropriate, with deterministic UiState fixtures.
- Add test tags/semantics sparingly for interactive elements and accessibility, without compromising UI geometry.

## Step 4 — Run proof loops until acceptable

1. Run Gradle compilation (at minimum `./gradlew :app:assembleDebug` from `frontend/app`), note if wrapper paths differ.
2. Run applicable unit and Compose UI tests; fix compilation/runtime errors.
3. Launch the target screen on the reference emulator and capture screenshot with known device density, fontScale and system bar configuration.
4. Compare **Figma reference** and **actual screenshot** at the same content bounds. Separate Android system-controlled bar pixels from in-app UI. Inspect the difference for:
   - positioning and sizes
   - spacing, baselines, line wrapping
   - shape, corner radii, borders/shadows
   - colors and typography
   - icons and asset scaling/cropping
   - scroll position, clipped/overlapping controls
5. Fix the top three visual discrepancies, recapture, repeat. Do not declare finished after the first rendering.
6. Verify usable interactions, back/keyboard, empty/error state, 48dp touch targets where appropriate, large text and one small-screen variant.

Visual comparison may use crops/overlays/difference heatmaps. Metrics such as MAE/SSIM help diagnostics but are not universal pass/fail rules; human inspection of content and semantics remains essential. Screenshot regression baseline must be approved rather than automatically updated to match broken output.

## Step 5 — Required deliverables in the final response

- Paths of files created/modified and why each belongs in that layer.
- `DESIGN_EVIDENCE` table: verified values; remaining unknowns clearly labeled.
- Reference screenshot vs actual screenshot (or state screenshot unavailable).
- Exact Gradle/test commands and real pass/fail results. Never claim a test ran if it did not.
- Interactions/navigation implemented, fake data behavior and unsupported contracts.
- Visual discrepancy checklist showing fixed items and remaining mismatches.
- A screen spec/README at `docs/frontend/mobile/screens/{{SCREEN_SLUG}}.md` containing Figma node, state, assets, navigation, tests, backend-gap list, and current status.

## Prohibited shortcuts

- Hardcode sample profile/posts directly in Composable or ViewModel.
- Create fake HTTP APIs, DTOs, invented JSON contracts or a fake OAuth token presented as production auth.
- Edit `services/**`, `gateway/**`, `infrastructure/**` or backend migrations.
- Paint the Figma screenshot as a background instead of implementing UI.
- Substitute arbitrary icons, images, colors, or fonts and call it 1:1.
- Write every screen into `MainActivity.kt` or create `BaseViewModel` / `BaseRepository` without a documented need.
- Skip live rendering/screenshot comparison while claiming 100% fidelity.
