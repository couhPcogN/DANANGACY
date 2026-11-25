# KẾ HOẠCH KIỂM THỬ PHẦN MỀM DI ĐỘNG (TEST PLAN)
## ĐỒ ÁN DANANGACY — TUẦN 5: QUY TRÌNH KIỂM THỬ VÀ SỬA LỖI

**Tên dự án:** Ứng dụng Di động Du lịch và Di sản Đà Nẵng (DANANGACY)
**Tác giả:** Nhóm Phát triển & Đảm bảo Chất lượng Phần mềm (Mobile QA Team)
**Vai trò:** Senior Mobile QA Engineer, FastAPI Integration Tester & QA Lead
**Ngày ban hành:** 26/11/2026
**Phiên bản kế hoạch:** 1.0 (Final Academic QA Plan)

---

## 1. THÔNG TIN DỰ ÁN (PROJECT INFORMATION)
- **Hệ thống Monorepo:**
  - `frontend/`: Ứng dụng di động xây dựng trên nền tảng React Native 0.88, Expo SDK 52, TypeScript, kiến trúc MVVM.
  - `backend/`: Dịch vụ REST API hiệu năng cao xây dựng bằng Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic migrations, cơ sở dữ liệu PostgreSQL/SQLite.
- **Mục tiêu sản phẩm:** Cung cấp trải nghiệm du lịch số hóa, bảo tồn di sản, lên lịch trình thông minh (hỗ trợ ngoại tuyến Offline-First), trắc nghiệm nhận thưởng và hỗ trợ gợi ý AI qua Google Gemini.

---

## 2. MỤC TIÊU KIỂM THỬ (TESTING OBJECTIVES)
1. Xác minh tính đúng đắn và độ tin cậy của toàn bộ các luồng nghiệp vụ cốt lõi đã triển khai (Happy Path và Unhappy Path).
2. Phát hiện và ngăn chặn sớm các rủi ro nghiêm trọng: mất dữ liệu ngoại tuyến (Data Loss), rò rỉ phiên làm việc giữa các tài khoản (Cross-Account Leakage), xung đột ghi đè đồng thời (Concurrent Overwrites), và hồi sinh dữ liệu đã xóa (Record Resurrection).
3. Đánh giá tính tương thích trên các môi trường máy ảo Android Emulator khác nhau (kích thước màn hình nhỏ 720x1280, cấu hình RAM khác nhau) và ghi nhận trạng thái kiểm thử thiết bị vật lý thực tế.
4. Xây dựng tài liệu kiểm thử chuẩn hóa phục vụ nộp báo cáo môn học và bảo vệ đồ án trước giảng viên.

---

## 3. PHẠM VI KIỂM THỬ (SCOPE)

### 3.1. Các chức năng trong phạm vi (In-Scope Features)
- **Xác thực & Phiên làm việc (Authentication & Session):** Đăng nhập JWT, Đăng ký tài khoản, Đăng xuất, Khôi phục phiên làm việc sau khi tắt ứng dụng (Session Rehydration), Cách ly chế độ Khách (Guest Isolation).
- **Quản lý Lịch trình (Itinerary CRUD):** Tạo mới, đọc danh sách, cập nhật chặng dừng, xóa lịch trình, tính hợp lệ khung giờ (06:00 - 22:00, thời lượng >= 30 phút, 1..8 chặng, 1..3 ngày).
- **Lưu trữ Bền vững & Đồng bộ (Persistence & Sync):** Phân vùng khóa AsyncStorage theo `user.uid`, Hydration Gate, Đối soát Remote Reconciliation, Quản lý tiến trình Mutation Coordinator.
- **Xử lý Xung đột Phiên bản (Conflict Resolution UX):** Khóa lạc quan Optimistic Concurrency (HTTP 409), Giao diện so sánh Diff View Local vs Server, Lựa chọn an toàn ("Dùng bản Server", "Giữ bản Local", "Để sau").
- **Gamification & Trắc nghiệm Di sản:** Nạp danh sách câu hỏi theo ID thực tế, chấm điểm có Bearer token, ví voucher, chống gian lận điểm thưởng.
- **Thời tiết & Trợ lý Di sản AI:** Dự báo thời tiết Đà Nẵng, Gemini heritage guide proxy, xử lý fallback khi cạn quota hoặc mất kết nối.
- **Điều hướng & Giao diện (Navigation & UI):** 5 Bottom Tabs, Header, Card, Input fields, Modal, xử lý bàn phím và giao diện đa kích thước màn hình.
- **Xử lý Mất kết nối Mạng (Network Failure & Resilience):** Ứng dụng mở và hoạt động ngoại tuyến với dữ liệu local khi mất mạng, xử lý timeout 10 giây, đồng bộ lại khi có kết nối.

