# TutorNET Mobile — Readiness Gates for AI Coding

**Đặt file tại:** `frontend/app/docs/04_MOBILE_READINESS_GATES.md`  
**Trạng thái kiểm toán:** 2026-10-29 — lập từ tài liệu project, chưa xác minh trên Android Studio local.  
**Mục tiêu:** Chia việc AI cho từng frame/feature và có bằng chứng build, UX, fidelity; không hứa hẹn 100% giống ảnh.

## 0. Source of truth / quy tắc ưu tiên

1. Quy tắc quyền sửa: `AGENTS.md` gốc repo → `frontend/AGENTS.md` → `frontend/app/AGENTS.md`.
2. Kiến trúc, boundary, coding: `docs/frontend/app-architecture.md`, `docs/frontend/frontend-backend-boundary.md`, `docs/frontend/coding-conventions.md` (ở gốc repo).
3. Thiết kế: frame/screenshot, metadata và asset thực tế từ Figma; không coi HTML/XML xuất ra là Jetpack Compose có thể copy nguyên xi.
4. Chức năng: `frontend/app/docs/features/<feature>/README.md` + screen spec + task spec.
5. API: contract đã công bố; nếu chưa có, chỉ mock ở tầng data và ghi `BACKEND_CONTRACT_GAP`.

Khi các nguồn mâu thuẫn, dừng phần bị ảnh hưởng, ghi xung đột và yêu cầu người sở hữu quyết định; không âm thầm tự đoán.

## 1. Gate A — Android Foundation (trước khi AI code UI)

- [ ] Gradle sync chạy thành công trong Android Studio.
- [ ] `./gradlew :app:assembleDebug` PASS (Windows dùng `gradlew.bat`).
- [ ] `./gradlew :app:testDebugUnitTest` PASS hoặc ghi rõ chưa có test.
- [ ] `./gradlew :app:lintDebug` PASS hoặc ghi rõ blocker.
- [ ] App launch được trên emulator/thiết bị test.
- [ ] Lưu Gradle, AGP, Kotlin, Compose BOM, JDK, compile/target/min SDK (đọc từ file thực tế, không đoán).
- [ ] `AGENTS.md`, `README.md` không bị ghi đè hoặc mâu thuẫn với quy tắc root repo.

**Output:** `docs/BUILD_BASELINE.md` với lệnh, ngày, môi trường, PASS/FAIL và log path. Không chèn credential hay `local.properties` vào Git.

## 2. Gate B — Inventory toàn bộ Figma (trước khi code màn hình chưa được xác nhận)

- [ ] Truy xuất mọi page, frame, variants và component có dùng trên mobile.
- [ ] Mỗi frame có tên, node ID, page, feature, route dự kiến, liên kết navigation, trạng thái kiểm kê.
- [ ] Ghi rõ những frame bị thiếu quyền, quota, hoặc không thể truy xuất.
- [ ] Gắn nhãn frame `VERIFIED` chỉ khi có screenshot cùng metadata chi tiết.
- [ ] Không suy ra frame từ SRS hoặc từ tên feature backend.

**Output:** `docs/figma/FRAME_INVENTORY.md`.

## 3. Gate C — Design Evidence (trước khi nghiệm thu fidelity)

- [ ] Screenshot tham chiếu gốc cho từng frame trong `docs/figma/references/` (chỉ khi quyền sử dụng cho phép).
- [ ] `docs/figma/DESIGN_TOKENS.md`: typography, colors, spacing, radius, elevation, screen insets, với nguồn node/variable ID và đơn vị.
- [ ] `docs/figma/ASSET_MANIFEST.md`: tên asset, loại, vị trí/usage, kích thước, quyền tải/xuất, trạng thái.
- [ ] Không tự vẽ lại icon/logo nếu Figma có asset gốc được phép dùng.
- [ ] Đã chốt cách xử lý status bar, gesture area, IME, font scaling và màn hình ngoài kích thước thiết kế.

**Output:** screenshot + tokens + assets có traceability.

## 4. Gate D — Navigation & UI state (trước khi triển khai nhiều màn hình)

- [ ] `docs/NAVIGATION_MAP.md` ánh xạ route, start destination, bottom tabs, back behavior, auth guard, screen arguments.
- [ ] Mỗi screen spec có state `loading`, `content`, `empty`, `error`, `offline` và `disabled` khi phù hợp.
- [ ] Mọi CTA trong Figma có hành vi: navigate, change state, request permissions, disabled hoặc `BACKEND_CONTRACT_GAP`.
- [ ] Deep link / process recreation / back stack có kịch bản test khi liên quan.
- [ ] Copy trong UI, animation, popup, snackbar và validation không do AI tự sáng tác khi thiết kế chưa chỉ rõ.

**Output:** `docs/NAVIGATION_MAP.md` và state matrix ngay trong screen spec; tránh file trùng lặp.

