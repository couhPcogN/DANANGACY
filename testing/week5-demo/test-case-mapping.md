# DANANGACY — TEST CASE TRACEABILITY & DEMO MAPPING (WEEK 5)

Tài liệu liên kết và truy vết chi tiết giữa **53 Ca Kiểm Thử Tuần 5 (Test Cases)** với các tệp mã nguồn kiểm thử tự động (**Automated Test Suites: 153 Frontend Tests, 68 Backend Tests**) và các kịch bản kiểm thử chấp nhận người dùng (**Manual UAT Scenarios trên Android Emulator**).

---

## 1. BẢNG LIÊN KẾT 8 TEST CASES TIÊU BIỂU DÀNH CHO TRÌNH DIỄN (DEMO HIGHLIGHTS)

Khi thực hiện thuyết trình demo trong **3–5 phút**, người trình bày nên chọn **8 ca kiểm thử tiêu biểu** dưới đây để minh họa trọn vẹn các khía cạnh: Kiểm thử chức năng thuận (Positive), ca lỗi (Negative), rỗng (Empty), phân quyền, đồng bộ xung đột (OCC), mất kết nối mạng (Offline) và sửa lỗi giao diện (Bug Fix).

```
+---------------+----------------------------------------------------+--------------------------+-------------+
| Test ID       | Kịch Bản Nghiệp Vụ                                  | Tệp Kiểm Thử / Method    | Trạng Thái  |
+---------------+----------------------------------------------------+--------------------------+-------------+
| TC-AUTH-01    | Đăng nhập thành công với tài khoản mẫu hợp lệ      | test_auth_destinations...| PASS (100%) |
| TC-AUTH-02    | Đăng nhập thất bại khi nhập sai mật khẩu (401)     | auth_service.test.cjs    | PASS (100%) |
| TC-AUTH-03    | Client validation chặn submit khi để trống input   | auth_service.test.cjs    | PASS (100%) |
| TC-ITIN-01    | Tạo lịch trình du lịch mới kèm danh sách điểm đến  | test_itineraries.py      | PASS (100%) |
| TC-SYNC-01    | Phát hiện xung đột phiên bản đồng thời (OCC 409)   | itinerary_conflict...cjs | PASS (100%) |
| TC-QUIZ-01    | Tải câu hỏi di sản văn hóa Đà Nẵng & tính điểm     | quiz_service.test.cjs    | PASS (100%) |
| TC-NET-01     | Đọc dữ liệu cache ngoại tuyến khi mất kết nối      | itinerary_sync.test.cjs  | PASS (100%) |
| TC-UI-01      | Khắc phục nút bấm cấn đáy trên màn hình nhỏ        | Screen.tsx (BUG-W5-04)   | PASS (UAT)  |
+---------------+----------------------------------------------------+--------------------------+-------------+
```

---

### CHI TIẾT 8 CA KIỂM THỬ TIÊU BIỂU

#### 1. TC-AUTH-01 — Đăng Nhập Thành Công (Positive / P0)
- **Kịch bản:** Người dùng nhập email `han_danang@danangacy.vn` và mật khẩu `Password123!`.
- **Tệp kiểm thử:**
  - Backend: `backend/tests/test_auth_destinations_favorites.py::test_auth_register_login_profile`
  - Frontend: `frontend/tests/auth_service.test.cjs` (Subtest 2)
  - UAT: `docs/testing/week5/evidence/w5_uat_06_auth_success.png`
- **Assertion thực tế:**
  ```python
  response = client.post("/api/auth/login", json={"email": "han_danang@danangacy.vn", "password": "Password123!"})
  assert response.status_code == 200
  assert "access_token" in response.json()
  ```
- **Kết quả kỳ vọng (Expected):** HTTP 200 OK, trả JWT access token, lưu vào AsyncStorage, cập nhật họ tên "Lê Ngọc Hân" và 450 điểm thưởng lên giao diện.
- **Kết quả thực tế (Actual):** Khớp 100% kỳ vọng.
- **Đánh giá:** **PASS** (`LIVE BACKEND VERIFIED` & `EMULATOR VERIFIED`).

---