### 3.2. Các chức năng ngoài phạm vi (Out-of-Scope Features)
- Thanh toán điện tử trực tuyến thực tế (Payment Gateway).
- Bản đồ định vị GPS theo thời gian thực ngoài trời (Live Turn-by-Turn GPS Navigation).
- Đóng gói xuất bản Play Store production (Google Play Signing, Proguard/R8 release build chuyên sâu).

---

## 4. CÁC LOẠI HÌNH KIỂM THỬ (TEST TYPES)
1. **Functional Testing (Kiểm thử chức năng):** Xác thực hành vi theo yêu cầu nghiệp vụ.
2. **Positive Testing (Kiểm thử đầu vào đúng):** Dữ liệu chuẩn mực, định dạng hợp lệ.
3. **Negative Testing (Kiểm thử đầu vào sai):** Dữ liệu sai định dạng, mật khẩu sai, thời gian bắt đầu sau thời gian kết thúc, câu hỏi không tồn tại.
4. **Empty Input Testing (Kiểm thử để trống):** Bỏ trống email, mật khẩu, họ tên, ngày đi, danh sách chặng dừng.
5. **Boundary Value Testing (Kiểm thử giá trị biên):** Độ dài mật khẩu 7 vs 8 ký tự, số ngày lịch trình 0, 1, 3, 4 ngày; số chặng dừng 0, 1, 8, 9 chặng; khung giờ 05:59, 06:00, 22:00, 22:01.
6. **UI & Responsive Testing:** Khả năng hiển thị trên màn hình nhỏ (Small Phone 720x1280), co giãn layout, bàn phím ảo che khuất input.
7. **Navigation Testing:** Di chuyển giữa 5 tabs, nút quay lại (Back button), mở/đóng modal.
8. **API Integration Testing:** Kiểm thử tương tác giữa React Native client và FastAPI qua giao thức HTTP/JSON thực tế.
9. **Account Isolation Testing:** Kiểm thử cách ly vùng lưu trữ giữa Guest, User A, và User B.
10. **Offline & Persistence Testing:** Thao tác ngoại tuyến, tắt cưỡng bức ứng dụng (`force-stop`) và kiểm tra tính toàn vẹn dữ liệu.
11. **Regression Testing:** Chạy lại toàn bộ bộ test suites tự động để đảm bảo việc sửa lỗi không gây hỏng hóc các tính năng đã chạy tốt.
12. **Device Compatibility Testing:** Kiểm tra trên Android Emulator thật và đối soát tính khả thi trên thiết bị vật lý.

---

## 5. MÔI TRƯỜNG VÀ THIẾT BỊ KIỂM THỬ (TEST ENVIRONMENTS & DEVICES)

### 5.1. Môi trường Backend & Database
- **Backend Runtime:** Python 3.11.1, FastAPI 0.115+, Uvicorn server chạy cục bộ tại cổng `8000`.
- **Database:** SQLite file tạm / PostgreSQL test instance, nạp dữ liệu mẫu ban đầu qua seed script idempotence.
- **Network Bridge:** Chuyển tiếp cổng qua ADB: `adb reverse tcp:8000 tcp:8000` và `adb reverse tcp:8081 tcp:8081`.

### 5.2. Môi trường Android Emulator
- **Cấu hình 1 (Small_Phone):**
  - Tên AVD: `Small_Phone`
  - Vị trí: `D:\AndroidAVD\avd\Small_Phone.avd`
  - Hệ điều hành: Android 14/15 Preview (API 34/37, x86_64, Google APIs PlayStore)
  - Độ phân giải: 720 x 1280 (Small Screen)
  - Mật độ hiển thị: 320 dpi
  - RAM: 2048 MB
