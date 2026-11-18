# Tham chiếu Kiến trúc, Database & Miền nghiệp vụ Backend (`backend/`)

Tài liệu này tổng hợp kiến trúc và các quy tắc nghiệp vụ đã được xác minh từ mã nguồn `backend/`.

## 1. Cấu trúc thư mục thực tế
```text
backend/
├── alembic.ini                              # Cấu hình Alembic
├── pyproject.toml                           # FastAPI, SQLAlchemy 2.0, Alembic, Psycopg 3, Pytest, Ruff
├── app/
│   ├── main.py                              # Khởi tạo FastAPI app, CORS, exception handlers
│   ├── api/
│   │   ├── dependencies.py                  # Cung cấp DB Session cho từng request
│   │   ├── router.py                        # Gộp health router và v1 itineraries router
│   │   └── routes/
│   │       ├── health.py                    # GET /health, GET /health/db
│   │       └── itineraries.py               # CRUD /api/v1/itineraries
│   ├── core/
│   │   ├── config.py                        # Settings đọc từ .env (DB_HOST, DB_PORT, DB_NAME...)
│   │   ├── exceptions.py                    # InvalidScheduleError(422), ItineraryNotFoundError(404), ItineraryConflictError(409)
│   │   └── itinerary_rules.py               # DEMO_USER_UID, APP_TIMEZONE("Asia/Ho_Chi_Minh"), MAX_STOPS=8, MIN_VISIT_MINUTES=30
│   ├── db/
│   │   ├── base.py                          # DeclarativeBase
│   │   ├── session.py                       # Engine & SessionLocal
│   │   ├── demo_data.py & seed.py           # Dữ liệu mẫu idempotent (8 destinations, demo-user...)
│   ├── models/                              # 15 bảng nghiệp vụ dùng IntegerPrimaryKey
│   │   ├── common.py                        # IntegerPrimaryKey, Timestamps, JSON_DOCUMENT
│   │   ├── user.py                          # users
│   │   ├── destination.py                   # destinations
│   │   ├── favorite.py                      # favorites
│   │   ├── itinerary.py                     # itineraries, itinerary_items
│   │   ├── quiz.py                          # quizzes, quiz_questions, quiz_options, quiz_attempts, quiz_attempt_answers
│   │   └── reward.py                        # wallets, point_transactions, reward_grants, voucher_offers, voucher_claims
│   ├── repositories/
│   │   └── itinerary_repository.py          # Truy vấn Itinerary & Destination
│   ├── schemas/
│   │   └── itinerary.py                     # ItineraryCreate, ItineraryUpdate, ItineraryRead, ItineraryStopCreate/Read
│   └── services/
│       └── itinerary_service.py             # validate_schedule, build_items, ItineraryService
├── migrations/versions/
│   ├── 0001_create_trips.py
│   ├── 0002_align_application_schema.py
│   └── 0003_integer_primary_keys.py         # Chuyển toàn bộ PK/FK sang số nguyên (Integer)
└── tests/
    ├── conftest.py                          # Fixtures: db_engine, client, payload
    ├── test_database.py
    ├── test_integer_ids.py
    ├── test_itineraries.py
    └── test_itinerary_schema.py
```

## 2. Quy tắc nghiệp vụ Lịch trình đã xác minh (`app/schemas/itinerary.py` & `app/services/itinerary_service.py`)
1. **Trường cấp độ Lịch trình (`ItineraryCreate` / `ItineraryUpdate`):**
   - `title`: chuỗi sau khi cắt khoảng trắng có độ dài `1..200`.
   - `date`: ngày hợp lệ theo định dạng ISO `YYYY-MM-DD`.
   - `duration`: số nguyên `1..3` (mặc định `1`).
   - `pace`: một trong 3 giá trị `"Thư thả"`, `"Cân bằng"`, `"Năng động"`.
   - `stops`: danh sách từ `1` đến `8` phần tử (`MAX_STOPS = 8`).
   - `version` (chỉ trong `ItineraryUpdate`): số nguyên ≥ 1 dùng để kiểm tra optimistic locking. Bản tin PATCH phải gửi ít nhất một trường dữ liệu ngoài `version` và không trường nào được mang giá trị `null`.
2. **Trường cấp độ Điểm dừng (`ItineraryStopCreate` & `validate_schedule`):**
   - `place_id`: chuỗi `1..100` ký tự, phải khớp với `Destination.slug` đang tồn tại và có `status != "ARCHIVED"`.
   - `day`: số nguyên `1..3`, không được lớn hơn `duration` của lịch trình (`stop.day <= duration`).
   - `start`, `end`: chuỗi khớp biểu thức chính quy `^([01][0-9]|2[0-3]):[0-5][0-9]$`, nằm trong đoạn `"06:00"` đến `"22:00"`, `start < end`, và khoảng cách `(end - start) >= 30` phút.
   - **Quy tắc trùng giờ:** Sắp xếp các điểm dừng theo `(day, start)`. Trong cùng một ngày (`stop.day == previous_day`), bắt buộc `stop.start >= previous_end`. Cho phép hai điểm nối tiếp nhau (`stop.start == previous_end`) và cho phép cùng `place_id` xuất hiện nhiều lần nếu không trùng giờ.
3. **Chuyển đổi múi giờ & Lưu trữ (`build_items` & `to_itinerary_read`):**
   - Khi lưu: kết hợp `payload.date + timedelta(days=stop.day - 1)` với `start`/`end` theo múi giờ `Asia/Ho_Chi_Minh`, sau đó đổi sang `UTC` để lưu vào `planned_start_at` và `planned_end_at` của bảng `itinerary_items`.
   - Khi đọc: đổi từ `UTC` về lại `Asia/Ho_Chi_Minh` để tính lại `day = (start.date() - itinerary.visit_date).days + 1` và chuỗi giờ `HH:MM`.
