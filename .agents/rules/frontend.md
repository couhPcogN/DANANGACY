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

## 4. An toàn Secret & Tích hợp Dịch vụ Bên ngoài
- Tuyệt đối không đặt API key, token hoặc thông tin bí mật của các dịch vụ trả phí bên thứ ba (như Gemini API) vào `frontend/.env` hoặc bất kỳ tệp mã nguồn nào có tiền tố `EXPO_PUBLIC_*`.
- Mọi yêu cầu gọi dịch vụ AI phải đi qua Backend Proxy (`/api/ai/*`) và được xử lý bắt lỗi an toàn ở phía client để duy trì trải nghiệm khi mất kết nối mạng.

## 5. Toàn vẹn Dữ liệu Quiz & Chống Suy diễn ID
- Dữ liệu câu hỏi và đáp án hiển thị cho người dùng làm bài phải xuất phát từ cùng một nguồn với dữ liệu dùng để đóng gói payload nộp bài (`submit`). Tuyệt đối không hiển thị `demoQuiz` rồi âm thầm submit câu trả lời vào `backendQuiz` khác nội dung hoặc thứ tự.
- Bắt buộc bảo toàn `question_id` và `selected_option_id` thực tế do Backend cung cấp; cấm suy diễn ID database từ vị trí câu hỏi (`index + 1`) hay vị trí đáp án.
- Khi người dùng đang trong phiên làm Quiz, bộ câu hỏi phải được đóng băng, không để background fetch thay đổi câu hỏi giữa chừng.
- Phân biệt minh bạch giữa Guest (chế độ mô phỏng cục bộ) và User có tài khoản (đồng bộ máy chủ). Tuyệt đối không tự động tạo đáp án giả (`q.options[0]`) cho câu hỏi chưa trả lời.

## 6. Kiểm chứng thay đổi tại Frontend
- Khi sửa đổi mã nguồn TypeScript/TSX trong `frontend/`, chạy `npm run typecheck` (`tsc --noEmit`) và chạy toàn bộ test suite được cấu hình trong `frontend/package.json` (`npm test`) để xác minh tính đúng đắn của kiểu dữ liệu, các luồng nghiệp vụ và ranh giới kiến trúc MVVM.
