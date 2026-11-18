---
name: frontend-feature
description: >-
  Develop or refactor React Native Expo screens, UI components, viewmodels,
  and state repositories in frontend/. Use when implementing mobile UI features,
  updating viewmodel logic, or modifying navigation and local state in the
  DANANGACY frontend.
---

# Frontend Feature Development Workflow

Quy trình chuẩn để phát triển mới hoặc chỉnh sửa tính năng trong thư mục `frontend/` của dự án DANANGACY.

## Khi nào sử dụng Skill này
- Tạo mới hoặc cập nhật màn hình (`screens/`), thành phần giao diện (`components/`, `src/shared/components/`).
- Bổ sung hoặc chỉnh sửa logic trạng thái màn hình, xử lý biểu mẫu trong ViewModel (`viewmodels/`).
- Thay đổi cấu trúc lưu trữ state cục bộ trong Repository (`repositories/`, `src/services/storage/`).
- Điều chỉnh luồng chuyển màn hình trong bộ điều hướng (`src/app/navigation/`).

## Đầu vào kỳ vọng (Inputs)
- Mô tả tính năng giao diện, hành vi tương tác, hoặc lỗi UI/state cần khắc phục trong `frontend/`.
- Tên feature liên quan (`auth`, `home`, `explore`, `itinerary`, `game`, `profile`) hoặc thành phần dùng chung (`shared`, `app/navigation`).

## Quy trình thực thi (Workflow)

### Bước 1: Nạp tri thức kiến trúc Frontend (Progressive Disclosure)
- Đọc tài liệu tham chiếu [frontend-architecture.md](./references/frontend-architecture.md) để nắm chính xác cấu trúc thư mục, cách tổ chức `createStore` / `createModelContext`, bộ điều hướng stack/tab và các điểm bất đồng bộ dữ liệu cần lưu ý.
- Đọc các file hiện có trong `frontend/src/features/<feature>/` trước khi viết mã.

### Bước 2: Thiết kế và cập nhật tầng dữ liệu (Model / Repository)
- Nếu tính năng cần trạng thái bền vững hoặc chia sẻ giữa các màn hình:
  1. Cập nhật kiểu dữ liệu trong `types.ts` và quy tắc kiểm tra trong `schemas.ts` (nếu có).
  2. Viết các hàm biến đổi dữ liệu thuần (pure functions) trong `models/`.
  3. Cập nhật Repository trong `repositories/*Repository.ts` sử dụng `createStore`. Đảm bảo Repository **không** import React, ViewModel, Provider hay Navigation.
  4. Nếu dữ liệu cần lưu xuống thiết bị qua `danangacy.demo.v1`, kiểm tra `src/services/storage/appStateRepository.ts` và `src/app/providers/AppProvider.tsx`.

### Bước 3: Cập nhật tầng điều phối (Provider & ViewModel)
- Kết nối Repository vào Context thông qua `createModelContext` trong `providers/*Provider.tsx`.
- Mở rộng hoặc tạo mới hook `use<Feature>ViewModel.ts` trong `viewmodels/`:
  - Đọc state từ Model hook và Navigation hook (`useNavigation`).
  - Đóng gói mọi logic kiểm tra đầu vào, xử lý sự kiện nhấn nút, và chuyển trang thành các hàm/thuộc tính trả về rõ ràng cho View.

### Bước 4: Xây dựng tầng hiển thị (View / Screen & Components)
- Cập nhật `screens/*Screen.tsx` và các component con trong `components/`:
  - Tái sử dụng các thành phần cơ sở từ `src/shared/components/` (`Screen`, `Header`, `Tabs`, `Button`, `Card`, `Field`, `Pill`, `PlaceRow`, v.v.) và token giao diện từ `src/theme/index.ts`.
  - **Kiểm tra ranh giới:** Đảm bảo file trong `screens/` và `components/` chỉ gọi hook từ `viewmodels/` và `shared/`, tuyệt đối không import trực tiếp từ `repositories/`, `providers/`, `data/` hoặc `models/`.

### Bước 5: Xác minh và Xử lý lỗi (Verification & Error Handling)
1. Chạy kiểm tra kiểu tĩnh TypeScript tại thư mục `frontend/`:
   ```powershell
   Set-Location d:\Phuoc\DUT\ki9\DANANGACY\frontend; npm run typecheck
   ```
2. Chạy bộ kiểm thử MVVM và logic nghiệp vụ Frontend:
   ```powershell
   Set-Location d:\Phuoc\DUT\ki9\DANANGACY\frontend; npm test
   ```
3. **Xử lý lỗi:**
   - Nếu bài test `Views and repositories preserve MVVM dependency boundaries` thất bại: kiểm tra ngay các câu lệnh `import` trong file vừa sửa và chuyển việc truy cập dữ liệu về lại `viewmodels/`.
   - Nếu `tsc --noEmit` báo lỗi biến/import không sử dụng (`noUnusedLocals`, `noUnusedParameters`): dọn sạch các khai báo dư thừa trước khi kết thúc.

## Đầu ra kỳ vọng (Outputs)
- Danh sách các file đã tạo hoặc chỉnh sửa trong `frontend/`.
- Bằng chứng kết quả chạy `npm run typecheck` và `npm test`.
