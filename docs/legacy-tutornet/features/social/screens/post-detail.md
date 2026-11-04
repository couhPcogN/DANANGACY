# Screen Spec — 03 Bài viết & bình luận

**Figma:** file `1CAT8HGWvQx5GEVWmoiNtv`, frame `475:33`, 390 × 844. Structural metadata verified; screenshot/tokens/assets not yet retrieved.

## Verified visible content

- Top app bar: back action and title `Bài viết`.
- Post author/content/artwork and like/comment interactions.
- Comments heading and comment rows (`Gia Hân`, `Minh Anh`) with avatar/name/text/time.
- Fixed-area comment composer above system gesture area, input and send action.

## Behavior

- Receive post ID, load from shared fake repository, use same counts/liked state as Feed.
- Send comment adds one entry and updates count in Feed; block empty/whitespace-only input; prevent duplicate send while pending.
- Maintain text and keyboard state, show composer above IME; Back returns to Feed preserving scroll where feasible.
- Loading/error/not-found/empty-comments states must be represented; `TalkBack` labels for send, back, like.

## Visual checklist

Compare composer placement on IME open/closed, art ratio, author alignment, text wrapping, comments rows and header; report unverified colors/fonts/assets rather than inventing.

**Task:** `../tasks/03-post-ui.md` | **Feature:** `../README.md`.
