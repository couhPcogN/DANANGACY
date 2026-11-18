---
name: backend-api
description: >-
  Design, implement, or modify FastAPI routes, Pydantic v2 schemas, SQLAlchemy 2.0
  models, repository/service logic, and Alembic migrations in backend/. Use when
  building or updating REST APIs, database schemas, or domain validation in the
  DANANGACY backend.
---

# Backend API & Database Development Workflow

Quy trình chuẩn để thiết kế, triển khai và kiểm thử các thay đổi tại thư mục `backend/` của dự án DANANGACY.

## Khi nào sử dụng Skill này
- Tạo mới hoặc chỉnh sửa REST API endpoint trong `backend/app/api/routes/`.
- Cập nhật hoặc thêm mới Pydantic request/response schemas trong `backend/app/schemas/`.
- Cài đặt logic nghiệp vụ, truy vấn cơ sở dữ liệu trong `backend/app/services/` và `backend/app/repositories/`.
- Thay đổi cấu trúc bảng SQLAlchemy trong `backend/app/models/` hoặc viết migration trong `backend/migrations/versions/`.

## Đầu vào kỳ vọng (Inputs)
- Đặc tả endpoint (HTTP method, path, query/body format, status codes) hoặc yêu cầu thay đổi bảng dữ liệu/logic nghiệp vụ tại `backend/`.

## Quy trình thực thi (Workflow)

### Bước 1: Nạp tri thức kiến trúc & miền nghiệp vụ Backend (Progressive Disclosure)
- Đọc tài liệu tham chiếu [backend-domain.md](./references/backend-domain.md) để nắm rõ kiến trúc 4 tầng, lược đồ 15 bảng nghiệp vụ với khóa chính số nguyên (`IntegerPrimaryKey`), cơ chế xử lý múi giờ và các ràng buộc lịch trình.
- Kiểm tra các file liên quan trong `backend/app/` trước khi thực hiện thay đổi.

### Bước 2: Cập nhật tầng Model & Migration (Nếu có thay đổi Schema DB)
- Khi thêm hoặc sửa model trong `backend/app/models/`:
  - Kế thừa `Base`, `IntegerPrimaryKey` (khóa chính `int` tự tăng) và `Timestamps` (nếu cần `created_at`, `updated_at`) từ `app/models/common.py`.
  - Khai báo kiểu bằng cú pháp SQLAlchemy 2.0 (`Mapped[...]`, `mapped_column(...)`).
  - Xuất model mới trong `backend/app/models/__init__.py`.
  - Tạo và kiểm tra script Alembic migration trong `backend/migrations/versions/` đảm bảo cả chiều `upgrade()` và `downgrade()` an toàn dữ liệu.

### Bước 3: Định nghĩa Pydantic Schemas (`app/schemas/`)
- Đối với payload tạo mới hoặc cập nhật (`Create` / `Update` schemas):
  - Sử dụng `model_config = ConfigDict(extra="forbid")` để từ chối các trường lạ.
  - Ràng buộc rõ giới hạn dữ liệu bằng `Field(...)`, `StringConstraints(...)` và `@model_validator`.
- Đối với payload trả về (`Read` schemas):
  - Sử dụng `model_config = ConfigDict(from_attributes=True)`.

### Bước 4: Cài đặt Repository & Service (`app/repositories/`, `app/services/`)
- **Repository:** Chứa các câu truy vấn SQLAlchemy (`select`, `where`, `with_for_update`), luôn lọc theo `owner_uid` và `deleted_at.is_(None)` (đối với bảng hỗ trợ xóa mềm).
- **Service:**
  - Kiểm tra toàn bộ quy tắc miền nghiệp vụ (như `validate_schedule`, kiểm tra sự tồn tại và trạng thái của `Destination`, kiểm tra xung đột `version`).
  - Thực thi thay đổi dữ liệu bên trong ngữ cảnh giao dịch `with self.session.begin():` để đảm bảo tính nguyên tử (rollback toàn bộ nếu có lỗi ràng buộc).
  - Ném các ngoại lệ miền từ `app/core/exceptions.py` (`InvalidScheduleError` → `422`, `ItineraryNotFoundError` → `404`, `ItineraryConflictError` → `409`).

### Bước 5: Khai báo Route & Xác minh bằng Pytest
1. Đăng ký endpoint trong `app/api/routes/` với mã trạng thái HTTP chuẩn (`201` cho POST tạo mới, `200` cho GET/PATCH, `204` cho DELETE) và gắn vào `app/api/router.py`.
2. Chạy bộ kiểm thử tự động của Backend:
   ```powershell
   Set-Location d:\Phuoc\DUT\ki9\DANANGACY\backend; .\.venv\Scripts\python.exe -m pytest
   ```
3. **Xử lý lỗi:**
   - Nếu gặp lỗi kết nối PostgreSQL trong `test_database.py`: kiểm tra biến môi trường trong `backend/.env` và trạng thái container PostgreSQL, không tự ý xóa hoặc skip bài test.

## Đầu ra kỳ vọng (Outputs)
- Danh sách các file đã tạo hoặc cập nhật trong `backend/`.
- Kết quả thực thi `pytest` xác nhận các bài kiểm thử hiện có và bài kiểm thử mới đều vượt qua.
