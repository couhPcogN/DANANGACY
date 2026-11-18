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
| **Frontend Unit & MVVM Tests** | `D:\Phuoc\DUT\ki9\DANANGACY\frontend` | `npm test` | Chạy `node --test tests/mvvm.test.cjs` (16 bài test: store, layout, date, explore, itinerary, weather, quiz, navigation, persistence, MVVM AST boundaries). |
| **Backend All Tests** | `D:\Phuoc\DUT\ki9\DANANGACY\backend` | `.\.venv\Scripts\python.exe -m pytest` | Chạy toàn bộ 4 file test (`test_database.py`, `test_integer_ids.py`, `test_itineraries.py`, `test_itinerary_schema.py`). |
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

### Bước 4: Báo cáo Kết quả Kiểm thử
Báo cáo rõ ràng theo bảng:
- **Bộ kiểm thử đã chạy** | **Lệnh thực tế** | **Trạng thái (`PASS` / `FAIL` / `UNVERIFIED`)** | **Chi tiết số lượng test & Nguyên nhân lỗi (nếu có)**.
