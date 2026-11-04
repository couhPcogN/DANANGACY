# TutorNET Mobile — Screenshot-driven UI & Visual Regression

**Vị trí đích:** `frontend/app/docs/visual/README.md`  
**Áp dụng:** Android Kotlin / Jetpack Compose, Figma `PBL6--Tutornet`  
**Trạng thái:** Quy trình đề xuất. Chưa có ảnh reference hoặc kết quả kiểm thử thực tế được xác minh.

## 1. Mục tiêu

Mọi màn hình có Figma reference phải đi qua chu trình:

**Figma node + design context + export → Compose implementation → emulator screenshot → visual comparison → fix → review**.

UI đẹp mắt không thay thế được bằng chứng khớp thiết kế. Screenshot testing cũng không thay thế test logic, navigation hoặc accessibility.

## 2. Phân biệt hai loại baseline

1. **Design reference** (`references/`): ảnh xuất từ Figma, giữ nguyên, chỉ cập nhật khi phiên bản thiết kế thay đổi. Dùng kiểm tra giao diện có giống Figma không.
2. **Approved Android baseline** (`baselines/`): ảnh chụp từ ứng dụng đã được người review duyệt. Dùng làm *golden image* để phát hiện regression khi code thay đổi.

Không dùng screenshot Android vừa tạo để tự động thay thế Figma reference. Không tự động approve baseline khi test fail. Ghi lại Figma node/revision và reviewer.

## 3. Cấu trúc thư mục

```text
frontend/app/docs/visual/
├── README.md
├── SCREENSHOT_CHECKLIST.md         # Có thể bổ sung sau
├── references/                    # Ảnh Figma chuẩn: commit khi đủ quyền sử dụng
│   ├── login-475-31.png
│   ├── feed-475-32.png
│   ├── post-detail-475-33.png
│   └── create-post-475-34.png
├── baselines/                     # Android screenshots đã được review
│   └── login-default-approved.png
└── reports/                       # Ảnh actual / overlay / diff; KHÔNG commit mặc định
    └── login/
        ├── actual.png
        ├── overlay.png
        ├── diff.png
        └── review.md
```

Không tạo ảnh Figma trống, giả hoặc mượn ảnh không liên quan để lấp chỗ thiếu. Đặt tên theo **node ID và state** khi có nhiều trạng thái, ví dụ `login-475-31-error.png`.

## 4. Design capture (trước khi code)

Từ node Figma cụ thể, lấy và ghi:

- URL file và node ID; trang/frame; screenshot chính thức và ngày xuất; kích thước frame.
- Font family, font weight, font size, line height, letter spacing, color tokens.
- Container geometry, padding, spacing, alignment, border, corner radius, elevation.
- Tên component, variant, icon và các asset gốc có quyền truy cập.
- Trạng thái: default, loading, disabled, error, empty, content; tương tác và navigation.
- Khu vực Android status bar, navigation bar và IME để quyết định **không tái tạo thanh hệ thống giả trong app**.

Khi thiếu metadata/screenshot/asset, gắn `DESIGN_UNVERIFIED`, nêu phần thiếu và không tuyên bố pixel-perfect.

## 5. Khóa môi trường chụp

Để so sánh có ý nghĩa, ghi và giữ cố định:

- Emulator/device model, Android API, viewport px và density (dpi).
- Font scale, display size, locale (`vi-VN`), theme, orientation.
- System bars, edge-to-edge / inset policy, keyboard visibility.
- Mock dataset, ảnh, avatar, timestamps, locale format và trạng thái scroll.
- Không chụp trong khi animation/loading chưa ổn định; khóa clock trong mock nếu cần.

**Lưu ý:** Figma frame 390×844 là kích thước canvas thiết kế; không được tự cho rằng screenshot 390×844 pixels vật lý tương đương 390×844 dp Android. Chọn thiết bị và chiến lược crop/scale có tài liệu trước khi tính pixel diff; ưu tiên cùng viewport và không resize tùy tiện.

## 6. Chụp ảnh Android Emulator

Ví dụ dùng terminal tại máy có Android SDK/platform-tools:

```bash
adb devices
adb shell screencap -p /sdcard/tutornet-login.png
adb pull /sdcard/tutornet-login.png frontend/app/docs/visual/reports/login/actual.png
```

Trên Windows/PowerShell, cách lưu rồi `adb pull` giúp tránh vấn đề chuyển hướng luồng nhị phân ở một số phiên bản PowerShell. Không chụp token, mật khẩu, dữ liệu cá nhân thật. Dùng fake account.

## 7. So sánh visual

