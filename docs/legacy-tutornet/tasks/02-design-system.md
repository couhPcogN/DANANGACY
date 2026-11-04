# TASK 02 — Design System từ Figma, không code screen nghiệp vụ

**Depends:** Android Foundation passes build. **Scope:** `frontend/app/app/src/main/java/com/tutornet/app/core/design/**`, approved Android resource assets, targeted previews/tests and design spec documentation.

## Inputs before writing code

Read `frontend/app/AGENTS.md`, `docs/01_MASTER_AI_FIGMA_TO_COMPOSE_PROMPT.md`, `docs/design-system/README.md`, actual Gradle/dependency files and existing theme files. Query the Figma `Variable Color Swatches` and Android Social MVP components for screenshot and high-fidelity metadata (including instances used by Login and Feed).

If Figma tool is rate-limited, do not invent fonts, colors or icons and do not claim design fidelity. Record missing tokens/assets and stop visual-completion work; you may verify the existing Compose theme without guessing new tokens.

## Deliver

- Small verified color/typography/spacing/shape tokens as needed by the first screens; preserve names and provenance.
- Shared components only when instances prove repetition (e.g., branded button/input/app bar), otherwise keep feature-local.
- Separate Compose Previews for default/disabled/error/focused states when applicable.
- Actual Figma asset export/import with correct dimensions and ownership; never fake with Unicode/emoji if icon asset exists.
- Visual comparison report for a component catalog screenshot, noting mismatches and responsive constraints.

## Gate

`./gradlew :app:assembleDebug` + relevant previews/tests; no backend source edits, no invented theme values without marking uncertainty, no extra all-purpose UI framework.