- **Cấu hình 2 (Small_Phone_2):**
  - Tên AVD: `Small_Phone_2`
  - Vị trí: `C:\Users\ASUS\.android\avd\Small_Phone_2.avd`
  - RAM: 1024 MB (Low-memory test scenario)

### 5.3. Kiểm thử trên Thiết bị Vật lý (Physical Device)
- **Quy tắc phân loại:** Nếu tại thời điểm kiểm thử không có thiết bị thật kết nối qua ADB, trạng thái phải ghi nhận trung thực là **`BLOCKED — PHYSICAL DEVICE NOT AVAILABLE`**.
- Cung cấp Checklist UAT thủ công độc lập để các thành viên trong nhóm tự thao tác trên smartphone cá nhân.

---

## 6. CHIẾN LƯỢC DỮ LIỆU KIỂM THỬ (TEST DATA STRATEGY)

| Nhóm Dữ Liệu | Tài Khoản / Dữ Liệu Cụ Thể | Mục Đích Kiểm Thử |
|:---|:---|:---|
| **Tài khoản hợp lệ (Seed User 1)** | `han_danang@danangacy.vn` / `Danang@123` | Kiểm thử Happy Path đăng nhập, nạp lịch trình, làm trắc nghiệm. |
| **Tài khoản hợp lệ (Seed User 2)** | `lan_nguyen@danangacy.vn` / `Danang@123` | Kiểm thử cô lập dữ liệu User A và User B trên cùng hệ thống. |
| **Dữ liệu đăng ký mới** | `test_user_w5@danangacy.vn` / `SecurePass123` | Kiểm thử luồng đăng ký tài khoản mới không trùng lặp. |
| **Tài khoản không hợp lệ** | `wrong_email@danangacy.vn` / `WrongPassword999` | Kiểm thử HTTP 401 Unauthorized và thông báo lỗi. |
| **Lịch trình Biên (Boundary Itinerary)** | 1 ngày (1 chặng) & 3 ngày (8 chặng) | Kiểm thử các ngưỡng giới hạn tối thiểu và tối đa của lịch trình. |
| **Lịch trình Sai khung giờ (Invalid Itinerary)** | Giờ: 05:30 - 06:15 hoặc 21:45 - 22:30 | Kiểm thử từ chối khung giờ ngoài 06:00 - 22:00. |

---

## 7. QUY TRÌNH THỰC THI KIỂM THỬ (TEST EXECUTION PROCESS)
1. **Bước 1 — Chuẩn bị (Pre-test Setup):** Khởi chạy backend Uvicorn, chạy migration DB, khởi động Emulator, thực hiện `adb reverse`.
2. **Bước 2 — Chạy Automated Gates:** Chạy toàn bộ bộ test tự động Node (`npm test`) và Pytest (`pytest`) để bảo đảm baseline kỹ thuật.
3. **Bước 3 — Thực thi Manual / Runtime UAT:** Tương tác trực tiếp trên Emulator theo từng kịch bản test case (Positive, Negative, Boundary, Offline).
4. **Bước 4 — Thu thập Bằng chứng:** Chụp màn hình (`adb shell screencap`), trích xuất giao diện (`uiautomator dump`), ghi log HTTP Uvicorn.
5. **Bước 5 — Ghi nhận Lỗi (Defect Logging):** Khi kết quả thực tế không khớp với kết quả mong đợi, lập bản ghi lỗi vào `bug-log.csv`.
6. **Bước 6 — Sửa lỗi & Retest:** Phân tích nguyên nhân gốc, áp dụng sửa đổi tối thiểu (targeted fix), chạy lại chính test case lỗi và chạy regression suite.
7. **Bước 7 — Tổng hợp Báo cáo:** Xuất bản tài liệu `week5-final-report.md`.

---

## 8. TIÊU CHÍ BẮT ĐẦU VÀ KẾT THÚC (ENTRY & EXIT CRITERIA)

### 8.1. Tiêu chí Bắt đầu (Entry Criteria)
- [x] Mã nguồn Frontend và Backend biên dịch không có lỗi cú pháp (TypeScript 0 errors, Python syntax valid).
- [x] Cơ sở dữ liệu phát triển có thể khởi tạo và seed dữ liệu mẫu thành công.
- [x] Máy ảo Android Emulator khởi động được và ADB nhận diện thiết bị.
- [x] Tài liệu Test Plan và Bảng Test Cases đã được phê duyệt.

