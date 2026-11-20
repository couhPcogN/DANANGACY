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
- Chạy lệnh kiểm thử trong thư mục tương ứng.
- Ghi nhận đầy đủ mã thoát (exit code), số lượng bài test `pass` / `fail`, và toàn bộ traceback nếu có lỗi.

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

### Bước 4: Báo cáo Kết quả Kiểm thử
Báo cáo rõ ràng theo bảng:
- **Bộ kiểm thử đã chạy** | **Lệnh thực tế** | **Trạng thái (`PASS` / `FAIL` / `UNVERIFIED`)** | **Chi tiết số lượng test & Nguyên nhân lỗi (nếu có)**.

### Bước 5: Nguyên tắc Mock khi Kiểm thử Dịch vụ Bên thứ ba (AI & External APIs)
- Tuyệt đối không thực hiện lệnh gọi mạng thực tế tới các API trả phí hoặc dịch vụ bên ngoài trong unit test tự động.
- **Ở Frontend:** Mock `global.fetch` trong khối `try-finally` để kiểm thử độc lập 3 kịch bản: phản hồi thành công từ backend, server trả mã lỗi HTTP, và ngoại lệ mạng (offline).
- **Ở Backend:** Sử dụng `unittest.mock.patch("urllib.request.urlopen")` với context manager giả lập (`MockResponse`) để kiểm tra nhanh các nhánh thành công, mã lỗi dịch vụ (HTTP 402) và lỗi kết nối mạng/DNS mà không bị chậm do timeout.

### Bước 6: Quy chuẩn Kiểm thử Hợp đồng & Tích hợp (Contract Integration Testing)
- Đối với các luồng dữ liệu hai chiều có ánh xạ khóa chính (như Quiz & Options): Bắt buộc kiểm thử với bộ dữ liệu kiểm định có khóa chính không liên tiếp (VD: Question ID 1005, 2042; Option ID 7701..7703) và thứ tự hiển thị bị đảo lộn so với database để đảm bảo client và server không suy diễn vị trí mảng.
- Khi báo cáo kết quả kiểm thử, phải phân định minh bạch các cấp độ kiểm chứng:
  - **Unit Test PASS:** Đã kiểm tra logic hàm/phương thức độc lập.
  - **Contract / Integration Test PASS:** Đã kiểm tra schema, payload mapping và giao dịch qua API TestClient.
  - **Manual Device Test UNVERIFIED:** Chưa kiểm chứng trực tiếp trên thiết bị Android/iOS vật lý hoặc Expo emulator.
