# DANANGACY — HƯỚNG DẪN CHẠY KIỂM THỬ VÀ TRÌNH DIỄN DEMO TUẦN 5
## Môn học: Phát Triển Ứng Dụng Di Động
**Học phần:** Tuần 5 — Testing, Defect Tracking & Remediation
**Dự án:** Ứng Dụng Du Lịch & Di Sản Đà Nẵng (React Native Expo + FastAPI)
**Thời lượng Demo đề xuất:** 3 – 5 phút

---

## 1. TỔNG QUAN BỘ KIỂM THỬ (TEST SUITE OVERVIEW)

Hệ thống kiểm thử DANANGACY bao gồm **2 tầng kiểm thử chính**:
1. **Kiểm thử tự động (Automated Regression Test Suite):**
   - **Frontend (153 Tests):** Chạy trên Node.js Native Test Runner (`node:test`), kiểm thử toàn diện MVVM boundaries, AsyncStorage persistence, Offline Sync, Conflict Resolution và Client Validations.
   - **Backend (68 Tests):** Chạy trên `pytest`, kiểm thử toàn diện REST API, JWT Authentication, Quản lý quyền sở hữu lịch trình, Schema constraints, Version concurrency (OCC), Gamification rewards và Gemini proxy.
   - **Tổng cộng:** **221 / 221 bài kiểm thử tự động vượt qua tuyệt đối (100% PASS)**.
2. **Kiểm thử chấp nhận người dùng (Manual UAT on Android Emulator):**
   - 14 kịch bản UAT trực tiếp trên máy ảo Android API 34 (`Small_Phone`), kết nối Live Backend Uvicorn tại cổng 8000.
   - Đã thu thập và chuẩn hóa **19 ảnh chụp màn hình PNG hợp lệ 100%** (xác thực giải mã qua Pillow).

---

## 2. CHUẨN BỊ MÔI TRƯỜNG TRÊN WINDOWS (ENVIRONMENT SETUP)

### 2.1. Yêu Cầu Tiên Quyết (Prerequisites)
- **Hệ điều hành:** Windows 10 / 11 (64-bit).
- **Node.js:** Phiên bản 18.x trở lên (khuyên dùng Node 20.x hoặc 22.x LTS).
- **Python:** Phiên bản 3.11.x (đã cài đặt môi trường ảo `.venv` trong thư mục `backend/`).
- **PowerShell:** Windows PowerShell 5.1 hoặc PowerShell Core 7.x.
- **Android SDK & Emulator:** Android Studio (đã cấu hình `Small_Phone` hoặc máy ảo tương đương API 30+).

### 2.2. Kiểm Tra Sức Khỏe Môi Trường (Health Check)
Mở cửa sổ PowerShell tại thư mục gốc repository `DANANGACY` và kiểm tra:
```powershell
# 1. Kiểm tra Node.js và npm
node -v
npm -v

# 2. Kiểm tra Python trong backend venv
.\backend\.venv\Scripts\python.exe --version

# 3. Kiểm tra ADB
adb version
```

---

## 3. HƯỚNG DẪN CHẠY KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST EXECUTION)

Nhóm đã đóng gói sẵn script điều khiển thông minh `testing/week5-demo/run-demo.ps1` có giao diện menu trực quan và trả exit code chuẩn mực theo kết quả runner.

### Cách 1: Chạy Tương Tác Qua Menu (Interactive Mode)
```powershell
.\testing\week5-demo\run-demo.ps1
```
Giao diện menu sẽ xuất hiện:
```text
DANANGACY — TUẦN 5 TESTING DEMO RUNNER
Vui lòng chọn mục tiêu kiểm thử:
  [1] Chạy toàn bộ kiểm thử hệ thống (Frontend 153 + Backend 68 = 221 Tests)
  [2] Chỉ chạy Frontend Test Suite (153 node:test across 10 suites)
  [3] Chỉ chạy Backend Pytest Suite (68 pytest across 6 suites)
  [4] Kiểm tra môi trường & công cụ (Health Check Prerequisites)
  [Q] Thoát chương trình
```

