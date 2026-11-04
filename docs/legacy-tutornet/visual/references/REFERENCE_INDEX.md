# TutorNET Mobile — Visual Reference Index (updated 2026-10-30)

**Location:** `frontend/app/docs/visual/references/REFERENCE_INDEX.md`. Files below must be placed **relative to the same `references/` folder**. Images are supplied by the user; this Markdown package does NOT contain their binary image files. **Do not fabricate screenshots or create placeholder PNGs.**

| Current Figma ID | Required image file | Design/state | Action |
|---|---|---|---|
| `538:454` | `auth/login--default.png` | Log In English, burgundy header | Replace older Login ref with updated screenshot |
| `538:692` | `auth/register--step-01-learner-selected.png` | Registration Step 1, Learner | Replace previous variant with latest export |
| `538:1165` | `auth/register--step-01-tutor-selected.png` | Registration Step 1, Tutor | **Add** |
| `538:244` | `social/home-feed--default.png` | New Home Feed with global search | Replace previous variant after reviewing |
| `538:2` | `notifications/list--all.png` | Notifications All | Replace previous screenshot if current differs |
| `538:801` | `marketplace/find-requests--filters-open.png` | Open filter sheet | Replace previous screenshot if current differs |
| `538:1541` | `messaging/inbox--focused.png` | Focused Inbox | Replace previous screenshot if current differs |
| `538:541` | `messaging/conversation--thread-top.png` | Conversation top / current scroll | **Add** |
| `538:1275` | `network/my-network--default.png` | My Network | **Add** |
| `538:1706` | `profile/me--default.png` | Me dashboard | **Add** |

Keep `messaging/conversation--trial-proposal.png` if you already saved the earlier longer full-thread screenshot; it is a **supplementary different scroll state**, not a duplicate.

## Directory tree

```text
frontend/app/docs/visual/references/
├── REFERENCE_INDEX.md
├── auth/
│   ├── login--default.png
│   ├── register--step-01-learner-selected.png
│   └── register--step-01-tutor-selected.png
├── social/
│   └── home-feed--default.png
├── notifications/
│   └── list--all.png
├── marketplace/
│   └── find-requests--filters-open.png
├── messaging/
│   ├── inbox--focused.png
│   ├── conversation--thread-top.png
│   └── conversation--trial-proposal.png   # optional older scroll reference
├── network/
│   └── my-network--default.png
└── profile/
    └── me--default.png
```

## Evidence policy

- Node IDs above are **directly verified as Figma frame titles** in Page 1; matching each PNG to its exact Figma render is based on user-supplied screenshots, not fresh high-fidelity Figma exports (rate limit).
- Put the **actual user-supplied images** at these paths. For frames with noisy/black presentation margins, retain originals and create normalized cropped comparison copies under `docs/visual/reports/`; don't erase parts of actual UI.
- Keep original raw PNG for traceability; record emulator device/density/font scale/locale and scroll state in diff report.
- Screenshots are **reference evidence, never Android `res/drawable` full-screen implementation assets**. Export actual logo/icons separately with authorized asset path and preserve exact shapes.
- Do not render fake iOS status bar or gesture bar; mask/normalize system controlled regions in comparisons.
