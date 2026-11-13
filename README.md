# DANANGACY

Repository chung cho frontend và backend của DANANGACY.

```text
DANANGACY/   # Frontend React Native + Expo
backend/     # Backend Python + FastAPI + PostgreSQL
```

## Frontend

```powershell
cd DANANGACY
npm ci
npm start
```

Xem cấu trúc MVVM theo tính năng, cách chạy và kiểm tra trong [tài liệu frontend](DANANGACY/README.md).

## Backend

Backend FastAPI đã có API thêm, sửa, xóa và đọc lịch trình, kết nối PostgreSQL và migration Alembic. Xem [cách chạy backend](backend/README.md) và [hướng dẫn code từng phần](docs/BACKEND_ITINERARIES.md).

Thiết kế 15 bảng nghiệp vụ và cách nâng database từ revision 0001 lên 0002 được mô tả trong [tài liệu schema database](docs/DATABASE_SCHEMA.md).

Revision mới nhất là 0003, chuyển UUID sang ID số nguyên. Xem [hướng dẫn migration ID](docs/INTEGER_IDS_MIGRATION.md) trước khi chạy.

Hai phần được quản lý cùng lịch sử Git trên nhánh `main`. Chạy lệnh Git từ thư mục gốc repository.

## Quy trình phát triển

Xem [hướng dẫn Git và quản lý mã nguồn khi phát triển tính năng](docs/GIT_WORKFLOW.md): tạo nhánh, commit, pull request, xử lý xung đột và phối hợp frontend/backend.

## Kiến trúc mobile

Xem [mô tả MVVM của mobile](docs/MOBILE_MVVM.md): trách nhiệm View/Model/ViewModel, provider theo tính năng, luồng lưu dữ liệu và cách thêm tính năng.
