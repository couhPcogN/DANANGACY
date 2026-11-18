# Backend Guidelines & Rules (DANANGACY API)

Quy tắc bắt buộc khi làm việc bên trong thư mục `backend/`:

1. **Kiến trúc & Cơ sở dữ liệu:**
   - Framework: FastAPI + SQLAlchemy 2.0 + Pydantic v2 + Alembic.
   - Cơ sở dữ liệu: PostgreSQL chạy trên Docker container cổng 5432. Toàn bộ bảng dùng khóa chính số nguyên (`Integer IDs`).

2. **Ràng buộc nghiệp vụ Lịch trình (Itinerary Rules):**
   - Độ dài: 1 đến 3 ngày (`1 <= duration <= 3`).
   - Điểm dừng: 1 đến 8 điểm trong toàn bộ lịch trình (`MAX_STOPS = 8`).
   - Thời lượng ghé thăm: Tối thiểu 30 phút mỗi điểm (`MIN_VISIT_MINUTES = 30`).
   - Khung giờ hợp lệ: Nằm trong khoảng 06:00 đến 22:00 cùng ngày.
   - Không trùng lặp: Không được có hai điểm dừng trùng hoặc đè giờ lên nhau trong cùng một ngày.

3. **Quy tắc thay thế điểm do thời tiết (Weather Replacement):**
   - Khi thay thế điểm ngoài trời sang điểm trong nhà do cảnh báo thời tiết xấu, phải giữ nguyên 100% khung giờ (`start`, `end`) ban đầu và không làm xáo trộn các điểm dừng khác.

4. **Kiểm thử bắt buộc:**
   ```powershell
   .\.venv\Scripts\python.exe -m pytest
   ```

Chi tiết tài liệu nghiệp vụ xem tại: [backend-rules.md](../.agents/skills/danangacy-guidelines/references/backend-rules.md)
