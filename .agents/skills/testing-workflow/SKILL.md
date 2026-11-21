---
name: testing-workflow
description: >-
  Select, execute, diagnose, and expand automated tests for DANANGACY frontend
  (TypeScript check and node:test) and backend (pytest). Use when running test
  suites, investigating test failures, or verifying regression safety.
---

# DANANGACY Testing & Verification Workflow

Quy trình lựa chọn, thực thi, chẩn đoán lỗi và viết bổ sung kiểm thử tự động cho dự án DANANGACY.

## Khi nào sử dụng Skill này
- Người dùng yêu cầu chạy kiểm thử cho Frontend, Backend hoặc toàn bộ dự án.
- Một bài kiểm thử bị thất bại (`FAIL`) cần phân tích nguyên nhân gốc (Root Cause Analysis).
- Cần viết thêm bài kiểm thử mới sau khi thêm tính năng hoặc sửa lỗi.
- Người dùng gọi trực tiếp lệnh `/testing-workflow`.

## Ranh giới thực thi (Boundaries)
- Không bao giờ sửa bài kiểm thử chỉ để che giấu lỗi logic của mã nguồn ứng dụng.
- Không báo cáo `PASS` nếu lệnh kiểm thử chưa được chạy thực tế trong phiên làm việc hoặc trả về mã thoát khác `0`.
- Phân biệt rõ lỗi do môi trường (ví dụ: thiếu `.venv`, thiếu `node_modules`, PostgreSQL container chưa chạy) với lỗi do mã nguồn.

## Quy trình thực thi (Workflow)

### Bước 1: Xác định phạm vi kiểm thử mục tiêu
Dựa trên yêu cầu của người dùng hoặc phạm vi file vừa thay đổi (`git status --short`), chọn đúng bộ công cụ:

| Phạm vi | Thư mục làm việc | Lệnh thực thi chuẩn | Nội dung kiểm tra |
| :--- | :--- | :--- | :--- |
| **Frontend Typecheck** | `D:\Phuoc\DUT\ki9\DANANGACY\frontend` | `npm run typecheck` | Kiểm tra kiểu tĩnh TypeScript (`tsc --noEmit`). |
| **Frontend Unit & MVVM Tests** | `D:\Phuoc\DUT\ki9\DANANGACY\frontend` | `npm test` | Chạy toàn bộ các tệp kiểm thử được cấu hình trong `frontend/package.json` (`node --test`). |
| **Backend All Tests** | `D:\Phuoc\DUT\ki9\DANANGACY\backend` | `.\.venv\Scripts\python.exe -m pytest` | Chạy toàn bộ test suite backend theo cấu hình `pyproject.toml`. |
| **Backend Targeted Test** | `D:\Phuoc\DUT\ki9\DANANGACY\backend` | `.\.venv\Scripts\python.exe -m pytest tests/<file>.py -k "<pattern>"` | Chạy nhanh một bài hoặc nhóm bài test cụ thể khi đang debug. |

### Bước 2: Thực thi và Thu thập Bằng chứng
Quy trình thực thi và đối soát nghiêm ngặt:
1. **Kiểm tra tệp kiểm thử thực tế:** Đọc `package.json` (`scripts.test`) hoặc `pyproject.toml` để xác định chính xác danh sách tệp kiểm thử thực tế trên ổ đĩa (`frontend/tests/*.test.cjs`, `backend/tests/*.py`). Tuyệt đối không tự suy diễn hoặc gom nhóm thành tên tệp giả.
2. **Chạy test runner:** Thực thi lệnh kiểm thử trong thư mục tương ứng.
3. **Thu thập raw output & exit code:** Ghi nhận đầy đủ mã thoát (exit code), số lượng bài test `pass` / `fail` / `skipped`, và toàn bộ traceback nếu có lỗi.
4. **Đối soát số lượng test theo từng tệp:** Khi có nghi ngờ sai lệch số liệu, chạy kiểm thử độc lập cho từng tệp để đếm chính xác số lượng test của mỗi tệp vật lý.
5. **Bảo mật dữ liệu:** Tuyệt đối không in hoặc lưu trữ JWT token, API key, mật khẩu hoặc dữ liệu cá nhân nhạy cảm trong log đầu ra kiểm thử.

### Bước 3: Chẩn đoán lỗi (Khi có Test Thất bại)
1. **Lỗi tại Frontend (`tests/mvvm.test.cjs`):**
   - Nếu lỗi `Cannot resolve <id> from <file>`: kiểm tra đường dẫn import tương đối trong file TypeScript vừa sửa (bộ nạp tùy chỉnh trong `mvvm.test.cjs` yêu cầu import nội bộ phải phân giải được sang `.ts`, `.tsx` hoặc `index.ts`).
   - Nếu lỗi `View reads model directly` hoặc `Repository depends on presentation`: một câu lệnh `import` đã vi phạm ranh giới MVVM.
2. **Lỗi tại Backend (`pytest`):**
   - Hầu hết các bài test trong `test_itineraries.py` và `test_itinerary_schema.py` sử dụng SQLite file tạm thông qua fixture trong `tests/conftest.py`.
   - Riêng các bài test kiểm tra kết nối cấu hình thực tế trong `test_database.py` có thể phụ thuộc vào cấu hình `.env` và dịch vụ PostgreSQL.
