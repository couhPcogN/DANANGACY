# Backend DANANGACY

Deploy thử lên Cloud Run (chưa cần database): xem [hướng dẫn Cloud Run](CLOUD_RUN.md).

Backend demo **FastAPI + SQLAlchemy + PostgreSQL**, quản lý lịch trình và các điểm dừng. Migration dùng **Alembic**.

Schema mới nhất ở revision **0003**, gồm 15 bảng nghiệp vụ theo [thiết kế database đã thống nhất](../docs/DATABASE_SCHEMA.md), dùng khóa chính số nguyên thay cho UUID. Database chỉ thay đổi sau khi bạn chạy migration. Các API đang triển khai tập trung vào lịch trình.

## Chạy nhanh trên Windows

Yêu cầu Python 3.11 trở lên và PostgreSQL đang chạy. Mở PowerShell:

```powershell
cd D:\Danagacy\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
```

Nếu đã có `.venv`, bỏ qua bước tạo lại. Các lệnh dùng trực tiếp Python của môi trường ảo nên không cần đổi execution policy hoặc activate.

Nếu chưa có `.env`, sao chép mẫu **một lần**:

```powershell
Copy-Item .env.example .env
```

Điền `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` trong `.env`. Không ghi đè file `.env` đã cấu hình. Mật khẩu có ký tự `#` hoặc khoảng trắng nên đặt trong dấu nháy, ví dụ `DB_PASSWORD="your-local-password"`.

Tạo database tên tương ứng, ví dụ `danangacy`, bằng pgAdmin hoặc công cụ PostgreSQL. Alembic tạo các bảng bên trong database, không tạo database.

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Mở:

- Swagger để thử API: <http://127.0.0.1:8000/docs>.
- Kiểm tra server: <http://127.0.0.1:8000/health>.
- Kiểm tra kết nối database: <http://127.0.0.1:8000/health/db>.

Nhấn `Ctrl + C` để dừng server. Nếu cổng 8000 đang có ứng dụng khác, đổi `--port` và URL truy cập sang một cổng trống.

## API

| Method | Đường dẫn | Chức năng |
| --- | --- | --- |
| `POST` | `/api/v1/itineraries` | Thêm lịch trình và các điểm dừng |
| `GET` | `/api/v1/itineraries?offset=0&limit=20` | Danh sách, tối đa 100 lịch trình mỗi lần |
| `GET` | `/api/v1/itineraries/{id}` | Xem một lịch trình |
| `PATCH` | `/api/v1/itineraries/{id}` | Sửa các trường được gửi lên |
| `DELETE` | `/api/v1/itineraries/{id}` | Xóa mềm lịch trình, giữ dữ liệu lịch sử |

Ví dụ body tạo lịch trình:

```json
{
  "title": "Một ngày di sản Đà Nẵng",
  "date": "2026-11-15",
  "duration": 1,
  "pace": "Thư thả",
  "stops": [
    { "place_id": "cham", "day": 1, "start": "09:00", "end": "10:30" },
    { "place_id": "son-tra", "day": 1, "start": "14:00", "end": "16:00" }
  ]
}
```

Ngày dùng `YYYY-MM-DD`, giờ dùng `HH:mm`. `day` là ngày thứ mấy trong chuyến đi, mặc định 1. Xem quy tắc kiểm tra và ví dụ sửa/xóa trong [hướng dẫn code backend](../docs/BACKEND_ITINERARIES.md).

Giới hạn: **1–3 ngày, 1–8 điểm dừng, mỗi điểm ít nhất 30 phút**, trong khoảng 06:00–22:00, không trùng giờ trong cùng ngày. `place_id` phải là slug đã có trong `destinations`. API trả thêm `version`; gửi lại giá trị này khi PATCH để phát hiện việc sửa trên bản dữ liệu đã cũ.

## Cấu trúc

```text
app/
├── main.py                     # FastAPI, CORS, xử lý lỗi
├── api/
│   ├── dependencies.py         # Session riêng cho từng request
│   ├── router.py
│   └── routes/                 # API lịch trình và kiểm tra kết nối
├── core/                       # Cấu hình .env và lỗi nghiệp vụ
├── db/                         # SQLAlchemy Base, engine, session factory
├── models/                     # Người dùng, địa điểm, lịch trình, quiz, điểm và voucher
├── schemas/itinerary.py        # Request và response Pydantic
├── services/itinerary_service.py # Nghiệp vụ và transaction
└── repositories/               # Truy vấn, không tự commit
migrations/                     # 0001 ban đầu; 0002 chuyển dữ liệu sang schema mới
tests/                          # API, transaction, kết nối và migration
```

## Kiểm tra

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m ruff check app migrations tests
.\.venv\Scripts\python.exe -m ruff format --check app migrations tests
```

Mặc định, test dùng SQLite tạm riêng cho từng bài và tạo bảng bằng chính migration Alembic. Chạy cùng bộ test trên PostgreSQL bằng cách cấu hình `TEST_DATABASE_URL`; test tạo schema ngẫu nhiên riêng và dọn schema đó khi hoàn tất, không dùng các bảng ứng dụng trong `public`. Xem lệnh chạy từ `.env` trong tài liệu chi tiết.

## Phạm vi demo

Chưa có đăng nhập thật hoặc kết nối frontend. API tạm dùng người dùng cố định `demo-user`, nhưng truy vấn đã lọc theo chủ sở hữu. Migration nạp người dùng demo và 8 địa điểm tương ứng với dữ liệu frontend; `python -m app.db.seed` có thể bổ sung lại các bản ghi demo còn thiếu mà không ghi đè dữ liệu đã có.

Quiz, ví điểm, yêu thích và voucher hiện có model/bảng cùng các ràng buộc cơ bản, chưa có API nghiệp vụ. Không coi các bảng này là những tính năng đã triển khai hoàn chỉnh.

## Nâng database từ 0001

Dừng server đang chạy trước khi nâng schema. Sao lưu database, rồi chạy `alembic upgrade head` như hướng dẫn trên. Revision 0002 tạo schema mới, chuyển dữ liệu từ `trips`/`trip_stops`, sau đó bỏ hai bảng cũ trong cùng transaction PostgreSQL. Không import file SQL cũ trực tiếp vào database đã có Alembic.

Các lịch trình cũ vượt giới hạn 8 điểm hoặc có điểm dưới 30 phút vẫn được giữ nguyên khi chuyển; cần sửa cho hợp lệ trước lần cập nhật tiếp theo. Downgrade về 0001 chỉ hỗ trợ dữ liệu còn biểu diễn được bằng schema cũ và sẽ từ chối nếu phát hiện dữ liệu mới có nguy cơ mất.

Không gọi `Base.metadata.create_all()` khi khởi động. Cần chạy migration trước khi gọi API lịch trình; `/health/db` chỉ kiểm tra kết nối, không xác nhận các bảng đã được tạo.