## 5. Gate E — Mock-first architecture (trước khi nối các feature)

- [ ] Mỗi feature: `domain/repository/<Feature>Repository.kt` độc lập Retrofit/Room.
- [ ] `data/fake/Fake<Feature>Repository.kt` chứa nguồn dữ liệu mock ứng dụng; `data/fake/<Feature>Fixtures.kt` chứa fixture có ID ổn định.
- [ ] UI và ViewModel không tự tạo mock, không hardcode nội dung demo trong Composable.
- [ ] Hành vi fake có state thực: list/detail đồng bộ; like, comment, create, edit thao tác cập nhật hợp lý.
- [ ] Có kịch bản deterministic: success, empty, network error, permission denied, slow response, duplicate submit (theo từng feature).
- [ ] Ứng dụng có một nguồn sự thật cho fake data xuyên các màn hình liên quan; không tạo nhiều repository fake không đồng nhất.
- [ ] Khi API có thật, DI thay implementation chứ không sửa Compose screen.
- [ ] Không tạo HTTP DTO/endpoint/JSON 'production' chưa có hợp đồng.

**Output:** `docs/MOCK_SCENARIOS.md` (hoặc README feature nếu nhỏ) + unit tests cho mutation và trạng thái.

## 6. Gate F — Visual + interaction QA (cho *mỗi screen* trước khi DONE)

- [ ] Có screenshot Figma và screenshot emulator với thông số thiết bị, density, font scale, theme, window insets.
- [ ] So vùng tương ứng, tránh dùng raw 390x844 như số dp cố định.
- [ ] Kiểm tra ít nhất: bố cục, chữ/line wraps, icon, hình ảnh, màu, spacing, clipping, keyboard, scroll.
- [ ] Compose preview cho những UI states quan trọng; Compose UI test cho sự kiện, validation và navigation.
- [ ] Test một màn hình nhỏ và một màn hình lớn hơn; test font scale lớn và TalkBack đối với các phần tương tác.
- [ ] Lưu `reference`, `actual`, `diff` và ghi những sai khác chưa khắc phục.
- [ ] Không tự nhận “100%” chỉ vì screenshot test PASS: golden image phải được review bằng mắt và so với Figma gốc.

**Output:** `docs/verification/<screen-id>.md` + ảnh tham chiếu/diff và kết quả test; tự động hóa screenshot tests khi tương thích AGP.

## 7. Gate G — Task & review protocol (mỗi lần giao AI)

**Task input:** node ID, links screenshot/asset/token, README feature, screen spec, acceptance tests, target files, dependency/constraints.  
**Task output:** file changed, design evidence, build/test commands và kết quả, screenshot diff, known issues, `BACKEND_CONTRACT_GAP`, next step.  
**Không làm:** tạo thêm 10 feature rỗng, cài dependency không cần, tự sửa backend/infra, hardcode DTO giả, bỏ security/build gate, auto commit/merge.

**Thứ tự:** Foundation → Figma inventory+Design evidence → Design System → Login → shared social mock → Feed → Post/Comments/Create → các feature còn lại theo inventory.

## 8. Hiện trạng đã xác nhận / chưa xác nhận

| Hạng mục | Tình trạng tại 2026-10-29 |
|---|---|
| Repo frontend/app AGENTS.md & docs/frontend kiến trúc | Có trên GitHub; cần kiểm tra bản local hiện tại |
| Android Studio project skeleton | Người dùng đã tạo và chia sẻ ảnh cây thư mục |
| Android build/test thực tế | Chưa xác nhận |
| Figma Login `475:31`, Feed `475:32`, Post `475:33`, Create `475:34` | Đã đọc metadata sơ bộ, thiếu full screenshot/tokens |
| Figma Notifications node `506:1237` | Đã thấy tên node, chưa audit chi tiết |
| Figma frame inventory toàn bộ | Chưa hoàn thành (quota công cụ Figma) |
| Auth/Social README và task docs | Đã tạo bản starter; không đồng nghĩa đã copy vào project local |
| Backend API cho Social/Feed | Chưa xác nhận; mock trước |

## 9. Prompt ngắn cho agent để audit trước code

```text
Bạn đang làm trên frontend/app trong monorepo TutorNET.
Hãy đọc AGENTS.md, README.md, docs/04_MOBILE_READINESS_GATES.md,
../../docs/frontend/app-architecture.md,
../../docs/frontend/frontend-backend-boundary.md,
và các file Gradle/Kotlin đang có.

CHỈ kiểm tra Gate A (Android Foundation): báo cáo file và version thực tế,
chạy gradle sync/build/unit-test/lint nếu môi trường cho phép, ghi kết quả
vào docs/BUILD_BASELINE.md. Không triển khai màn hình, không sửa backend,
không cài thư viện không cần thiết, không tự commit.
Nếu không chạy được lệnh, nêu rõ command, stderr, blocker; không đoán PASS.
```
