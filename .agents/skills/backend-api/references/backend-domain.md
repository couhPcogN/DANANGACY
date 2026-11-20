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
│   │   ├── router.py                        # Gộp health router, v1 itineraries router, ai router
│   │   └── routes/
│   │       ├── health.py                    # GET /health, GET /health/db
│   │       ├── ai.py                        # POST /api/ai/generate, POST /api/ai/heritage-guide
│   │       ├── quizzes.py                   # GET /api/quizzes, POST /api/quizzes/{id}/submit
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
│   │   ├── quiz_repository.py               # Truy vấn Quiz, Question, Option, Attempt, RewardGrant
│   │   └── itinerary_repository.py          # Truy vấn Itinerary & Destination
│   ├── schemas/
│   │   ├── quiz.py                          # QuizRead, QuizSubmitRequest, QuizSubmitResult
│   │   ├── ai.py                            # AIPromptRequest, AIHeritageRequest, AIResponse
│   │   └── itinerary.py                     # ItineraryCreate, ItineraryUpdate, ItineraryRead, ItineraryStopCreate/Read
│   └── services/
│       ├── quiz_service.py                  # Chấm điểm Quiz, Anti-Cheat, Savepoint cấp thưởng
│       ├── gemini_service.py                # GeminiService, HERITAGE_FALLBACKS, xử lý HTTP 402 & timeout
│       └── itinerary_service.py             # validate_schedule, build_items, ItineraryService
├── migrations/versions/
│   ├── 0001_create_trips.py
│   ├── 0002_align_application_schema.py
│   └── 0003_integer_primary_keys.py         # Chuyển toàn bộ PK/FK sang số nguyên (Integer)
└── tests/
    ├── conftest.py                          # Fixtures: db_engine, client, payload
    ├── test_auth_destinations_favorites.py  # Auth, Destinations catalog & Favorites
    ├── test_database.py                     # Kết nối DB & xử lý lỗi bảo mật
    ├── test_gamification_rewards.py         # Quiz, Wallets & Voucher claims
    ├── test_integer_ids.py                  # Khóa chính số nguyên tự tăng
    ├── test_itineraries.py                  # CRUD & validate lịch trình
    ├── test_itinerary_schema.py             # Schema constraints & migration safety
    └── test_weather_and_ai.py               # Dự báo thời tiết & AI proxy mock tests
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

## 3. Quy chuẩn Dịch vụ AI Proxy (`app/api/routes/ai.py` & `app/services/gemini_service.py`)
- **Quản lý Khóa bí mật:** Khóa Gemini chỉ được lưu trên Backend qua `Settings.gemini_api_key: SecretStr`. Tuyệt đối không trả khóa về client.
- **Input Validation & Giới hạn biên:** Request schema `AIPromptRequest` và `AIHeritageRequest` phải bật `model_config = ConfigDict(extra="forbid")`, giới hạn `prompt <= 2000`, `system_instruction <= 1000`, `destination_name <= 200`, `slug <= 50`.
- **Hợp đồng dữ liệu & HTTP Semantics:**
  - Endpoint `/api/ai/*` sử dụng `AIResponse(success: bool, text: str, source: str, message: str | None)`. Đây là contract đặc thù của module AI nhằm hỗ trợ client phân biệt nguồn nội dung (`gemini-3.8-flash` vs `local-fallback`).
  - *Lưu ý kiến trúc:* Không áp dụng mẫu `HTTP 200 + success=false` này cho các API nghiệp vụ khác; các module khác bắt buộc dùng đúng mã trạng thái HTTP tiêu chuẩn (4xx khi lỗi client, 5xx khi lỗi server).
- **Graceful Degradation cho AI:** Khi gọi Gemini thất bại (ví dụ lỗi HTTP 402 hoặc timeout mạng), `explain_heritage` tự động nạp nội dung dự phòng từ `HERITAGE_FALLBACKS` nếu có `slug` địa danh tương ứng. Lưu ý: Việc kiểm thử mới chỉ xác minh cơ chế kỹ thuật chuyển đổi fallback của phần mềm, chưa kiểm chứng độ chính xác lịch sử của nội dung văn bản.
- **Hiện trạng bảo vệ chống lạm dụng:** Hiện tại các endpoint AI mở cho Guest và chưa có rate limiting, quota hoặc authentication. Đây là hạng mục kỹ thuật cần thiết kế phương án bổ sung trước khi triển khai công khai.

## 4. Nghiệp vụ Gamification, Chấm điểm Quiz & Cấp thưởng (`app/services/quiz_service.py`)
- **Mô hình Dữ liệu:** Bảng `quizzes` (pass_score, reward_points), `quiz_questions` (quiz_id, position), `quiz_options` (question_id, position, is_correct), `quiz_attempts` (correct_count, points_awarded), `reward_grants` (owner_uid, quiz_id với `UniqueConstraint`).
- **Thuật toán Xác thực Đa tầng & Anti-Cheat:**
  - Xây dựng từ điển ánh xạ đáp án hợp lệ theo cấu trúc kiểu: `valid_options_by_q: dict[int, dict[int, bool]] = {q.id: {} for q in questions}`. Sau khi truy vấn danh sách option từ `QuizRepository.get_options_for_questions()`, nạp từng option vào `valid_options_by_q[opt.question_id][opt.id] = opt.is_correct`.
  - Kiểm tra xác thực nộp bài: (1) từ chối nếu có câu hỏi trùng lặp trong payload (`len(q_ids) != len(set(q_ids))`); (2) từ chối nếu câu hỏi không thuộc bài Quiz (`q.id not in valid_options_by_q`); (3) từ chối nếu đáp án không thuộc câu hỏi (`opt.id not in valid_options_by_q[q.id]`). Mọi vi phạm đều nâng lỗi `InvalidQuizSubmissionError` và trả về `400 Bad Request`.
- **Cơ chế Cấp thưởng & Xử lý Cạnh tranh (Concurrency Savepoint):**
  - Điểm thưởng chỉ trao đúng 1 lần cho mỗi tài khoản trên mỗi bài Quiz đạt `pass_score`.
  - Trong implementation hiện tại, luồng ghi `RewardGrant` và cập nhật ví được bọc trong Savepoint lồng nhau `with self.session.begin_nested():`. Khi có xung đột cạnh tranh gây `IntegrityError` trên `UniqueConstraint("owner_uid", "quiz_id")`: savepoint rollback an toàn nhánh ghi thưởng, đặt `points_to_award = 0`, lấy lại số dư ví hiện tại và trả về HTTP 200 idempotent với thông báo điểm thưởng đã được trao trước đó, không làm hỏng outer transaction và không gây lỗi HTTP 500.
  - *Lưu ý về phạm vi kiểm chứng concurrency:* Cơ chế xử lý Savepoint và bắt `IntegrityError` hiện mới được kiểm chứng qua unit test và SQLite mock. Việc kiểm thử concurrency thực tế với nhiều kết nối song song trên môi trường PostgreSQL đa tiến trình chưa được thực hiện; do đó không khẳng định giải pháp hiện tại an toàn tuyệt đối trước mọi loại race condition phân tán.
