# DANANGACY — BẢNG KHẢO SÁT CHỨC NĂNG HỆ THỐNG (FUNCTIONAL INVENTORY)
## TUẦN 5: KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG PHẦN MỀM DI ĐỘNG

**Dự án:** DANANGACY — Mobile Heritage & Tourism Application
**Nền tảng:** React Native (Expo SDK 52 / React 19) + FastAPI (SQLAlchemy 2.0, PostgreSQL/SQLite)
**Tác giả kiểm toán:** Senior Mobile QA Engineer & Test Lead
**Thời điểm thực hiện:** 26/11/2026
**Nhánh Git:** `feat/wave-1-secure-gemini-and-quiz-remediation` (HEAD: `3a9af48`)

---

### TỔNG QUAN KHẢO SÁT CHỨC NĂNG (SYSTEM FUNCTIONAL INVENTORY)

Khảo sát dựa trên việc đọc và đối soát trực tiếp mã nguồn Frontend (`frontend/src/`) và Backend (`backend/app/`), hoàn toàn không dựa trên tài liệu giả định.

| Feature ID | Tên Chức Năng | Trạng Thái Triển Khai | Màn Hình / Component Liên Quan | Backend Endpoint | Quy Tắc Kiểm Tra Hợp Lệ (Validation Rules) & Nghiệp Vụ | Phụ Thuộc (Dependencies) | Độ Ưu Tiên (Priority) | Khả Năng Kiểm Thử (Testability) |
|:---|:---|:---:|:---|:---|:---|:---|:---:|:---:|
| **FEAT-AUTH-01** | Đăng nhập tài khoản (Email/Password) | **Implemented** | `AuthScreen.tsx`, `useAuthViewModel.ts` | `POST /api/auth/login` | - Email phải chứa `@`<br>- Password tối thiểu 8 ký tự<br>- Trả về JWT Access Token & User Object | `authService`, `authRepository` | **P0 (Critical)** | High (Mock, TestClient, Emulator, Live Backend) |
| **FEAT-AUTH-02** | Đăng ký tài khoản mới | **Implemented** | `AuthScreen.tsx`, `useAuthViewModel.ts` | `POST /api/auth/register` | - Họ tên không để trống<br>- Email hợp lệ<br>- Mật khẩu >= 8 ký tự và trùng khớp mật khẩu xác nhận<br>- Email trùng bị Backend từ chối 400 | `authService`, `user_service` | **P1 (High)** | High (Mock, TestClient, Live Backend) |
| **FEAT-AUTH-03** | Khôi phục mật khẩu (Demo Flow) | **Partial** | `AuthScreen.tsx` (route: `forgot`, `verify`, `reset`) | Không (chạy mock in-app) | - Email chứa `@`<br>- Mã xác nhận gồm 6 chữ số<br>- Password mới >= 8 ký tự và khớp xác nhận | `useAuthViewModel` | **P3 (Low)** | Medium (Frontend state only) |
| **FEAT-GUEST-01** | Trải nghiệm Khách (Guest Mode Local-First) | **Implemented** | `HomeScreen.tsx`, `ItineraryScreen.tsx`, `GameScreen.tsx` | Không (Local state) | - Khách được phép xem danh lam, tạo/xóa lịch trình local, làm quiz<br>- Lưu độc lập tại khóa `danangacy.itineraries.guest`<br>- Không gửi request ghi lên server | `itineraryStorage`, `localStorage` | **P0 (Critical)** | High (Node test, Emulator) |
| **FEAT-PROF-01** | Xem và Chỉnh sửa Hồ sơ | **Implemented** | `ProfileScreen.tsx`, `useProfileViewModel.ts` | `GET /api/auth/profile` | - Hiển thị Tên, Email, SĐT, Điểm thưởng, Danh sách yêu thích<br>- Chỉnh sửa draft name/email/phone lưu AsyncStorage | `profileRepository`, `appStateRepository` | **P2 (Medium)** | High (Unit, Emulator) |
| **FEAT-PROF-02** | Đăng xuất (Logout & Invalidation) | **Implemented** | `ProfileScreen.tsx`, `authRepository.ts` | Không (Client revocation) | - Xóa JWT trong RAM và ghi `signedIn: false, token: null` vào `danangacy.demo.v1`<br>- Tách biệt scope trở về Guest, không auto-login lại | `AppProvider`, `AccountItineraryScope` | **P0 (Critical)** | High (Node test, Emulator) |
| **FEAT-ITIN-01** | Đọc danh sách Lịch trình | **Implemented** | `ItineraryScreen.tsx`, `useItineraryViewModel.ts` | `GET /api/v1/itineraries` | - Guest: Đọc từ local storage `guest`<br>- User: Đọc từ local user scope và reconcile từ server | `itineraryService`, `itineraryStorage` | **P0 (Critical)** | High (Unit, Emulator, Live Backend) |
| **FEAT-ITIN-02** | Tạo mới Lịch trình (Create) | **Implemented** | `ItineraryScreen.tsx`, `ItineraryStopsEditor.tsx` | `POST /api/v1/itineraries` | - Số ngày: 1..3 ngày (nguyên dương)<br>- Số chặng dừng: 1..8 chặng<br>- Không trùng điểm đến (`placeId`)<br>- Khung giờ: 06:00 - 22:00, thời lượng >= 30p, không trùng giờ cùng ngày | `validateStops`, `itineraryCrudOrchestrator` | **P0 (Critical)** | High (Unit, Pytest, Emulator) |
| **FEAT-ITIN-03** | Chỉnh sửa Lịch trình (Update & OCC) | **Implemented** | `ItineraryScreen.tsx`, `StopCard.tsx`, `TimeEditor.tsx` | `PATCH /api/v1/itineraries/{id}` | - Gửi kèm `version` hiện tại<br>- Nếu server version > client version: Backend ném **HTTP 409 Conflict**<br>- Frontend mở `ConflictResolutionModal` | `itineraryConflictOrchestrator` | **P0 (Critical)** | High (Pytest, Node test, Live HTTP) |
| **FEAT-ITIN-04** | Xóa Lịch trình (Delete) | **Implemented** | `ItineraryScreen.tsx` | `DELETE /api/v1/itineraries/{id}` | - Bắt buộc hiển thị Alert confirmation trước khi xóa<br>- Backend xóa mềm (`deleted_at = now()` và tăng version)<br>- Cục bộ dọn sạch khỏi danh sách | `itineraryCrudOrchestrator` | **P1 (High)** | High (Unit, Pytest, Emulator) |
| **FEAT-PERSIST-01** | Lưu trữ cục bộ đa tài khoản (Account Scoping) | **Implemented** | `AppProvider.tsx`, `itineraryStorage.ts` | Không | - Khóa Guest: `danangacy.itineraries.guest`<br>- Khóa User: `danangacy.itineraries.user.<uid>`<br>- Cách ly tuyệt đối dữ liệu legacy không rõ nguồn gốc | `@react-native-async-storage/async-storage` | **P0 (Critical)** | High (Node test, Storage audit) |
| **FEAT-PERSIST-02** | Cổng nạp Hydration Gate | **Implemented** | `AppProvider.tsx` (`AccountItineraryScope`) | Không | - Nếu `hydratedState.key !== accountKey` thì không render Provider cũ, chống flash dữ liệu | `React.useEffect` | **P1 (High)** | High (Node test AST) |
| **FEAT-SYNC-01** | Đối soát từ xa (Remote Reconciliation) | **Implemented** | `itineraryReconciliation.ts`, `itineraryFetchOrchestrator.ts` | `GET /api/v1/itineraries` | - Giữ nguyên các chỉnh sửa local chưa sync (`dirty`/`unsynced`)<br>- Tránh ID collision và không tạo duplicate `remoteId`<br>- Vô hiệu hóa response khi đổi session | `Mutation Coordinator`, `sessionGeneration` | **P0 (Critical)** | High (Node test suite 31 tests) |
| **FEAT-CONF-01** | Giao diện Xử lý Xung đột (Conflict Resolution UX) | **Implemented** | `ConflictResolutionModal.tsx` | `GET /api/v1/itineraries/{id}`, `PATCH` | - So sánh sâu Local vs Server: tiêu đề, số ngày, chặng dừng (`placeId`, `dayIndex`, `start`, `end`)<br>- Viền cam highlight chặng bị sửa<br>- Lựa chọn: "Dùng bản Server", "Giữ bản Local", "Để sau" | `itineraryConflictOrchestrator` | **P0 (Critical)** | High (Node test 32 tests, Emulator) |
| **FEAT-WEATH-01** | Dự báo thời tiết Đà Nẵng | **Implemented** | `HomeScreen.tsx`, `weatherService.ts` | `GET /api/weather/danang` (hoặc Open-Meteo) | - Trả về nhiệt độ (°C) và phân loại thời tiết (Nắng, Mưa, Mây, Giông bão)<br>- Fallback dữ liệu tĩnh khi mất mạng | Open-Meteo API, Backend proxy | **P2 (Medium)** | High (Mock, Live Backend) |
| **FEAT-AI-01** | Trợ lý di sản AI (Gemini Guide) | **Implemented** | `HomeScreen.tsx`, `ExploreScreen.tsx`, `geminiService.ts` | `POST /api/ai/heritage-guide`, `POST /api/ai/generate` | - Backend che giấu Gemini API Key<br>- Fallback cẩm nang di sản theo slug khi cạn credit (402) hoặc lỗi mạng | Google Gemini Flash, Backend proxy | **P2 (Medium)** | High (Mock, Pytest, Live HTTP) |
| **FEAT-QUIZ-01** | Thử thách Trắc nghiệm Di sản | **Implemented** | `GameScreen.tsx`, `QuizAnswer.tsx`, `gameService.ts` | `GET /api/quizzes`, `POST /api/quizzes/{id}/attempt` | - Danh sách câu hỏi kèm Option IDs thực tế từ DB<br>- Gửi payload chấm điểm lên server có Bearer token<br>- Chống submit trùng và tính điểm thưởng (100 điểm/quiz) | `quiz_service`, `gameStateRepository` | **P1 (High)** | High (Unit, Pytest, Emulator) |
| **FEAT-REWARD-01** | Đổi Voucher & Ví Quà tặng | **Implemented** | `RewardsContent.tsx`, `useGameViewModel.ts` | `GET /api/rewards`, `POST /api/rewards/redeem` | - Đổi voucher khi đủ điểm thưởng (VD: 100 điểm)<br>- Lưu trạng thái đã đổi, không cho đổi lặp lại nếu không đủ điểm | `gameStateRepository` | **P2 (Medium)** | High (Unit, Pytest, Emulator) |
| **FEAT-NAV-01** | Điều hướng Bottom Tabs & Back Stack | **Implemented** | `AppNavigator.tsx`, `Tabs.tsx`, `createNavigation.ts` | Không | - 5 Tabs: Khám phá, Lịch trình, Trang chủ, Thử thách, Tài khoản<br>- Hỗ trợ `canGoBack()` và fallback tab `home` | In-house Navigation Store | **P1 (High)** | High (AST, Emulator) |
| **FEAT-NET-01** | Cơ chế chịu lỗi kết nối mạng (Network Resilience) | **Implemented** | `config/api.ts`, Orchestrators | Toàn bộ API | - Timeout sau 10 giây<br>- Giữ dữ liệu local offline<br>- Gắn nhãn trạng thái "Chưa đồng bộ" khi không có mạng | `fetch`, `AbortController` | **P0 (Critical)** | High (Offline test, Node test) |

---

### KẾT LUẬN ĐÁNH GIÁ KHẢO SÁT

- **Tổng số chức năng khảo sát:** 20 tính năng thành phần trải dài trên 14 nhóm nghiệp vụ.
- **Tỷ lệ hoàn thiện:** 19/20 tính năng đã được triển khai đầy đủ (**Implemented**), 1 tính năng khôi phục mật khẩu triển khai một phần (**Partial** dạng demo in-app).
- **Mức độ rủi ro:** Các nhóm chức năng có độ rủi ro cao nhất tập trung vào: **Xác thực (Auth)**, **Lưu trữ đa tài khoản (Account Isolation)**, **Đột biến Lịch trình (CRUD)**, và **Đồng bộ / Xung đột (Sync & Conflict Resolution)**.
