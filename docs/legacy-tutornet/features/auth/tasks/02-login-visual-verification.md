# Task 03.1 — Login Visual Verification & Refinement

**Destination in repository:** `frontend/app/docs/features/auth/tasks/02-login-visual-verification.md`

**Scope:** Login screen only. **Status:** NOT STARTED / VISUAL_PENDING.

## Prompt to give the Android coding agent

You are a Senior Android UI Engineer specializing in Kotlin, Jetpack Compose, Android Emulator validation, and Figma-to-Compose visual fidelity.

**Android project root:** `frontend/app/`.

**Single task:** Complete the visual verification and refinement of the existing Login screen. Phase 03 already implemented its MVVM, fake repository, and UI. **Do not rebuild the feature or start Register/Feed.**

### 1. Read only the relevant documents and code

- `AGENTS.md`, `README.md`
- `docs/AI_WORKFLOW.md`
- `docs/features/auth/README.md`
- `docs/features/auth/screens/login.md`
- `docs/features/auth/tasks/01-login-ui.md`
- `docs/visual/README.md`
- `docs/visual/AI_VISUAL_REVIEW_PROMPT.md`
- `docs/visual/references/REFERENCE_INDEX.md`
- `docs/design-system/README.md`
- The current `feature/auth/presentation/login/` and `core/design/` implementation

**Canonical image for this task:** `docs/visual/references/auth/login--default.png`. This newer image is authoritative for this visual review; do not silently mix it with older Figma node `475:31` specifications. Report any contradiction.

### 2. Establish a real Android runtime

1. Check that the Android SDK, ADB and an Emulator/physical test device are available.
2. In Android Studio Device Manager, start an existing Android Virtual Device if needed. If no device exists and tools allow it, configure a standard Android phone AVD. Do not claim any screenshot was taken without running an actual app on an actual emulator/device.
3. From `frontend/app/`, run `./gradlew :app:assembleDebug :app:testDebugUnitTest` (on Windows: `.\gradlew.bat :app:assembleDebug :app:testDebugUnitTest`).
4. Install/launch the debug application and navigate to Login; use a deterministic idle/no-keyboard state.
5. Record device resolution, density, Android version, font scale, locale, theme, display cutout and system-bar/inset behavior.
6. Capture a **real** screenshot. A Windows-friendly workflow is:

   ```powershell
   adb devices
   adb shell wm size
   adb shell wm density
   adb shell screencap -p /sdcard/Download/login-actual.png
   adb pull /sdcard/Download/login-actual.png docs/visual/reports/login-actual.png
   ```

   Ensure `docs/visual/reports/` exists first. Verify the output PNG can be opened. Do not generate a synthetic "actual" screenshot from the Figma design.

### 3. Prepare the reference correctly

- Preserve `docs/visual/references/auth/login--default.png` unchanged.
- If the image includes a phone mockup, black margins, or iOS status/gesture bars, create an **analysis-only** crop/mask of the true UI viewport and record the crop geometry.
- Android must render genuine Android system bars and insets. Do not fake iOS system bars or draw them inside a Composable.
- Align content viewport, aspect ratio, density and font scale before comparing; don't stretch images until they look alike.
- If the Figma frame's exact viewport/assets are unavailable, distinguish **SCREENSHOT_ESTIMATED** from **FIGMA_VERIFIED**.

### 4. Compare and refine

Examine and document in this order:
1. Layout geometry: header height, card overlap, safe-area placement, content width, scrolling and keyboard clearance.
2. Typography: font family, weight, size, line height, baseline, wrapping.
3. Colors, corners, borders and shadows: reuse existing tokens; don't silently redefine the global theme for one screen.
4. Exact icons, images, logos: reuse matching existing assets or explicitly report missing assets; do not replace branded artwork with arbitrary emoji/text.
5. Component dimensions and interaction states: text fields, password toggle, remember-me checkbox, actions, Google button, divider, footer.

Produce `docs/visual/reports/login-actual.png`, and, when image tools are available, `login-overlay.png` / `login-diff.png`. If screenshots have different geometry, annotate the comparison limitations; **do not claim a numeric pixel-fidelity score without a meaningful aligned comparison**.

Make a focused Login presentation/design-system fix only for evidenced mismatches. Keep the fake repository and ViewModel behavior unless a bug is directly discovered. Do not implement a real API or change backend.

### 5. Behavior and safety checks

- Keyboard/IME does not obscure password, buttons, or footer; accessibility/font scaling and scrolling are usable.
- Password visibility toggle, checkbox, input validation, loading/disabled state, and fake success/error can be exercised.
- Fake demo credentials exist only in a controlled development/demo configuration; ensure release cannot accept fabricated local credentials as real authentication. If this requires a separate architecture change, report the risk and recommend a follow-up task.
- Google is UI-only until mobile integration is implemented; label this `INTEGRATION_PENDING`, not "backend missing" without evidence.
- Backend phone-based login is `BACKEND_CONTRACT_GAP`; do not invent a phone endpoint or OTP behavior.

### 6. Verification and report

- Run `:app:assembleDebug` and `:app:testDebugUnitTest` again after changes; run relevant connected Compose UI tests if supported and a device is available.
- Report **files changed, commands executed, exact results, reference/actual/diff paths, visual differences fixed, remaining mismatches and contract gaps**.
- Status may be:
  - `PASS`: real screenshot captured, compared and reviewed; interaction and build evidence provided.
  - `PASS_WITH_VISUAL_GAPS`: screenshots compared, but documented mismatches remain.
  - `VISUAL_BLOCKED`: no emulator/device or no usable reference; do not declare pixel-perfect.
- Do **not** self-approve a golden screenshot; human review is required.
- Do **not** start Register or any other feature, modify backend/infrastructure, commit or merge.
