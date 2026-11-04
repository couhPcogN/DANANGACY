# TutorNET Mobile — Social / Home Feed

**Current Home/Feed:** Figma Page 1 `538:244`, reference `docs/visual/references/social/home-feed--default.png`. **Earlier alternate:** `475:32` under legacy `475:2` page. Post Detail (`475:33`) and Create Post (`475:34`) **have no confirmed equivalent among the new `538:*` frames**; retain their existing specs but mark visual style consistency `DESIGN_UNVERIFIED` before implementing.

## Screen ownership

| View | Current design | Spec | Decision |
|---|---|---|---|
| Home Feed | `538:244` | `screens/feed.md` | **Current canonical** |
| Post Detail/Comments | older `475:33` | `screens/post-detail.md` | Provisional — verify updated design |
| Create Post | older `475:34` | `screens/create-post.md` | Provisional — verify updated design |

## Home layout and behavior

Top bar shows user avatar, global TutorNET search, notifications; composer contains avatar, **What's on your mind?**, image/document shortcuts; post cards include authors, follow, request status, budgets, saved/send actions and engagement content. Five-tab bottom navigation belongs to **shared app shell**, not Feed's internal Composable. Reference first post has a matched tutor request card; second post is an educational tip.

A `SocialRepository` fake store is allowed for post, comment, like, follow, save and demo request actions only as verified; do not invent a backend Social API, and don't assume all entries are ordinary text posts. Use stable IDs, consistent counts/relationships across screens. Unverified actions should visibly explain demo limitations.

## Task order / gates

`tasks/01-social-mock-store.md` → `tasks/02-feed-ui.md` using the **new `538:244` screen spec** → `tasks/03-post-ui.md` only after resolving whether older Post/Create designs are still authorized. After each step build/test, capture Emulator screenshot and compare with reference. Record the selected scroll position; no claim that old Feed and new Feed are pixel-equivalent.

No backend or infrastructure edits. Use `frontend/app/AGENTS.md`, monorepo `docs/frontend/*` for architecture rules.