3. **Lỗi tại Module Quiz & Gamification:**
   - Nếu test kiểm tra ID đáp án thất bại: kiểm tra xem có đang suy diễn `position + 1` thay vì đọc ID thực tế từ `BackendQuiz` hay không.
   - Nếu test chống gian lận ném `409 IntegrityError` thay vì `400 Bad Request`: kiểm tra xem `selected_option_id` đã được xác thực sự tồn tại trong câu hỏi trước khi chèn vào `QuizAttemptAnswer` hay chưa.
   - Nếu test đồng thời ném lỗi khóa cơ sở dữ liệu (`OperationalError: database is locked`): phân biệt lỗi do SQLite file-locking đơn luồng trong môi trường test với lỗi logic transaction.

### Bước 4: Báo cáo Kết quả Kiểm thử & Ma trận Bằng chứng (Evidence Matrix)
Báo cáo kiểm thử phải tách bạch rõ ràng giữa **Phương pháp xác minh (Verification Tier)** và **Trạng thái kiểm thử (Test Status)**:

#### 1. Phân định Cấp độ Xác minh (Verification Tiers):
- `PHYSICAL DEVICE VERIFIED`: Thao tác trực tiếp trên thiết bị di động vật lý (Android/iOS thật), có ảnh chụp/video/log thiết bị.
- `EMULATOR VERIFIED`: Thao tác trực tiếp trên runtime Android Emulator thật, có ảnh chụp màn hình/UI dump (đối với các kịch bản thao tác cục bộ như Guest mode hoặc offline storage, không bắt buộc phải có Backend HTTP log).
- `LIVE BACKEND VERIFIED`: Gọi HTTP request thực tế qua mạng đến máy chủ FastAPI đang chạy thật qua Uvicorn (phân biệt rõ với TestClient nội bộ).
- `BACKEND PYTEST/TESTCLIENT VERIFIED`: Kiểm thử backend qua test runner `pytest` và `TestClient` (xác thực endpoint, schema và transaction trong môi trường test cô lập).
- `AUTOMATED NODE VERIFIED`: Chạy qua test runner tự động (`node:test`) với mock storage/network.
- `SOURCE AUDITED`: Được kiểm chứng logic qua đọc và đối soát mã nguồn.

#### 2. Trạng thái Kiểm thử:
- `PASS`: Đạt toàn bộ assertion trong phạm vi phương pháp xác minh tương ứng.
- `FAIL`: Không đạt một hoặc nhiều assertion.
- `BLOCKED`: Bị nghẽn do môi trường, thiếu phụ thuộc hoặc rào cản kỹ thuật.
- `NOT RUN`: Chưa được thực thi (đặc biệt khi chưa chạy trên Emulator thì phải ghi rõ `NOT VERIFIED ON EMULATOR`). Tuyệt đối không đánh đồng `NOT RUN` hoặc `AUTOMATED NODE` thành `EMULATOR PASS`.

#### 3. Bảng Mẫu Evidence Matrix (Template tái sử dụng):
| ID | Kịch Bản Kiểm Thử | Thao Tác Emulator? | HTTP Log Backend? | Bằng Chứng / Artifacts | Cấp Độ Xác Minh | Trạng Thái |
|:---:|:---|:---:|:---:|:---|:---:|:---:|
| TC-01 | Guest mode initial load | CÓ | Không (local) | `screenshot_01.png` | `EMULATOR VERIFIED` | **PASS** |
| TC-02 | Remote Fetch 200 | CÓ | CÓ (`GET 200`) | `screenshot_02.png`, Uvicorn log | `EMULATOR VERIFIED` + `LIVE BACKEND` | **PASS** |
| TC-03 | Offline mutation queue | KHÔNG | Không | `itinerary_crud.test.cjs` | `AUTOMATED NODE VERIFIED` | **PASS (Mock)** |
| TC-04 | Restart sau logout | KHÔNG | Không | Logic `isActuallySignedIn` | `SOURCE AUDITED` | **NOT RUN ON EMULATOR** |

### Bước 5: Nguyên tắc Mock khi Kiểm thử Dịch vụ Bên thứ ba (AI & External APIs)
- Tuyệt đối không thực hiện lệnh gọi mạng thực tế tới các API trả phí hoặc dịch vụ bên ngoài trong unit test tự động.
- **Ở Frontend:** Mock `global.fetch` trong khối `try-finally` để kiểm thử độc lập 3 kịch bản: phản hồi thành công từ backend, server trả mã lỗi HTTP, và ngoại lệ mạng (offline).
- **Ở Backend:** Sử dụng `unittest.mock.patch("urllib.request.urlopen")` với context manager giả lập (`MockResponse`) để kiểm tra nhanh các nhánh thành công, mã lỗi dịch vụ (HTTP 402) và lỗi kết nối mạng/DNS mà không bị chậm do timeout.

### Bước 6: Quy chuẩn Kiểm thử Hợp đồng & Tích hợp (Contract Integration Testing)
- Đối với các luồng dữ liệu hai chiều có ánh xạ khóa chính (như Quiz & Options): Bắt buộc kiểm thử với bộ dữ liệu kiểm định có khóa chính không liên tiếp (VD: Question ID 1005, 2042; Option ID 7701..7703) và thứ tự hiển thị bị đảo lộn so với database để đảm bảo client và server không suy diễn vị trí mảng.
- Báo cáo kết quả kiểm thử hợp đồng phải liên kết chặt chẽ với bảng Evidence Matrix ở Bước 4, không tạo kết quả kiểm thử giả định và không khẳng định mức độ sẵn sàng production khi chưa kiểm thử trên thiết bị độc lập.
