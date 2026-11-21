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

## 5. Quy chuẩn báo cáo kiểm thử và xác minh bằng chứng
- **Phân định phương pháp xác minh (Verification Tiers):** Bắt buộc phân loại rõ ràng theo 6 cấp độ:
  - `PHYSICAL DEVICE VERIFIED`: Thao tác trực tiếp trên thiết bị di động vật lý (Android/iOS phone thật), có ảnh chụp/video/log thiết bị.
  - `EMULATOR VERIFIED`: Thao tác trực tiếp trên runtime Android Emulator thật, có ảnh chụp màn hình/UI dump và nhật ký tương ứng (với test local-only không bắt buộc HTTP log).
  - `LIVE BACKEND VERIFIED`: Gọi HTTP request thực tế qua mạng đến máy chủ backend FastAPI/Uvicorn đang chạy thật (phân biệt rõ với TestClient trong bộ nhớ).
  - `BACKEND PYTEST/TESTCLIENT VERIFIED`: Kiểm thử backend cô lập qua `pytest` và `TestClient` (xác thực endpoint, schema, transaction trong môi trường test).
  - `AUTOMATED NODE VERIFIED`: Chạy qua test runner tự động (`node:test`) với mock storage/network.
  - `SOURCE AUDITED`: Kiểm chứng tĩnh qua đọc và đối soát mã nguồn.
- **Trạng thái kiểm thử độc lập:** Phải phân tách rõ giữa phương pháp xác minh và trạng thái kết quả (`PASS`, `FAIL`, `BLOCKED`, `NOT RUN`). Mọi kịch bản chưa chạy trực tiếp trên thiết bị/mô phỏng phải ghi chú rõ ràng `NOT VERIFIED ON EMULATOR`, tuyệt đối không đánh đồng `AUTOMATED NODE VERIFIED` thành Android E2E.
- **Tính xác thực của số liệu kiểm thử:** Báo cáo số lượng kiểm thử phải dựa trên tên tệp vật lý thực tế trên ổ đĩa (`frontend/tests/*.test.cjs`, `backend/tests/*.py`) và kết quả raw output từ test runner, không sử dụng tên nhóm module tự quy ước.
- **Tiêu chuẩn công bố Production Readiness:** Không tuyên bố ứng dụng sẵn sàng production chỉ dựa vào kiểm thử giả lập (Node mocks), môi trường phát triển Expo Go hoặc TestClient backend. Mọi khẳng định về độ tin cậy đều phải nêu rõ phạm vi và giới hạn kiểm chứng thực tế.