1. **Side by side:** Figma | Android actual — kiểm tra hierarchy, nội dung, assets, icon, typography.
2. **50% overlay:** căn chỉnh cùng vùng nội dung để thấy lệch vị trí, chiều cao và baseline.
3. **Diff image / metrics:** chỉ chạy khi hai ảnh có cùng kích thước và thống nhất cách crop/insets. Tập trung vùng UI có ý nghĩa; masking vùng clock/system animation chỉ khi được ghi rõ.
4. **Behavior:** nhấn, scroll, bàn phím, button enabled/disabled, back, loading/error.
5. **Review:** lưu sai khác và ưu tiên sửa; duyệt baseline khi thật sự đạt yêu cầu.

Thứ tự ưu tiên sửa:

1. Thiếu thành phần / dùng sai asset / sai thứ tự.
2. Layout và kích thước tổng thể; insets/scroll.
3. Typography (font, weight, line wrapping, baseline).
4. Spacing, color, border, radius, shadows.
5. Icon optical alignment và vi sai nhỏ.

Không dùng phần trăm trùng pixel làm tiêu chí duy nhất: font rasterization, anti-aliasing và hệ thống Android có thể tạo nhiễu. Mọi threshold số phải được chốt sau khi có 1–2 màn hình chuẩn.

## 8. Quy trình với AI Agent (bắt buộc với từng Figma frame)

1. Đọc `AGENTS.md`, `README.md`, tài liệu kiến trúc và đặc tả frame.
2. Lấy Figma design context **và screenshot** của đúng node. Nếu API hết quota, dùng ảnh export do người dùng cung cấp và đánh dấu rõ nguồn chứng cứ.
3. Kiểm tra design system, assets và các Composable đã có; reuse trước khi tạo.
4. Chỉ code screen/feature thuộc task. Mock ở `feature/<name>/data/fake/`, không trong Composable.
5. Build; chạy Compose Preview / emulator; chụp screenshot cùng environment.
6. So side-by-side, overlay và diff; sửa đến khi những sai khác quan trọng đã xử lý.
7. Test hành vi, TalkBack/font-scale, keyboard/insets, trạng thái loading/error/empty.
8. Báo cáo changed files, build/test PASS/FAIL, reference/actual/diff, discrepancies và `DESIGN_UNVERIFIED` nếu có. Không tự nhận đã đạt 100% hoặc tự cập nhật baseline.

## 9. Definition of Done (cho một screen)

- [ ] Có node ID Figma chính xác và ảnh reference từ frame đó.
- [ ] Đã có danh sách design tokens và đúng static assets.
- [ ] Compose Screen có preview cho state chính, không dùng image screenshot làm UI.
- [ ] Build thành công, mock state & UI interactions hoạt động.
- [ ] Có screenshot actual cùng environment với reference.
- [ ] Có visual review; sai khác quan trọng đã giải quyết hoặc ghi blocker.
- [ ] Có test navigation/behavior tương ứng.
- [ ] Reviewer phê duyệt, mới được cập nhật approved baseline.

## 10. Công cụ tự động hóa sau này

- **Figma-vs-Emulator manual visual review:** làm ngay từ Login, không phụ thuộc plugin Gradle.
- **Compose screenshot regression tests:** dùng test suites của Android Gradle Plugin nếu phiên bản AGP tương thích. Tài liệu Android mới đề xuất AGP 9.5+ cho test suites; API vẫn experimental. Không tự nâng AGP chỉ để thêm screenshot tests.
- Roborazzi/Paparazzi là các lựa chọn thay thế khi cần snapshot local; phải kiểm tra compatibility với phiên bản build hiện tại.

Các tool snapshot nói trên thường so ảnh Android hiện tại với **approved Android baseline**, không tự động chứng minh đã giống Figma. Bước đối chiếu Figma vẫn cần giữ riêng.

## 11. Figma mapping đã biết

| Frame | Figma node ID | Reference | Actual | Status |
| --- | --- | --- | --- | --- |
| Đăng nhập | `475:31` | Chưa lưu | Chưa chụp | DESIGN_UNVERIFIED |
| Trang chủ / Feed | `475:32` | Chưa lưu | Chưa chụp | DESIGN_UNVERIFIED |
| Bài viết & bình luận | `475:33` | Chưa lưu | Chưa chụp | DESIGN_UNVERIFIED |
| Tạo bài viết | `475:34` | Chưa lưu | Chưa chụp | DESIGN_UNVERIFIED |
| Notifications | `506:1237` | Chưa lưu | Chưa chụp | DESIGN_UNVERIFIED |

Mở rộng inventory theo từng frame khi kiểm kê đầy đủ Figma. Không suy diễn các frame chưa xác nhận.

## 12. Tài liệu gốc

- Android: https://developer.android.com/studio/preview/compose-screenshot-testing-with-testsuites
- Android: https://developer.android.com/studio/preview/compose-screenshot-testing
- Android: https://developer.android.com/develop/ui/compose/system/setup-e2e
