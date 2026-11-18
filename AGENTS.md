# DANANGACY Agent Guidelines

Hệ thống quy chuẩn cho trợ lý AI khi làm việc trong repository DANANGACY.

## 1. Cấu trúc dự án
- `frontend/`: Ứng dụng mobile React Native + Expo theo mô hình MVVM.
- `backend/`: REST API FastAPI + SQLAlchemy 2.0 + PostgreSQL.

## 2. Nguyên tắc bắt buộc
- **Frontend:** Không viết code gọi API hoặc xử lý state trực tiếp trong component Screen. Luôn đi qua ViewModel và Repository.
- **Backend:** Tuân thủ các ràng buộc nghiệp vụ lịch trình (1-3 ngày, tối đa 8 điểm dừng, tối thiểu 30 phút/điểm, 06:00 - 22:00, không trùng giờ).
- **Kiểm thử:** Trước khi hoàn thành một tính năng, luôn chạy `npm test` ở frontend và `pytest` ở backend để đảm bảo không bị break code.

Chi tiết quy chuẩn và kịch bản thực hiện xem tại: [.agents/skills/danangacy-guidelines/SKILL.md](.agents/skills/danangacy-guidelines/SKILL.md)