### Cách 2: Chạy Tự Động Qua Tham Số (CLI Argument Mode)
- **Chạy toàn bộ 221 bài kiểm thử (Khuyên dùng khi demo):**
  ```powershell
  .\testing\week5-demo\run-demo.ps1 -Target all
  ```
- **Chỉ chạy 153 Frontend Tests:**
  ```powershell
  .\testing\week5-demo\run-demo.ps1 -Target frontend
  ```
- **Chỉ chạy 68 Backend Pytest:**
  ```powershell
  .\testing\week5-demo\run-demo.ps1 -Target backend
  ```

### Cách 3: Chạy Lệnh Gốc Trực Tiếp Bằng Terminal (Raw Commands)
- **Frontend Tests:**
  ```powershell
  cd frontend
  npm run test
  cd ..
  ```
- **Backend Tests:**
  ```powershell
  cd backend
  & .venv/Scripts/python.exe -m pytest -v
  cd ..
  ```

> [!NOTE]
> **Cam Kết An Toàn Dữ Liệu:** Toàn bộ test runner sử dụng cơ chế SQLite In-Memory và Storage Mocks. Không ghi đè hay làm ảnh hưởng đến cơ sở dữ liệu thật của dự án.

---

## 4. DỮ LIỆU KIỂM THỬ & MA TRẬN TEST CASE (TEST DATA & MAPPINGS)

