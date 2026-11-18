# Frontend Guidelines & Rules (DANANGACY Mobile)

Quy tắc bắt buộc khi làm việc bên trong thư mục `frontend/`:

1. **Kiến trúc MVVM:** 
   - View/Screen (`src/features/*/screens/`) chỉ làm nhiệm vụ render giao diện và bắt sự kiện người dùng.
   - **Tuyệt đối KHÔNG** gọi API mạng (fetch, axios) trực tiếp hoặc thao tác trực tiếp với dữ liệu trong Screen.
   - Mọi thao tác form, logic nghiệp vụ và gọi API phải đi qua ViewModel hook (`src/features/*/viewmodels/`) và Repository (`src/features/*/repositories/`).

2. **Quản lý trạng thái:**
   - Sử dụng Observable Store qua `createStore` (`src/shared/state/createStore.ts`) kết hợp `useSyncExternalStore`.
   - Khóa lưu trữ offline cục bộ chuẩn là `STORAGE_KEY = 'danangacy.demo.v1'`.

3. **Kiểm thử bắt buộc trước khi kết thúc tác vụ:**
   ```powershell
   npm run typecheck     # TypeScript 0 lỗi
   npm test              # Toàn bộ test MVVM phải pass
   ```

Chi tiết tài liệu kiến trúc xem tại: [frontend-mvvm.md](../.agents/skills/danangacy-guidelines/references/frontend-mvvm.md)
