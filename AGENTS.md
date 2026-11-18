# DANANGACY — Global Repository Guardrails

Quy tắc nền tảng áp dụng trên toàn bộ repository `DANANGACY` (`frontend/` và `backend/`).

## 1. Cấu trúc Monorepo & Phạm vi chỉnh sửa
- `frontend/`: Ứng dụng di động React Native + Expo (TypeScript).
- `backend/`: Dịch vụ REST API FastAPI + SQLAlchemy 2.0 + PostgreSQL (Python 3.11+).
- Chỉ chỉnh sửa các file nằm trong phạm vi yêu cầu của người dùng. Không tự ý sửa đổi mã nguồn sang module khác nếu chưa được yêu cầu.
- Không tự ý cài đặt thêm thư viện/dependency mới vào `package.json` hoặc `pyproject.toml` khi chưa được phê duyệt.

## 2. Bảo mật & Tệp nhạy cảm
- Tuyệt đối không đọc để in ra màn hình, ghi log hoặc đưa vào Git các giá trị bí mật trong `.env`, `.env.*`, API keys, passwords, hoặc access tokens.
- Chỉ sử dụng `.env.example` làm mẫu cấu hình.
- Không đưa các thư mục môi trường và tạo phẩm build (`node_modules/`, `.venv/`, `.expo/`, `dist/`, `web-build/`, `.tmp/`) vào phạm vi theo dõi của Git.

## 3. An toàn Git & Quản lý thay đổi
- Không tự động thực thi `git add`, `git commit`, `git push`, `git reset`, `git rebase`, hoặc `git clean` trừ khi người dùng yêu cầu tường minh trong lượt hội thoại đó.
- Trước khi chỉnh sửa file, kiểm tra trạng thái working tree để không ghi đè mất các thay đổi chưa commit của người dùng.

## 4. Tiêu chuẩn xác minh (Verification Gate)
- Không tuyên bố hoàn thành hoặc báo cáo `PASS` cho bất kỳ thay đổi mã nguồn hay bài kiểm thử nào nếu chưa thực sự chạy lệnh xác minh tương ứng và kiểm tra kết quả đầu ra.
- Khi có sự khác biệt về hợp đồng dữ liệu giữa `frontend/` và `backend/`, phải giữ đúng hành vi đã được xác minh của từng phía và thông báo rõ cho người dùng, không tự ý đoán hoặc áp đặt quy tắc của phía này sang phía kia.
