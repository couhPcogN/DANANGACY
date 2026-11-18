# Backend Rules & Business Logic Guide (`backend/`)

Tài liệu chi tiết về kiến trúc API FastAPI, cơ sở dữ liệu PostgreSQL và toàn bộ ràng buộc nghiệp vụ lịch trình (Itinerary Rules).

---

## 1. Môi trường & Khởi chạy

- **Ngôn ngữ & Framework:** Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic.
- **Cơ sở dữ liệu:** PostgreSQL 16+ chạy trên Docker container ở cổng mặc định `5432` (`danangacy`).
- **Khóa chính:** Toàn bộ bảng sử dụng khóa chính số nguyên (`Integer IDs`).

### Lệnh chạy máy chủ & Kiểm thử:

```powershell
cd backend
# Chạy migration nâng cấp database
.\.venv\Scripts\python.exe -m alembic upgrade head

# Chạy máy chủ phát triển
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Chạy toàn bộ test suites
.\.venv\Scripts\python.exe -m pytest
```

---

## 2. Toàn bộ quy tắc nghiệp vụ Lịch trình (Itinerary Rules)

Khi viết API hoặc xử lý logic thêm/sửa lịch trình, bắt buộc phải thỏa mãn các điều kiện trong `app/core/itinerary_rules.py`:

| Quy tắc | Giới hạn | Ý nghĩa |
|---|---|---|
| **Thời lượng chuyến đi** | `1 <= duration <= 3` | Chuyến đi chỉ từ 1 đến 3 ngày. |
| **Tổng số điểm dừng** | `1 <= len(stops) <= 8` | Toàn bộ lịch trình có tối thiểu 1 và tối đa 8 điểm dừng (`MAX_STOPS = 8`). |
| **Thời gian mỗi điểm** | $\ge 30$ phút | Mỗi điểm ghé thăm phải kéo dài ít nhất 30 phút (`MIN_VISIT_MINUTES = 30`). |
| **Khung giờ hoạt động** | `06:00` đến `22:00` | Giờ bắt đầu (`start`) và giờ kết thúc (`end`) phải nằm trong khoảng 06:00 - 22:00 cùng ngày. |
| **Trùng lặp giờ** | `start < end`, không giao nhau | Không được phép có hai điểm dừng trùng hoặc đè giờ lên nhau trong cùng 1 ngày (`day`). |
| **Địa điểm hợp lệ** | `place_id in destinations` | Mã địa điểm phải tồn tại trong bảng điểm đến của hệ thống. |
| **Cơ chế xóa** | Soft delete | Xóa mềm để lưu giữ lịch sử chuyến đi của người dùng. |

---

## 3. Quy tắc thích ứng thời tiết (Weather Replacement)

Khi hệ thống phát hiện thời tiết xấu (ví dụ: cảnh báo mưa $\ge 70\%$ tại điểm tham quan ngoài trời như Bán đảo Sơn Trà):
- **Hành động:** Đề xuất điểm thay thế trong nhà (ví dụ: Bảo tàng Đà Nẵng).
- **Ràng buộc bất biến:**
  1. Phải giữ nguyên 100% khung giờ ban đầu (`start` và `end`) của điểm được thay thế.
  2. Không được làm thay đổi vị trí, thứ tự hay thời gian của các điểm dừng khác trong cùng ngày.