#### 2. TC-AUTH-02 — Đăng Nhập Sai Mật Khẩu (Negative / P0)
- **Kịch bản:** Người dùng nhập đúng email nhưng mật khẩu sai `WrongPassword999!`.
- **Tệp kiểm thử:**
  - Frontend: `frontend/tests/auth_service.test.cjs` (Subtest 3)
  - UAT: `docs/testing/week5/evidence/w5_uat_05_auth_wrong_password.png`
- **Assertion thực tế:**
  ```javascript
  await assert.rejects(
    async () => authService.login("han_danang@danangacy.vn", "WrongPassword999!"),
    (err) => err.status === 401 || err.message.includes("401")
  );
  ```
- **Kết quả kỳ vọng (Expected):** Backend từ chối với mã HTTP 401 Unauthorized, không cấp token, client hiển thị thông báo lỗi bảo mật đỏ.
- **Kết quả thực tế (Actual):** Khớp 100% kỳ vọng.
- **Đánh giá:** **PASS** (`AUTOMATED NODE VERIFIED` & `EMULATOR VERIFIED`).

---

#### 3. TC-AUTH-03 — Để Trống Thông Tin Đăng Nhập (Empty Input / P1)
- **Kịch bản:** Người dùng nhấn nút "Đăng Nhập" khi cả hai ô Email và Password đều đang để trống.
- **Tệp kiểm thử:**
  - Frontend: `frontend/tests/auth_service.test.cjs`
  - UAT: `docs/testing/week5/evidence/w5_uat_04_auth_empty_input.png`
- **Cơ chế Client Validation:** Form hook kiểm tra `!email.trim() || !password.trim()` và đặt cờ lỗi `errors.email = "Vui lòng nhập email"`, chặn hoàn toàn việc gọi API mạng.
- **Kết quả kỳ vọng (Expected):** Client chặn submit ngay tức thì, viền đỏ hiển thị dưới các trường nhập, 0 request HTTP phát sinh đến server.
- **Kết quả thực tế (Actual):** Khớp 100% kỳ vọng.
- **Đánh giá:** **PASS** (`EMULATOR VERIFIED`).

---

#### 4. TC-ITIN-01 — Tạo Lịch Trình Mới Kèm Điểm Đến (Positive / P0)
- **Kịch bản:** Người dùng tạo lịch trình "Khám Phá Di Sản Đà Nẵng 2 Ngày" gồm 2 điểm dừng (Chùa Linh Ứng và Cầu Rồng).
- **Tệp kiểm thử:**
  - Backend: `backend/tests/test_itineraries.py::test_create_list_and_get_are_persisted`
  - Frontend: `frontend/tests/itinerary_crud.test.cjs` (Subtests 1-10)
- **Assertion thực tế:**
  ```python
  res = client.post("/api/itineraries", json=payload, headers=auth_headers)
  assert res.status_code == 201
  data = res.json()
  assert data["title"] == payload["title"]
  assert len(data["stops"]) == 2
  assert data["version"] == 1
  ```
- **Kết quả kỳ vọng (Expected):** HTTP 201 Created, tạo thành công bản ghi trong database kèm stops có thứ tự `order_index` chuẩn, gán `version = 1`.
- **Kết quả thực tế (Actual):** Khớp 100% kỳ vọng.
- **Đánh giá:** **PASS** (`BACKEND PYTEST VERIFIED`).

---

#### 5. TC-SYNC-01 — Phát Hiện Xung Đột Đồng Thời OCC (Concurrency Conflict / P0)
- **Kịch bản:** Du khách chỉnh sửa lịch trình khi đang mất mạng (offline). Trong lúc đó, một phiên khác đã cập nhật lịch trình trên máy chủ lên `version: 2`. Khi có mạng lại, thiết bị offline gửi bản cập nhật với `version: 1`.
- **Tệp kiểm thử:**
  - Backend: `backend/tests/test_itineraries.py::test_optimistic_locking_version_semantics`
  - Frontend: `frontend/tests/itinerary_conflict.test.cjs` (Subtests 1-12)
- **Assertion thực tế:**
  ```python
  # Gửi stale version
  conflict_res = client.patch(f"/api/itineraries/{itin_id}", json={"title": "Stale", "version": 1}, headers=auth_headers)
  assert conflict_res.status_code == 409
  assert "Version conflict" in conflict_res.json()["detail"]
  ```
