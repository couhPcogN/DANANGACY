# TutorNET Mobile — Figma Frame Inventory (2026-10-30)

**Figma file:** `1CAT8HGWvQx5GEVWmoiNtv`  
**Current mobile family:** **Page 1** (`0:1`), `538:*` frames. **Selected link:** [`538:1706` My Profile](https://www.figma.com/design/1CAT8HGWvQx5GEVWmoiNtv/PBL6--Tutornet?node-id=538-1706).  
**Evidence:** on 2026-10-30, read top-level Figma pages and metadata for Page 1 and the full layer tree of `538:1706`. `get_design_context` was rate-limited by Starter. User supplied screenshots. **This is not a claim of complete deep-node inspection for all ten frames.**

## Current frames — verified Figma node IDs

| Node | Figma frame name | Feature | Reference PNG | Status |
|---|---|---|---|---|
| `538:2` | TutorNET Mobile - Notifications | `notifications` | `notifications/list--all.png` | ID/title confirmed; screenshot |
| `538:244` | TutorNET Mobile - Home Feed (Facebook Style) | `social` | `social/home-feed--default.png` | ID/title confirmed; screenshot |
| `538:454` | TutorNET Mobile - Log In | `auth` | `auth/login--default.png` | ID/title confirmed; screenshot |
| `538:541` | TutorNET Mobile - Chat Thread (Nguyen Minh Anh) | `messaging` | `messaging/conversation--thread-top.png` | ID/title confirmed; screenshot |
| `538:692` | TutorNET Mobile - Create Account (Learner) | `auth` | `auth/register--step-01-learner-selected.png` | ID/title confirmed; screenshot |
| `538:801` | TutorNET Mobile - Find Requests (Filters Sheet Open) | `marketplace` | `marketplace/find-requests--filters-open.png` | ID/title confirmed; screenshot |
| `538:1165` | TutorNET Mobile - Create Account (Tutor) | `auth` | `auth/register--step-01-tutor-selected.png` | ID/title confirmed; screenshot |
| `538:1275` | TutorNET Mobile - My Network | `network` | `network/my-network--default.png` | ID/title confirmed; screenshot |
| `538:1541` | TutorNET Mobile - Messaging List | `messaging` | `messaging/inbox--focused.png` | ID/title confirmed; screenshot |
| `538:1706` | TutorNET Mobile – Me (My Profile) | `profile` | `profile/me--default.png` | **Full structural metadata read** and screenshot supplied |

The actual Figma **top-level pages** remain Page 1 (`0:1`), Variable Color Swatches (`169:1165`), TutorNET • Android Social MVP (`475:2`). The new mobile screens are **frames in Page 1**, not new top-level Figma pages.

## Earlier design family (not canonical for changed screens)

`475:31` Login, `475:32` Feed, `475:33` Post Detail/Comments, `475:34` Create Post (and `475:35..37`, `494:*` variants) still exist under page `475:2`. Treat as **legacy/alternate drafts** for Login and Home Feed unless a product decision states otherwise. Post Detail/Create Post have **no verified replacement in the `538:*` family**, so retain their specs as provisional, not silently mix UI styles.

## Shared navigation observed in reference screenshots

`Home` | `My Network` | `Find Requests` | `Messaging` | `Me`. Notifications open via bell; `Chat Thread` from Inbox or message action; Register from Login, account type Learner/Tutor. The routes and behavior are **client-side proposals**; backend semantics require separate contracts.

## Mandatory next verification before claiming pixel accuracy

Export exact node renders and Figma variables/asset manifests once tool access is available; compare these with the user-supplied PNGs. Resolve conflicts in screenshots, design copy, icons and frame versions. No Figma-guid-verified token claim yet; burgundy `#6C1111` remains `SCREENSHOT_ESTIMATED` in current code.
