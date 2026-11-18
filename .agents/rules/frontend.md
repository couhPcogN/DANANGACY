---
trigger: glob
globs: "**/frontend/**, frontend/**"
description: "Architectural, MVVM dependency boundary, and state persistence constraints for DANANGACY frontend."
---

# Frontend Constraints (`frontend/`)

Các ràng buộc bắt buộc khi đọc, tạo mới hoặc chỉnh sửa mã nguồn trong `frontend/`:

## 1. Ranh giới phụ thuộc MVVM (Dependency Boundaries)
Kiến trúc Frontend tuân theo luồng **View (`screens/`, `components/`) → ViewModel (`viewmodels/`) → Repository/Model (`repositories/`, `models/`, `data/`)**, được kiểm tra tự động trong `frontend/tests/mvvm.test.cjs`:
- **Ràng buộc tầng View:** Các file nằm trong `screens/` và `components/` **cấm** import trực tiếp từ `/repositories/`, `/providers/`, `/data/`, hoặc `/models/`. View chỉ nhận state và hàm xử lý sự kiện thông qua các hook ViewModel (`use*ViewModel`) hoặc UI shared components (`src/shared/`).
- **Ràng buộc tầng Repository:** Các file nằm trong `repositories/` **cấm** import từ `navigation`, `viewmodels`, `providers`, hoặc `react`. Repository chỉ quản lý state thuần thông qua `createStore` (`src/shared/state/createStore.ts`).

## 2. Quản lý State & Lưu trữ cục bộ
- Kết nối giữa Repository và React Context phải đi qua `createModelContext` (`src/shared/state/createModelContext.tsx`) sử dụng `useSyncExternalStore`.
- Khóa lưu trữ trạng thái ứng dụng trong AsyncStorage (`src/services/storage/appStateRepository.ts`) cố định là `'danangacy.demo.v1'`. Không tự ý đổi khóa này hoặc làm hỏng cơ chế tương thích ngược khi đọc dữ liệu `trips` cũ sang `itineraries`.

## 3. Ràng buộc dữ liệu Lịch trình tại Frontend
- Validation lịch trình tại `src/features/itinerary/schemas.ts` yêu cầu: thời lượng `duration` từ 1 đến 3 ngày; tổng số điểm dừng từ 1 đến 8 điểm; không trùng `placeId` trong cùng một lịch trình; mỗi điểm dừng kéo dài ít nhất 30 phút; khung giờ nằm trong `06:00`–`22:00` và không giao nhau trong cùng một `dayIndex`.
- Logic thay thế địa điểm do thời tiết (`replaceOutdoorStop` trong `src/features/itinerary/models/itinerary.ts`) khi thay `placeId: 'son-tra'` bằng `'bao-tang-dn'` phải giữ nguyên khung giờ (`start`, `end`) và các điểm dừng còn lại.

## 4. Kiểm chứng thay đổi tại Frontend
- Khi sửa đổi mã nguồn TypeScript/TSX trong `frontend/`, sử dụng `npm run typecheck` (`tsc --noEmit`) và `npm test` (`node --test tests/mvvm.test.cjs`) tại thư mục `frontend/` để xác minh không vi phạm kiểu dữ liệu và ranh giới MVVM.