- **Kết quả kỳ vọng (Expected):** Backend chặn việc ghi đè mù quáng với mã HTTP 409 Conflict. Frontend bắt lỗi 409 và mở `ConflictResolutionModal` cho người dùng so sánh 2 phiên bản.
- **Kết quả thực tế (Actual):** Khớp 100% kỳ vọng.
- **Đánh giá:** **PASS** (`AUTOMATED NODE VERIFIED` & `BACKEND PYTEST VERIFIED`).

---

#### 6. TC-QUIZ-01 — Đố Vui Di Sản Văn Hóa Đà Nẵng (Positive / P1)
- **Kịch bản:** Người dùng tham gia trả lời câu hỏi đố vui về Di sản Văn hóa Đà Nẵng và nhận điểm thưởng.
- **Tệp kiểm thử:**
  - Backend: `backend/tests/test_gamification_rewards.py::test_quiz_flow_and_point_award`
  - Frontend: `frontend/tests/quiz_service.test.cjs` (Subtests 1-8)
  - UAT: `docs/testing/week5/evidence/w5_uat_12_quiz_screen.png`
- **Assertion thực tế:**
  ```javascript
  const payload = buildQuizSubmissionPayload(quiz, answers);
  assert.strictEqual(payload.answers.length, quiz.questions.length);
  assert.strictEqual(payload.answers[0].question_id, 101);
  ```
- **Kết quả kỳ vọng (Expected):** Tải đúng câu hỏi từ backend, tính điểm trên server (chống gian lận phía client), cộng điểm thưởng và ngăn chặn việc nộp trùng lặp (`BUG-W5-03` remediation).
- **Kết quả thực tế (Actual):** Khớp 100% kỳ vọng.
- **Đánh giá:** **PASS** (`LIVE BACKEND VERIFIED` & `EMULATOR VERIFIED`).

---

#### 7. TC-NET-01 — Khả Năng Ngoại Tuyến Khi Mất Mạng (Offline-First / P0)
- **Kịch bản:** Ngắt kết nối mạng thật đến backend Uvicorn (`adb reverse --remove tcp:8000`), người dùng mở tab Lịch trình.
- **Tệp kiểm thử:**
  - Frontend: `frontend/tests/itinerary_sync.test.cjs`
  - UAT: `docs/testing/week5/evidence/w5_uat_10_offline_itinerary.png`
- **Kết quả kỳ vọng (Expected):** Ứng dụng tự động chuyển sang đọc cache từ AsyncStorage, giao diện hiển thị banner cảnh báo ngoại tuyến, danh sách lịch trình đã lưu vẫn hiển thị đầy đủ, ứng dụng không bị crash.
- **Kết quả thực tế (Actual):** Khớp 100% kỳ vọng.
- **Đánh giá:** **PASS** (`EMULATOR VERIFIED`).

---

#### 8. TC-UI-01 / BUG-W5-04 — Khắc Phục Lỗi Nút Bấm Cấn Đáy (UI Remediation / P3)
- **Kịch bản:** Kiểm tra nút hành động "Lưu lịch trình / Đăng ký" trên màn hình nhỏ 720x1280 (Small Phone).
- **Mã nguồn đã sửa:** `frontend/src/shared/components/layout/Screen.tsx`
  ```tsx
  // Trước khi sửa:
  paddingBottom: Math.max(8, insets.bottom),
  // Sau khi sửa:
  paddingBottom: Math.max(12, insets.bottom + 8),
  ```
- **Bằng chứng đối soát:**
  - Trước khi sửa: `docs/testing/week5/evidence/w5_bug04_before_720p.png` (Nút bấm dính mép đáy 0px).
  - Sau khi sửa: `docs/testing/week5/evidence/w5_bug04_after_720p.png` (Nút bấm có khoảng đệm an toàn thoáng đãng).
- **Kết quả kiểm thử hồi quy:** Chạy lại 153 Frontend tests và 68 Backend tests -> **100% PASS**.
- **Đánh giá:** **PASS / FIXED / RETESTED** (`EMULATOR VERIFIED`).

---

## 2. MA TRẬN PHÂN BỔ 53 TEST CASES VÀO TEST SUITES VẬT LÝ

