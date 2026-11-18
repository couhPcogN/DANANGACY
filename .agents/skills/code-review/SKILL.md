---
name: code-review
description: >-
  Audit source code or git diffs in DANANGACY for architectural violations,
  MVVM boundary breaches, backend domain rule mismatches, security risks, and
  missing test coverage. Use when the user requests a code review, PR audit,
  or quality inspection.
---

# DANANGACY Code Review Workflow

Quy trình rà soát và đánh giá chất lượng mã nguồn ở chế độ **chỉ đọc (Read-Only Audit)** dành cho dự án DANANGACY.

## Khi nào sử dụng Skill này
- Người dùng yêu cầu review code, kiểm tra một file/module, hoặc đánh giá các thay đổi trước khi commit/merge.
- Người dùng gọi trực tiếp lệnh `/code-review`.

## Ranh giới thực thi (Boundaries)
- **Chế độ Read-Only:** Trong khi thực hiện review, **không** tự ý sửa file mã nguồn, không chạy lệnh thay đổi trạng thái Git, trừ khi người dùng yêu cầu sửa lỗi sau khi đã xem báo cáo review.
- Mọi nhận định lỗi đều phải dẫn chứng bằng đường dẫn file và số dòng cụ thể.

## Quy trình thực thi (Workflow)

### Bước 1: Xác định phạm vi mã nguồn cần Review
- Nếu người dùng chỉ định file hoặc thư mục: đọc nội dung các file đó.
- Nếu người dùng yêu cầu review các thay đổi hiện tại: dùng lệnh chỉ đọc `git status --short` và `git diff` để lấy danh sách thay đổi.

### Bước 2: Kiểm tra theo Checklist Kiến trúc & Nghiệp vụ

#### A. Nếu phạm vi có mã nguồn Frontend (`frontend/`)
1. **Ranh giới MVVM:**
   - File trong `screens/` hoặc `components/` có import trực tiếp từ `repositories/`, `providers/`, `data/`, hoặc `models/` không? (Vi phạm mức **High** vì sẽ làm gãy bài test AST trong `tests/mvvm.test.cjs`).
   - File trong `repositories/` có import `react`, `navigation`, `viewmodels`, hoặc `providers` không? (Vi phạm mức **High**).
2. **An toàn State & Persistence:**
   - Thao tác sửa dữ liệu bản nháp (`draft`) có vô tình làm biến đổi (mutate) trực tiếp danh sách đã lưu trước khi người dùng nhấn Lưu không?
   - Khóa lưu trữ `'danangacy.demo.v1'` và cấu trúc snapshot có giữ được tính tương thích ngược không?
3. **Chất lượng TypeScript:**
   - Có biến, tham số hoặc import dư thừa vi phạm cấu hình `noUnusedLocals` / `noUnusedParameters` trong `tsconfig.json` không?

#### B. Nếu phạm vi có mã nguồn Backend (`backend/`)
1. **Phân tầng & Giao dịch:**
   - Route có gọi trực tiếp SQLAlchemy model/query mà bỏ qua `Service` và `Repository` không?
   - Các thao tác ghi nhiều bảng (như cập nhật `Itinerary` và `ItineraryItem`) có nằm trong một transaction `with self.session.begin():` để đảm bảo rollback khi lỗi không?
2. **Ràng buộc miền nghiệp vụ & Bảo mật dữ liệu:**
   - Truy vấn đọc/sửa/xóa có lọc theo `owner_uid` và `deleted_at.is_(None)` không?
   - Các giới hạn lịch trình (`1..3` ngày, `1..8` điểm dừng, ≥ 30 phút/điểm, `06:00`–`22:00`, không trùng giờ cùng ngày, kiểm tra `version`) có được bảo toàn không?
3. **Khác biệt tích hợp Frontend – Backend:**
   - Nếu mã nguồn đang nối API giữa Frontend và Backend, có xử lý chuyển đổi giữa `id: string` / ngày `DD/MM/YYYY` (Frontend) với `id: int` / ngày `YYYY-MM-DD` (Backend) không?

#### C. Kiểm tra Bảo mật chung (Security)
- Có chuỗi mật khẩu, token, hoặc thông tin kết nối nhạy cảm nào bị hardcode trong mã nguồn hoặc log ra console không?

### Bước 3: Xuất Báo cáo Code Review
Trình bày kết quả bằng tiếng Việt theo cấu trúc:
1. **Phạm vi đã kiểm tra:** Liệt kê các file đã đọc.
2. **Phát hiện (Findings):** Phân loại theo mức độ `Critical`, `High`, `Medium`, `Low`. Mỗi mục nêu rõ: `[Mức độ] Đường dẫn file:Dòng — Mô tả vấn đề & Cách khắc phục đề xuất`.
3. **Đánh giá độ phủ kiểm thử:** Nhận xét xem thay đổi đã có test bao phủ trong `frontend/tests/mvvm.test.cjs` hoặc `backend/tests/` chưa.
