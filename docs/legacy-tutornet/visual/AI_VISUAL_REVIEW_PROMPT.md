# TutorNET — AI Prompt: Figma Screenshot → Jetpack Compose → Visual Review

**Vị trí đích:** `frontend/app/docs/visual/AI_VISUAL_REVIEW_PROMPT.md`

Bạn là Android Kotlin/Jetpack Compose UI engineer. Mục tiêu là triển khai **đúng một Figma frame** theo evidence, chứ không tạo màn hình mới từ mô tả tưởng tượng.

## Inputs

- Figma URL + node ID: `[điền node, ví dụ 475:31]`
- Feature screen spec: `[đường dẫn docs/features/.../screens/...]`
- Figma reference PNG: `[docs/visual/references/...]`
- UI state cần dựng: `[default / loading / error / empty]`
- Android project root: `frontend/app/`

## Read-first

Đọc đúng thứ tự:

1. `frontend/app/AGENTS.md` và `frontend/app/README.md`.
2. `frontend/app/docs/visual/README.md`.
3. `docs/frontend/app-architecture.md`, `docs/frontend/coding-conventions.md`, `docs/frontend/frontend-backend-boundary.md` (tại root monorepo).
4. Feature README, screen spec, design-system README và các components hiện có.
5. Dữ liệu Figma node, screenshot, assets, component properties/tokens.

## Scope / architecture

- Chỉ sửa các file mobile thuộc task; không chỉnh sửa `services/**`, `gateway/**`, `infrastructure/**`.
- Kotlin + Jetpack Compose, state hoisting và ViewModel/StateFlow theo feature-first.
- Mock data: `feature/<feature>/data/fake/` implement repository interface ở `domain/repository/`; có state thực, deterministic fixtures.
- `Screen` hiển thị `UiState` + callback, không gọi HTTP/Room hay load fixture trực tiếp.
- Không tự tạo endpoint, JSON DTO hoặc logic backend chưa có.
- Reuse design system và ảnh/icon gốc của Figma. Không dùng PNG Figma toàn màn hình thay cho native Compose UI.

## Mandatory visual feedback loop

1. Viết **design extraction**: kích thước, layout groups, colors, typography, spacing, radius, assets, state và insets. Nêu rõ phần `DESIGN_UNVERIFIED`.
2. Liệt kê file sẽ thay đổi và lý do trước khi code.
3. Triển khai UI; cung cấp Compose Preview cho default và ít nhất một state liên quan.
4. Build app; chạy màn hình trong emulator/device cấu hình đã ghi.
5. Chụp screenshot `actual.png`, ghép reference và actual cùng viewport; tạo overlay/diff trong `docs/visual/reports/<screen>/` nếu có thể.
6. Sửa các khác biệt về hierarchy, asset, typography, size, insets, spacing, colors, shadows; lặp lại đến khi qua review.
7. Test interactions, back stack, text input/IME, scrolling, font scale và mock state.
8. Không tự cập nhật `baselines/` hoặc claim pixel-perfect khi chưa có ảnh Figma chuẩn và reviewer approval.

## Required report

```text
Screen: <name>
Figma node: <id>
Reference path: <path or MISSING>
Device + Android API + density + viewport + font scale: <...>
Changed files: <...>
Build / tests: PASS | FAIL | NOT_RUN (kèm lệnh đã chạy)
Visual comparison: reference / actual / overlay / diff paths
Mismatches: <list ordered by severity>
Backend contract gaps: <none or BACKEND_CONTRACT_GAP>
Design gaps: <none or DESIGN_UNVERIFIED>
Status: BLOCKED | NEEDS_VISUAL_REVIEW | ACCEPTED_BY_REVIEWER
```

**Không tự chuyển sang màn hình tiếp theo khi task hiện tại chưa được nghiệm thu.**