| Nhóm Module | Số Lượng TC | Tệp Kiểm Thử Tương Ứng | Loại Xác Minh (Verification Tier) | Trạng Thái |
| :--- | :---: | :--- | :--- | :---: |
| **Authentication (TC-AUTH-01..12)** | 12 | `frontend/tests/auth_service.test.cjs`<br>`backend/tests/test_auth_destinations_favorites.py` | `EMULATOR VERIFIED`<br>`BACKEND PYTEST VERIFIED` | **12/12 PASS** |
| **Guest Mode (TC-GUEST-01..02)** | 2 | `frontend/tests/guest_user_flow.test.cjs` | `EMULATOR VERIFIED`<br>`AUTOMATED NODE VERIFIED` | **2/2 PASS** |
| **Itinerary CRUD (TC-ITIN-01..10)** | 10 | `frontend/tests/itinerary_crud.test.cjs`<br>`backend/tests/test_itineraries.py` | `BACKEND PYTEST VERIFIED`<br>`AUTOMATED NODE VERIFIED` | **10/10 PASS** |
| **Offline & Sync (TC-SYNC-01..08)** | 8 | `frontend/tests/itinerary_sync.test.cjs`<br>`frontend/tests/itinerary_conflict.test.cjs` | `AUTOMATED NODE VERIFIED`<br>`BACKEND PYTEST VERIFIED` | **8/8 PASS** |
| **Weather (TC-WEATH-01..02)** | 2 | `frontend/tests/weather_gemini.test.cjs`<br>`backend/tests/test_weather_and_ai.py` | `AUTOMATED NODE VERIFIED`<br>`BACKEND PYTEST VERIFIED` | **2/2 PASS** |
| **Gemini AI (TC-AI-01..03)** | 3 | `frontend/tests/weather_gemini.test.cjs`<br>`backend/tests/test_weather_and_ai.py` | `AUTOMATED NODE VERIFIED`<br>`BACKEND PYTEST VERIFIED` | **3/3 PASS** |
| **Quiz & Gamification (TC-QUIZ-01..06)** | 6 | `frontend/tests/quiz_service.test.cjs`<br>`backend/tests/test_gamification_rewards.py` | `EMULATOR VERIFIED`<br>`BACKEND PYTEST VERIFIED` | **6/6 PASS** |
| **Network Failure (TC-NET-01..02)** | 2 | `frontend/tests/itinerary_sync.test.cjs`<br>`docs/testing/week5/evidence/w5_uat_10_*.png` | `EMULATOR VERIFIED`<br>`LIVE BACKEND VERIFIED` | **2/2 PASS** |
| **UI & Display Compatibility (TC-UI-01..02)** | 2 | `frontend/src/shared/components/layout/Screen.tsx`<br>`w5_bug04_*.png` & `w5_uat_display2_*.png` | `EMULATOR VERIFIED`<br>`DISPLAY CONFIGURATION VERIFIED` | **2/2 PASS** |
| **Device Compatibility (TC-DEVICE-01)** | 1 | `docs/testing/week5/execution-matrix.md` (Section 5) | `PHYSICAL DEVICE VERIFIED` | **BLOCKED** |
| **TỔNG CỘNG** | **53** | **16 tệp test vật lý (10 Frontend, 6 Backend)** | **Đa tầng (Multi-tier Verification)** | **52 PASS / 1 BLOCKED** |

---

## 3. BẢO ĐẢM TÍNH ĐỘC LẬP DỮ LIỆU (DATABASE SAFETY GUARANTEE)

Toàn bộ các ca kiểm thử tự động đều tuân thủ nguyên tắc an toàn dữ liệu tuyệt đối:
- **Frontend Tests (`node:test`):** Sử dụng các module mock độc lập cho `AsyncStorage` và mạng (`global.fetch`), dữ liệu lưu trong bộ nhớ tạm (RAM) và tự động giải phóng khi tiến trình test kết thúc.
- **Backend Tests (`pytest`):** Sử dụng SQLite in-memory (`sqlite:///:memory:`) hoặc cơ sở dữ liệu test riêng biệt, mỗi test case được cô lập trong một transaction hoặc rollback tự động sau khi assert.
- **Cam kết:** **Hoàn toàn không ghi đè, không sửa đổi và không ảnh hưởng đến cơ sở dữ liệu môi trường thật (Production / Staging Data).**