### 8.2. Tiêu chí Kết thúc (Exit Criteria)
- [x] 100% test cases đã được thực thi và gán trạng thái rõ ràng (`PASS`, `FAIL`, `BLOCKED`, `NOT RUN`).
- [x] **Zero P0 Blocker:** Không còn lỗi P0 nào tồn đọng làm ứng dụng sập hoặc mất dữ liệu.
- [x] Toàn bộ lỗi P1 đã được khắc phục hoặc có phương án xử lý rõ ràng.
- [x] Các lỗi đã sửa (FIXED) bắt buộc phải vượt qua bài kiểm tra lại (**RETEST PASSED**).
- [x] Bộ kiểm thử hồi quy (Regression Test Suites) đạt tỷ lệ vượt qua 100%.
- [x] Báo cáo cuối cùng phân định minh bạch các tầng kiểm chứng, không có dữ liệu giả mạo.

---

## 9. PHÂN LOẠI MỨC ĐỘ NGHIÊM TRỌNG CỦA LỖI (DEFECT SEVERITY)
- **P0 (Critical / Blocker):** Sập ứng dụng (Crash/ANR), hỏng cơ sở dữ liệu, mất mát dữ liệu người dùng, lỗ hổng bảo mật nghiêm trọng (lộ token/khóa bí mật).
- **P1 (High):** Luồng nghiệp vụ cốt lõi bị gián đoạn không thể hoàn thành, rò rỉ dữ liệu giữa hai tài khoản, lỗi sai lệch trạng thái đồng bộ (False Synced).
- **P2 (Medium):** Chức năng bị lỗi một phần hoặc giao diện hiển thị sai nhưng người dùng vẫn có giải pháp thay thế (workaround).
- **P3 (Low):** Lỗi thẩm mỹ, căn chỉnh lề (layout alignment), chính tả hoặc văn bản hiển thị chưa tối ưu.

---

## 10. PHÂN CÔNG TRÁCH NHIỆM (RESPONSIBILITIES)
- **Senior Mobile QA Lead:** Lập kế hoạch kiểm thử, thiết kế bộ test case, giám sát tiêu chuẩn xác minh, viết báo cáo tổng kết.
- **React Native Test Engineer:** Thực thi các test cases Frontend, kiểm thử trên Android Emulator, kiểm thử Offline và giao diện đa kích thước.
- **FastAPI Integration Tester:** Kiểm thử tích hợp REST API, kiểm thử phân quyền JWT, khóa lạc quan OCC và rà soát backend logs.

---

## 11. RỦI RO VÀ GIẢI PHÁP GIẢM THIỂU (RISKS & MITIGATION)
1. **Rủi ro thiếu thiết bị vật lý thật trong môi trường máy chủ tự động:**
   *Giải pháp:* Đánh dấu trung thực `BLOCKED — PHYSICAL DEVICE NOT AVAILABLE`, đồng thời cung cấp checklist hướng dẫn chi tiết để các thành viên sinh viên tự thực hiện trên smartphone cá nhân.
2. **Rủi ro `adb reverse` giữ kết nối ngay cả khi tắt Wi-Fi trên Emulator:**
   *Giải pháp:* Để kiểm thử mất mạng thật, cần kiểm chứng việc dừng dịch vụ backend hoặc ngắt cổng chuyển tiếp, xác thực thông qua thông báo lỗi timeout/offline trên UI thay vì chỉ nhìn vào biểu tượng Wi-Fi của hệ điều hành.

---

## 12. TẠO PHẨM GIAO NỘP YÊU CẦU (DELIVERABLES)
1. `docs/testing/week5/test-plan.md` (Tài liệu Kế hoạch kiểm thử).
2. `docs/testing/week5/feature-inventory.md` (Bảng khảo sát chức năng hệ thống).
3. `docs/testing/week5/test-cases.csv` (Bảng chi tiết test cases đầy đủ các chiều kiểm thử).
4. `docs/testing/week5/bug-log.csv` (Sổ theo dõi và quản lý lỗi).
5. `docs/testing/week5/execution-matrix.md` (Ma trận kết quả thực thi kiểm thử).
6. `docs/testing/week5/week5-final-report.md` (Báo cáo tổng kết Tuần 5 nộp giảng viên).
