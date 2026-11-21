---
trigger: glob
globs: "**/backend/**, backend/**"
description: "Architectural, SQLAlchemy 2.0, schema, and itinerary domain constraints for DANANGACY FastAPI backend."
---

# Backend Constraints (`backend/`)

Các ràng buộc bắt buộc khi đọc, tạo mới hoặc chỉnh sửa mã nguồn trong `backend/`:

## 1. Phân tầng kiến trúc & Cơ sở dữ liệu
- Tuân thủ luồng phân tầng: **Routes (`app/api/routes/`) → Services (`app/services/`) → Repositories (`app/repositories/`) → Models (`app/models/`)**.
- Sử dụng **SQLAlchemy 2.0** với khai báo kiểu tường minh (`Mapped`, `mapped_column`).
- Mọi bảng nghiệp vụ kế thừa khóa chính số nguyên tự tăng (`IntegerPrimaryKey` trong `app/models/common.py`, revision Alembic `0003_integer_primary_keys`). Không quay lại sử dụng UUID làm khóa chính cho bảng nghiệp vụ.

## 2. Ràng buộc nghiệp vụ Lịch trình (`Itinerary Rules`)
Mọi thao tác tạo mới (`POST /api/v1/itineraries`) và cập nhật (`PATCH /api/v1/itineraries/{id}`) qua `app/schemas/itinerary.py` và `app/services/itinerary_service.py` phải đảm bảo:
- **Thời lượng chuyến đi (`duration`):** Số nguyên từ `1` đến `3` ngày.
- **Số lượng điểm dừng (`stops`):** Từ `1` đến tối đa `8` điểm dừng (`MAX_STOPS = 8`).
- **Ngày của điểm dừng (`day`):** Số nguyên từ `1` đến `duration`.
- **Thời lượng ghé thăm:** Mỗi điểm dừng phải có `start < end` và kéo dài tối thiểu `30` phút (`MIN_VISIT_MINUTES = 30`).
- **Khung giờ hoạt động:** `start` và `end` phải đúng định dạng `HH:mm` và nằm trong khoảng `06:00` đến `22:00` (theo múi giờ `Asia/Ho_Chi_Minh`, lưu xuống DB ở dạng UTC).
- **Không trùng giờ:** Các điểm dừng trong cùng một ngày (`day`) không được chồng lấn thời gian (`stop.start < previous_end`), nhưng cho phép hai điểm dừng nối tiếp nhau (`end` điểm trước bằng `start` điểm sau) hoặc cùng `place_id` ở các ngày/khung giờ không giao nhau.
- **Tính hợp lệ của địa điểm:** Mọi `place_id` phải tồn tại trong bảng `destinations` và không ở trạng thái `"ARCHIVED"`.

## 3. Toàn vẹn Giao dịch, Xóa mềm & Optimistic Locking
- Các request schema tạo/sửa phải giữ `ConfigDict(extra="forbid")`.
- Thao tác xóa (`DELETE /api/v1/itineraries/{id}`) là **xóa mềm** (cập nhật `deleted_at` và tăng `version`), tuyệt đối không xóa cứng bản ghi `Itinerary` khỏi cơ sở dữ liệu.
- Khi cập nhật (`PATCH`), nếu client gửi kèm `version`, phải kiểm tra khớp với `itinerary.version` hiện tại (trả về lỗi `409 Conflict` qua `ItineraryConflictError` nếu lệch version) và luôn tăng `version += 1` sau mỗi lần sửa/xóa.

## 4. Quản lý Khóa API & Bảo vệ Dịch vụ Bên ngoài
- Khóa bí mật của các dịch vụ bên thứ ba (như Gemini API) phải được quản lý an toàn qua biến môi trường phía server, kiểu `SecretStr` (hoặc Secret Manager), tuyệt đối không ghi log và không trả về phía client.
- Mọi lệnh gọi dịch vụ bên ngoài phải cấu hình thời gian chờ (timeout) hợp lý và có giải pháp ứng phó sự cố (graceful degradation) khi dịch vụ gián đoạn, tránh gây nghẽn luồng xử lý của server.

## 5. Xác thực Chấm điểm Quiz & Toàn vẹn Thưởng
- Backend là nguồn dữ liệu có thẩm quyền duy nhất trong việc xác định số câu đúng, kết quả đạt, cấp thưởng và số dư ví.
- Mọi bài nộp Quiz (`POST /api/quizzes/{id}/submit`) phải được Backend xác thực có thẩm quyền: kiểm tra từng `selected_option_id` bắt buộc phải thuộc danh sách options hợp lệ của đúng `question_id` đó. Từ chối ngay bằng lỗi `400 Bad Request` (`InvalidQuizSubmissionError`) nếu phát hiện gian lận chéo đáp án, câu hỏi trùng lặp hoặc ID không thuộc bài quiz.
- Tuyệt đối không cấp thưởng trùng cho cùng một người dùng trên cùng một bài Quiz.
- Phải bảo đảm tính nhất quán giao dịch (transaction consistency) và xử lý xung đột cạnh tranh có kiểm soát, ngăn chặn việc phát sinh lỗi server ngoài dự kiến hoặc làm sai lệch số dư ví.

## 6. Kiểm chứng thay đổi tại Backend
- Khi sửa đổi mã nguồn Python trong `backend/`, chạy toàn bộ test suite với `.\.venv\Scripts\python.exe -m pytest` tại thư mục `backend/` để xác minh toàn bộ ràng buộc schema, transaction, API routes và migration, kết hợp kiểm tra mã nguồn bằng `ruff check` và `ruff format --check`.
