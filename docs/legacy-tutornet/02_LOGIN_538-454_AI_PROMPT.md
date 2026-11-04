# AI Prompt — Login Current Design (`538:454`)

Use only **Page 1 `538:454`** for current Login; screenshot `visual/references/auth/login--default.png`. Read `AGENTS.md`, `AI_WORKFLOW.md`, `figma/FRAME_INVENTORY.md`, `features/auth/README.md`, `features/auth/screens/login.md` and existing Login code. Design authority priority: **current Figma 538 frame + user supplied PNG → approved tokens/assets → older 475 frame only as historical context**.

Task scope: review current Compose Login visual output and correct mismatch versus the new design without altering successful MVVM architecture, `AuthRepository`, `FakeAuthRepository`, session flow or validation. Confirm header proportions, white overlapping card, centered card title/subtitle, field heights, English strings, Remember me/Forgot password row, burgundy button, Google original logo, Sign up inside card, TutorNET logo placement and Android system insets.

Run build/tests, launch Emulator, capture screenshot and matched-viewport diff, iterate on largest geometry errors. The screenshot is reference only, **never paint the screenshot as UI**. If Emulator unavailable, return `VISUAL_BLOCKED`, not PASS. Do not code Register or backend; no commit.
