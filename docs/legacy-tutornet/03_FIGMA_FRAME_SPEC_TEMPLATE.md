# SCREEN SPEC TEMPLATE — TutorNET Mobile

**Use one copy per *verified* user-facing screen.** A feature README can link to several screen specs; don't mechanically create a `README.md` for each tiny Composable.

## Identification

- Screen name: `{{SCREEN_NAME}}`
- Figma file/page/node: `{{FIGMA_URL}}` / `{{PAGE_NODE}}` / `{{FRAME_NODE}}`
- Feature package: `{{FEATURE}}`
- Route: `{{ROUTE}}`
- Design status: `VERIFIED / DESIGN_UNVERIFIED / PARTIAL`
- Implementation status: `PLANNED / UI_MOCK / UI_VERIFIED / API_INTEGRATED`
- Figma screenshot path + export date: `{{REFERENCE_PNG_PATH}}`
- Reference window, density, font scale, theme: `{{REFERENCE_ENV}}`

## Visual evidence table

| Node ID | Layer/component | Constraints/size | Token/style | Exact asset path | Evidence |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | Verified / Unknown |

## Layout contract

- Scroll region and inset policy:
- Top app bar / bottom nav:
- Auto layout / constraints:
- Text hierarchy + exact labels:
- Spacing, shapes and elevation:
- Images, crop, colors, typography (values + sources):
- Device size adaptation:
- Accessible labels and reading order:

## User interactions

| Element | User action | Navigation or state change | Failure/disabled behavior |
|---|---|---|---|
| ... | ... | ... | ... |

## State design

- Loading:
- Content:
- Empty:
- Offline:
- Error / retry:
- Validation:
- Android keyboard/IME/focus:
- SavedStateHandle/rememberSaveable scope:

## Repository and fake-data contract

- Domain repository name:
- Minimal domain models (not guessed backend DTOs):
- Fake implementation path:
- Fixture scenarios + stable IDs:
- Screen + ViewModel + DI binding paths:
- State mutation rules / fake single source of truth:

## Backend integration readiness

- Backend business owner:
- Approved API contract source, if any:
- Gap label and explanation (`BACKEND_CONTRACT_GAP`):
- Temporary behavior in mock mode:
- Future real-data mapping plan:

## Verification

- `assembleDebug` result:
- Unit/ViewModel tests:
- Compose UI tests:
- Figma reference screenshot:
- Emulator screenshot:
- Visual differences and fixes:
- Small screen / font scaling / IME / accessibility checks:
- Outstanding issues and owner:
