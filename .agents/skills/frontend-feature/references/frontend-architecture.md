# Tham chiếu Kiến trúc & Nghiệp vụ Frontend (`frontend/`)

Tài liệu này tóm tắt cấu trúc kỹ thuật và các quy tắc đã được xác minh từ mã nguồn `frontend/`.

## 1. Cấu trúc thư mục thực tế
```text
frontend/
├── App.tsx                                  # Entry point bọc AppProviders và AppNavigator
├── package.json                             # Scripts: start, web, typecheck, format:check, test
├── tests/
│   ├── mvvm.test.cjs                        # Kiểm thử State, Responsive, Navigation, Persistence, MVVM AST
│   ├── weather_gemini.test.cjs              # Kiểm thử Weather code, AI backend routing & fallback
│   ├── quiz_service.test.cjs                # Kiểm thử ID mapping thực tế, anti-cheat contract, và guest flow
│   ├── auth_service.test.cjs                # Mock fetch test cho Auth API
│   └── guest_user_flow.test.cjs             # Test vòng đời Guest -> Login -> User -> Logout
└── src/
    ├── app/
    │   ├── navigation/                      # Custom stack/tab navigator (createNavigation, AppNavigator)
    │   └── providers/                       # AppProviders, AppProvider (đồng bộ snapshot AsyncStorage)
    ├── config/
    │   ├── api.ts                           # Cấu hình API_BASE_URL (Web vs Mobile LAN)
    │   └── images.ts                        # Bản đồ require() ảnh cục bộ từ assets/images/
    ├── features/
    │   ├── auth/                            # Đăng nhập, đăng ký, khôi phục mật khẩu demo
    │   ├── home/                            # Màn hình chính, gợi ý thời tiết & lời khuyên AI
    │   ├── explore/                         # Tìm kiếm, lọc trong nhà/ngoài trời, thuyết minh di sản AI
    │   ├── itinerary/                       # Tạo, sửa, kiểm tra lịch trình & thay thế điểm khi mưa
    │   ├── game/                            # Thử thách quiz 5 câu, tính điểm & đổi ưu đãi
    │   └── profile/                         # Thông tin hồ sơ & danh sách yêu thích
    ├── services/
    │   ├── ai/
    │   │   └── geminiService.ts             # AI client gọi Backend /api/ai/* kèm fallback cục bộ
    │   ├── api/                             # authService, gameService, itineraryService, placeService
    │   └── storage/
    │       ├── localStorage.ts              # Wrapper AsyncStorage
    │       └── appStateRepository.ts        # Đọc/ghi snapshot khóa 'danangacy.demo.v1'
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
- **Kiểm tra AST trong `tests/mvvm.test.cjs`:**
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
   - **Đồng bộ câu hỏi từ Backend (`src/features/game/viewmodels/useGameViewModel.ts`):** Khi đã đăng nhập, câu hỏi hiển thị được chuyển đổi trực tiếp từ `BackendQuiz.questions` sang `DisplayQuizQuestion`, bảo toàn `id` câu hỏi và `options` thực tế. Đáp án của người dùng được lưu vết theo `selectedOptionsByQId: Record<number, number>` mapping `question_id -> selected_option_id`.
   - **Loại bỏ tự tạo đáp án:** Payload nộp bài chỉ bao gồm các câu hỏi đã được người dùng thực sự chọn đáp án. Không tự động chọn `q.options[0]` khi câu trả lời mang giá trị `null`.
   - **Đóng băng bộ câu hỏi khi làm bài:** Khi bấm `startQuiz()`, danh sách câu hỏi đang làm được khóa lại, không bị ảnh hưởng nếu kết quả fetch mạng trả về muộn.
   - **Phân định Guest vs User:** Khách (`!token`) chỉ trải nghiệm `demoQuiz` ở chế độ mô phỏng, hiển thị rõ `(Mô phỏng)` và không gửi request lên máy chủ. Người dùng đăng nhập nhận kết quả xác nhận và số dư ví đồng bộ từ Backend.
   - **Technical Debt ghi nhận:** Hàm `findQuizForChallenge` hiện tại so khớp Quiz dựa trên tiêu đề văn bản (`'Hiện vật Chăm Pa'`). Đây là giải pháp chắp vá tạm thời để tương thích với dữ liệu mẫu; kiến trúc dài hạn cần chuyển sang liên kết tường minh qua `destination_id` hoặc mã định danh ổn định của thử thách.
3. **Khác biệt cần lưu ý khi tích hợp với Backend:**
   - Frontend hiện dùng `id: string` (ví dụ `'hoi-an'`, `'itinerary-<timestamp>'`) và ngày định dạng `'DD/MM/YYYY'` trên UI, trong khi Backend dùng `id: int` và ngày ISO `'YYYY-MM-DD'`.
   - Frontend cấm trùng `placeId` trên toàn lịch trình, còn Backend chỉ cấm trùng khung giờ trong cùng một ngày.

## 4. Tích hợp Dịch vụ AI & Xử lý Ngoại tuyến
- **Bảo vệ Secret:** Không lưu trữ API key của AI trên client. Mọi giao tiếp với Gemini được chuyển tiếp qua Backend API (`POST /api/ai/generate` và `POST /api/ai/heritage-guide`).
- **Cấu hình `API_BASE_URL` (`src/config/api.ts`):** Sử dụng `process.env.EXPO_PUBLIC_API_URL` để thiết lập endpoint backend phù hợp theo từng môi trường. Hiện tại, `src/config/api.ts` sử dụng fallback `DEFAULT_URL` (`http://127.0.0.1:8000` trên Web và `http://${LAN_IP}:8000` trên Mobile với biến `LAN_IP` tạm thời đang bị hardcode). Việc loại bỏ biến `LAN_IP` hardcode để chuyển đổi hoàn toàn sang cấu hình môi trường động là technical debt cần giải quyết ở các wave kế tiếp.
- **Cơ chế Fallback theo ngữ cảnh:** File `src/services/ai/geminiService.ts` duy trì kho dữ liệu dự phòng `LOCAL_HERITAGE_KNOWLEDGE` cho các địa danh được định nghĩa sẵn trong mã nguồn (như `cham`, `son-tra`, `ngu-hanh-son`, `cau-rong`, `bao-tang-dn`). Khi mất kết nối mạng hoặc Backend không phản hồi, client kích hoạt fallback theo đúng slug điểm đến được yêu cầu và trả về `source: 'local-fallback'`, giúp giao diện không bị gián đoạn. Lưu ý: Cơ chế phần mềm fallback đã được kiểm thử hồi quy thành công, nhưng tính chuẩn xác về mặt lịch sử/văn hóa của các đoạn thuyết minh fallback chưa qua kiểm chứng nghiệp vụ chuyên gia.
