# Tham chiếu Kiến trúc & Nghiệp vụ Frontend (`frontend/`)

Tài liệu này tóm tắt cấu trúc kỹ thuật và các quy tắc đã được xác minh từ mã nguồn `frontend/`.

## 1. Cấu trúc thư mục thực tế
```text
frontend/
├── App.tsx                                  # Entry point bọc AppProviders và AppNavigator
├── package.json                             # Scripts: start, web, typecheck, format:check, test
├── tests/
│   └── mvvm.test.cjs                        # 16 bài kiểm thử node:test (State, MVVM AST, Business rules)
└── src/
    ├── app/
    │   ├── navigation/                      # Custom stack/tab navigator (createNavigation, AppNavigator)
    │   └── providers/                       # AppProviders, AppProvider (đồng bộ snapshot AsyncStorage)
    ├── config/images.ts                     # Bản đồ require() ảnh cục bộ từ assets/images/
    ├── features/
    │   ├── auth/                            # Đăng nhập, đăng ký, khôi phục mật khẩu demo
    │   ├── home/                            # Màn hình chính, gợi ý thời tiết & lịch trình
    │   ├── explore/                         # Tìm kiếm, lọc trong nhà/ngoài trời, yêu thích
    │   ├── itinerary/                       # Tạo, sửa, kiểm tra lịch trình & thay thế điểm khi mưa
    │   ├── game/                            # Thử thách quiz 5 câu, tính điểm & đổi ưu đãi
    │   └── profile/                         # Thông tin hồ sơ & danh sách yêu thích
    ├── services/storage/
    │   ├── localStorage.ts                  # Wrapper AsyncStorage
    │   └── appStateRepository.ts            # Đọc/ghi snapshot khóa 'danangacy.demo.v1'
    ├── shared/
    │   ├── components/                      # layout/ (Header, Screen, Tabs) & ui/ (Button, Card, Field...)
    │   ├── layout/responsive.ts             # Tính toán breakpoint (mobile <=430, wide >=768)
    │   ├── state/                           # createStore.ts & createModelContext.tsx
    │   └── utils/                           # date.ts (DD/MM/YYYY), notify.ts
    └── theme/index.ts                       # Màu sắc, spacing, typography
```

## 2. Cơ chế State & MVVM (`createStore` & `createModelContext`)
- **`createStore(initialState)` (`src/shared/state/createStore.ts`):**
  - Trả về `{ getSnapshot, subscribe, update }`.
  - Khi `update(updater)` trả về cùng tham chiếu (`Object.is(next, state)`), store không kích hoạt listener.
- **`createModelContext(name, createRepository)` (`src/shared/state/createModelContext.tsx`):**
  - Tạo React Context Provider khởi tạo instance repository một lần qua `useState(() => createRepository(initialState))`.
  - Cung cấp hook `useModel()` sử dụng `useSyncExternalStore(repository.subscribe, repository.getSnapshot, repository.getSnapshot)` và gộp `{ ...state, ...repository.actions }`.
- **Kiểm tra AST trong `tests/mvvm.test.cjs` (dòng 306–338):**
  - Quét toàn bộ file `.ts` và `.tsx` trong `src/`:
    - Mọi file có đường dẫn khớp `/[\\/](screens|components)[\\/]/` **không được** chứa import khớp `/\/(repositories|providers|data|models)\//`.
    - Mọi file có đường dẫn khớp `/[\\/]repositories[\\/]/` **không được** chứa import khớp `/navigation|viewmodels|providers|^react$/`.

## 3. Các quy tắc nghiệp vụ đã xác minh tại Frontend
1. **Lịch trình (`src/features/itinerary/schemas.ts` & `models/itinerary.ts`):**
   - Bản nháp (`draft`) tách biệt với danh sách đã lưu (`itineraries`). Chỉnh sửa trên `draft` không làm thay đổi bản đã lưu cho đến khi gọi `saveDraft()` hoặc `saveEdit()`.
   - `validateStops(stops, duration)`:
     - `duration`: số nguyên từ `1` đến `3`.
     - Số lượng `stops`: từ `1` đến `8`.
     - `dayIndex`: số nguyên từ `1` đến `duration` (mặc định `1`).
     - Không cho phép hai điểm dừng có cùng `placeId` trong một lịch trình tại Frontend.
     - Thời gian `start` và `end` định dạng `HH:mm`, `start < end`, `end - start >= 30` (phút), nằm trong khoảng `06:00` (`360`) đến `22:00` (`1320`), không giao nhau trong cùng `dayIndex`.
   - **Thay thế thời tiết (`replaceOutdoorStop`):** Thay điểm dừng có `placeId === 'son-tra'` thành `'bao-tang-dn'`, giữ nguyên `start`, `end`, `dayIndex` và các điểm dừng khác.
2. **Thử thách Quiz & Đổi thưởng (`src/features/game/repositories/gameStateRepository.ts`):**
   - Khi mở lại quiz chưa hoàn thành, tự động tiếp tục tại câu đầu tiên có đáp án `null`.
   - Điểm thưởng hoàn thành quiz (`+50` điểm) chỉ cộng đúng 1 lần khi hoàn tất lần đầu; khôi phục trạng thái đã hoàn thành không cộng điểm lại.
   - Đổi ưu đãi (`redeemReward`) trừ `100` điểm và chặn đổi trùng lặp (`rewardRedeemed: true`).
3. **Khác biệt cần lưu ý khi tích hợp với Backend:**
   - Frontend hiện dùng `id: string` (ví dụ `'hoi-an'`, `'itinerary-<timestamp>'`) và ngày định dạng `'DD/MM/YYYY'` trên UI, trong khi Backend dùng `id: int` và ngày ISO `'YYYY-MM-DD'`.
   - Frontend cấm trùng `placeId` trên toàn lịch trình, còn Backend chỉ cấm trùng khung giờ trong cùng một ngày.
