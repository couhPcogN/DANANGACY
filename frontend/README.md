# DANANGACY

Ứng dụng React Native + Expo để khám phá điểm đến Đà Nẵng, tạo lịch trình, tham gia thử thách và đổi ưu đãi mô phỏng. Thiết kế được dựng từ **74 frame SVG Figma export** do chủ dự án cung cấp, sau đó đối chiếu với file Figma trực tuyến. Các bản thiết kế được lưu tại [design/exports](design/exports/).

## Chạy app

Yêu cầu Node.js 22.13 trở lên và npm. Trong thư mục này:

```powershell
npm install
npm start
```

Mở Expo Go và quét mã QR, hoặc chọn Android Emulator nếu máy đủ dung lượng. Bản này dùng Expo SDK 58. Để chạy giao diện trên trình duyệt: `npm run web`.

## Kiểm tra

```powershell
npm run typecheck
npm run format:check
npm test
npm run export:web
npm run export:android
```

Chạy `npm run format` để định dạng mã frontend. TypeScript bật kiểm tra import, biến và tham số không dùng. Các component dùng chung có kiểu props riêng; xử lý chỉnh giờ lịch trình và hiển thị đáp án quiz được gom vào component và ViewModel tương ứng.

Các thư mục `.tmp/`, `.expo/`, `dist/` và `web-build/` là dữ liệu tạm hoặc kết quả sinh tự động, được bỏ qua trong Git và có thể xóa khi không dùng. `node_modules/` chứa dependency để chạy app; `assets/` và `design/` chứa tài nguyên và thiết kế tham chiếu.

Ảnh gốc nằm tại [`assets/images`](assets/images/), được tham chiếu tương đối bằng `require(...)` trong [`src/config/images.ts`](src/config/images.ts). [`design/exports`](design/exports/) và [`design/previews`](design/previews/) là nguồn đối chiếu, không được dùng làm ảnh toàn màn hình khi app chạy. Ảnh chụp app để so sánh nằm tại [`design/comparisons`](design/comparisons/).

## Cấu trúc frontend

```text
App.tsx                         # Ghép AppProviders và AppNavigator
src/
├── features/
│   ├── auth/                   # Đăng nhập, đăng ký, khôi phục mật khẩu
│   ├── home/                   # Trang chủ
│   ├── explore/                # Tìm kiếm, bản đồ, chi tiết và yêu thích
│   ├── itinerary/              # Tạo, sửa và thay thế điểm trong lịch trình
│   ├── game/                   # Quiz, điểm và ưu đãi
│   └── profile/                # Hồ sơ và danh sách yêu thích
├── components/
│   ├── ui/                     # Button, Field, Card, Label…
│   └── layout/                 # Screen, Header, Tabs
├── navigation/                 # Route types, stack và AppNavigator
├── providers/                  # Composition, khởi tạo và lưu snapshot
├── lib/state/                  # Observable store độc lập với React
├── lib/storage/                # AsyncStorage và repository lưu trạng thái demo
├── config/images.ts            # Tham chiếu ảnh cục bộ
├── theme/                      # Màu sắc, khoảng cách, bo góc
└── utils/                      # Thông báo dùng chung
```

Mỗi tính năng đặt giao diện trong `screens/`, component riêng trong `components/`, trạng thái form và thao tác màn hình trong `viewmodels/`, dữ liệu mẫu trong `data/`, các thao tác dữ liệu trong `repositories/`. `providers/` của tính năng cấp model cho ViewModel. `models/`, `types.ts` và `schemas.ts` được thêm khi cần phép biến đổi dữ liệu, kiểu hoặc kiểm tra đầu vào.

Luồng MVVM: **View → ViewModel → Model/Repository**. Screen không đọc repository hoặc sửa bộ sưu tập trực tiếp. Mỗi tính năng có repository và model state riêng, được quan sát bằng `useSyncExternalStore`; ViewModel điều phối form và navigation. `AppProvider` chỉ khởi tạo các provider và phối hợp lưu snapshot qua `appStateRepository`, không còn `useApp()` chứa toàn bộ state. Dữ liệu dùng khóa `danangacy.demo.v1` với trường danh sách `itineraries`; bản lưu cũ có trường `trips` vẫn được đọc và chuyển đổi.

Xem [mô tả MVVM chi tiết](../docs/MOBILE_MVVM.md) để hiểu trách nhiệm từng lớp, luồng lưu dữ liệu và cách thêm tính năng.

Bản hiện tại giữ bộ điều hướng stack sẵn có trong `src/navigation`, chưa chuyển sang Expo Router. Các màn hình cùng tính năng tiếp tục dùng chung vòng đời component để giữ dữ liệu form và hành vi quay lại. Font, JSX, style và ảnh giữ nguyên. Ứng dụng hiện dùng dữ liệu demo, chưa có API client hoặc cơ chế đăng nhập backend; phiên demo được lưu cùng trạng thái ứng dụng, không lưu mật khẩu.

## Bản demo

Đăng nhập mẫu bằng email hợp lệ và mật khẩu tối thiểu 8 ký tự (trường đã điền sẵn). Khách vẫn có thể vào Khám phá. Lịch trình, yêu thích, hồ sơ, phiên mẫu, điểm và ưu đãi được lưu trên thiết bị. Thời tiết, Google sign-in, bản đồ và mã ưu đãi là mô phỏng; app không gọi API thật.

Ảnh chụp từ file Figma trực tuyến và ảnh chụp app được lưu trong [design/comparisons](design/comparisons/).