### 4.1. Bộ Dữ Liệu Kiểm Thử Mẫu
Tệp [testing/week5-demo/demo-test-data.json](file:///d:/Phuoc/DUT/ki9/DANANGACY/testing/week5-demo/demo-test-data.json) cung cấp đầy đủ các kịch bản đầu vào:
- **Positive (Hợp lệ):** Tài khoản `han_danang@danangacy.vn` / `Password123!` -> Trả JWT token và 450 điểm thưởng. Lịch trình 2 điểm đến chuẩn.
- **Negative (Lỗi nghiệp vụ):** Mật khẩu sai `WrongPassword999!` -> HTTP 401 Unauthorized. Gửi stale version -> HTTP 409 Conflict. Nộp trùng quiz -> HTTP 400.
- **Empty (Rỗng):** Để trống trường email và mật khẩu -> Client form validation chặn gửi request. Tiêu đề lịch trình khoảng trắng `"   "` -> HTTP 422 Unprocessable Entity.
- **Boundary (Dữ liệu biên):** Mật khẩu 7 ký tự (dưới min 8) bị từ chối; mật khẩu đúng 8 ký tự được chấp nhận. Các điểm đến liền kề thời gian (08:00–10:00 và 10:00–12:00) được chấp nhận; trùng giờ bị từ chối.

### 4.2. Ma Trận Truy Vết Test Case
Chi tiết liên kết từng test case với tệp mã nguồn và assertion được trình bày tại [testing/week5-demo/test-case-mapping.md](file:///d:/Phuoc/DUT/ki9/DANANGACY/testing/week5-demo/test-case-mapping.md).

---

## 5. HƯỚNG DẪN THAO TÁC MANUAL UAT TRÊN ANDROID EMULATOR

Để trình diễn trực quan cho Giảng viên trên thiết bị di động mô phỏng:

### Bước 1: Khởi động Dịch vụ & Máy ảo
Mở 3 tab terminal riêng biệt:
1. **Tab 1 — Backend FastAPI:**
   ```powershell
   cd backend
   & .venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```
2. **Tab 2 — Metro Bundler (Expo):**
   ```powershell
   cd frontend
   npx expo start --localhost --port 8081
   ```
3. **Tab 3 — Android Emulator & ADB Reverse:**
   ```powershell
   # Khởi động máy ảo (nếu chưa bật)
   emulator -avd Small_Phone -gpu host

   # Thiết lập cầu nối mạng vào máy ảo
   adb reverse tcp:8000 tcp:8000
   adb reverse tcp:8081 tcp:8081
   ```

### Bước 2: Kịch bản Demo Xác Thực (Authentication & Validation)
1. **Empty Input (TC-AUTH-03):** Mở màn hình Đăng Nhập, để trống cả Email và Password -> Bấm "ĐĂNG NHẬP" -> Form báo đỏ "Vui lòng nhập email" và chặn gọi mạng.
2. **Sai mật khẩu (TC-AUTH-02):** Nhập `han_danang@danangacy.vn` và pass `SaiPass123` -> Bấm Đăng Nhập -> Nhận thông báo lỗi 401 Unauthorized.
3. **Đăng nhập thành công (TC-AUTH-01):** Nhập đúng `Password123!` -> Đăng nhập thành công, chuyển sang Trang chủ, mở tab Hồ sơ thấy họ tên "Lê Ngọc Hân" và 450 điểm thưởng.

### Bước 3: Kịch bản Demo Ngoại Tuyến (Offline-First & Network Simulation)
1. Trên tab terminal, chạy lệnh ngắt kết nối backend:
   ```powershell
   adb reverse --remove tcp:8000
   ```
2. Trên ứng dụng, chuyển sang tab **Lịch Trình**:
   - Ứng dụng đọc dữ liệu cache từ AsyncStorage mượt mà, hiển thị danh sách lịch trình đã lưu.
   - Hiển thị banner cảnh báo ngoại tuyến, ứng dụng **hoàn toàn không bị văng (no crashes)**.
3. Tái lập kết nối mạng:
   ```powershell
   adb reverse tcp:8000 tcp:8000
   ```
   - Ứng dụng tự động phát hiện mạng và chuyển sang trạng thái sẵn sàng đồng bộ (OCC).

### Bước 4: Kịch bản Demo Đố Vui Di Sản (Gamification Quiz)
1. Mở tab **Khám Phá / Đố Vui Di Sản**.
2. Chọn bài đố "Cầu Rồng & Sông Hàn".
3. Trả lời các câu hỏi trắc nghiệm và bấm nộp bài -> Backend chấm điểm, hiển thị kết quả và cộng điểm thưởng vào ví.

### Bước 5: Kịch bản Demo Sửa Lỗi Giao Diện (BUG-W5-04 Remediation)
1. Mở màn hình Chi tiết lịch trình có nhiều điểm dừng trên thiết bị màn hình nhỏ 720x1280.
2. Cuộn xuống cuối trang: Nút bấm hành động có khoảng đệm an toàn `paddingBottom: Math.max(12, insets.bottom + 8)` thoáng đãng, không bị dính sát mép dưới hay che khuất bởi thanh điều hướng.
3. Mở hình ảnh so sánh [w5_bug04_before_720p.png](file:///d:/Phuoc/DUT/ki9/DANANGACY/docs/testing/week5/evidence/w5_bug04_before_720p.png) và [w5_bug04_after_720p.png](file:///d:/Phuoc/DUT/ki9/DANANGACY/docs/testing/week5/evidence/w5_bug04_after_720p.png) để đối chiếu trực quan.

---

## 6. KỊCH BẢN THUYẾT TRÌNH DEMO TRONG 3–5 PHÚT (SPEAKER DEMO SCRIPT)

Dưới đây là kịch bản gợi ý giúp sinh viên tự tin trình bày trước Giảng viên và Hội đồng:

```
[00:00 - 00:45] PHẦN 1: MỞ ĐẦU & GIỚI THIỆU MA TRẬN TEST CASE
- "Kính thưa Thầy/Cô, để chứng minh kết quả kiểm thử Tuần 5, em xin phép trình diễn quy trình chạy test tự động và kiểm thử chấp nhận người dùng thực tế."
- Mở file test-case-mapping.md: "Nhóm đã thiết kế 53 test cases bao phủ đầy đủ các trường hợp: thuận, lỗi, dữ liệu rỗng, dữ liệu biên và mất mạng."
- Mở demo-test-data.json: "Toàn bộ dữ liệu kiểm thử được chuẩn hóa theo đúng validation nghiệp vụ của ứng dụng."

[00:45 - 01:45] PHẦN 2: CHẠY KIỂM THỬ TỰ ĐỘNG TRÊN TERMINAL
- Mở PowerShell và chạy: .\testing\week5-demo\run-demo.ps1 -Target all
- Thuyết minh khi test đang chạy:
  + "Hệ thống đang thực thi đồng thời 153 bài kiểm thử Frontend qua node:test và 68 bài kiểm thử Backend qua pytest."
  + "Toàn bộ kiểm thử chạy trên môi trường cô lập, sử dụng SQLite in-memory, hoàn toàn không làm sai lệch dữ liệu thật."
- Khi kết quả in ra màu xanh:
  + "Kết quả: 221/221 bài kiểm thử vượt qua tuyệt đối (100% PASS), thời gian thực thi chỉ khoảng 35 giây."

[01:45 - 03:00] PHẦN 3: DEMO TRỰC TIẾP TRÊN ANDROID EMULATOR
- Mở cửa sổ Android Emulator:
  + Demo 1: Bấm Đăng nhập khi để trống -> Client chặn ngay lập tức, không gửi request rác về server.
  + Demo 2: Đăng nhập tài khoản hợp lệ -> Nhận token, cập nhật profile và 450 điểm thưởng.
  + Demo 3: Mở tab Đố vui di sản -> Tải câu hỏi từ Backend API và nộp bài tính điểm.

[03:00 - 04:00] PHẦN 4: DEMO KHẢ NĂNG CHỊU LỖI MẠNG (OFFLINE-FIRST)
- Chạy lệnh: adb reverse --remove tcp:8000
- Mở tab Lịch trình: "Khi du khách mất sóng ngoài thực địa, ứng dụng tự động đọc lịch trình offline từ bộ nhớ tạm, hiển thị banner cảnh báo và không hề bị văng."
- Chạy lại: adb reverse tcp:8000 tcp:8000 -> Ứng dụng tự phục hồi kết nối.

[04:00 - 05:00] PHẦN 5: TRÌNH BÀY SỬA LỖI BUG-W5-04 & KẾT LUẬN
- Mở Slide 8 hoặc ảnh before/after: "Trong đợt test Tuần 5, nhóm phát hiện nút bấm bị cấn sát mép đáy màn hình nhỏ 720p (BUG-W5-04). Nhóm đã sửa component Screen.tsx với safe area padding và retest thành công."
- "Toàn bộ 221 bài kiểm thử hồi quy đều đạt 100% PASS. Nhóm em đã sẵn sàng cho giai đoạn hoàn thiện đồ án tiếp theo!"
```

---

## 7. TỔNG KẾT BÀN GIAO (DELIVERABLES CHECKLIST)
- [x] Script chạy tự động có menu: `testing/week5-demo/run-demo.ps1`
- [x] Hướng dẫn chi tiết: `testing/week5-demo/README-DEMO.md`
- [x] Dữ liệu kiểm thử mẫu: `testing/week5-demo/demo-test-data.json`
- [x] Ma trận ánh xạ test case: `testing/week5-demo/test-case-mapping.md`
- [x] Báo cáo kiểm thử đầy đủ: `presentations/week5/week5-final-report.md`
- [x] Slide thuyết trình 16:9: `presentations/week5/DANANGACY_Week5_Testing_Presentation.pptx`
- [x] 19 ảnh bằng chứng UAT hợp lệ: `presentations/week5/evidence/`
