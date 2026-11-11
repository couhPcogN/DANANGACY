# DANANGACY

Ứng dụng React Native + Expo để khám phá điểm đến Đà Nẵng, tạo lịch trình, tham gia thử thách và đổi ưu đãi mô phỏng. Thiết kế được dựng từ **74 frame SVG Figma export** do chủ dự án cung cấp, sau đó đối chiếu với file Figma trực tuyến. Xem [bộ tài liệu dự án](docs/docs/README.md) và [danh mục frame](docs/docs/figma/FRAME_INVENTORY.md).

## Chạy app

Yêu cầu Node.js 22.13 trở lên và npm. Trong thư mục này:

```powershell
npm install
npm start
```

Mở Expo Go và quét mã QR, hoặc chọn Android Emulator nếu máy đủ dung lượng. Bản này dùng Expo SDK 57. Để chạy giao diện trên trình duyệt: `npm run web`.

## Kiểm tra

```powershell
npm run typecheck
npm run export:web
npm run export:android
python scripts/verify-assets.py
```

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
├── providers/                  # Font, safe area, ghép state và khôi phục dữ liệu
├── lib/storage/                # AsyncStorage và repository lưu trạng thái demo
├── config/images.ts            # Tham chiếu ảnh cục bộ
├── theme/                      # Màu sắc, khoảng cách, bo góc
└── utils/                      # Thông báo dùng chung
```

Mỗi tính năng đặt giao diện trong `screens/`, component riêng trong `components/`, state và thao tác màn hình trong `viewmodels/`, dữ liệu mẫu và thao tác dữ liệu trong `repositories/`. `types.ts` và `schemas.ts` được thêm ở những tính năng cần kiểu dữ liệu hoặc kiểm tra nghiệp vụ. Không tạo các lớp rỗng cho tính năng chưa cần chúng.

Luồng xử lý: **Screen → ViewModel → Repository**. Các hook `use…State` giữ trạng thái dùng chung của từng tính năng; các hook `use…ViewModel` quản lý form, bộ lọc và thao tác của màn hình. `AppProvider` ghép các hook này, khôi phục và lưu trạng thái qua `appStateRepository`. Dữ liệu vẫn dùng khóa `danangacy.demo.v1` và định dạng cũ.

Bản hiện tại giữ bộ điều hướng stack sẵn có trong `src/navigation`, chưa chuyển sang Expo Router. Các màn hình cùng tính năng tiếp tục dùng chung vòng đời component để giữ dữ liệu form và hành vi quay lại. Font, JSX, style và ảnh giữ nguyên. Ứng dụng hiện dùng dữ liệu demo, chưa có API client hoặc cơ chế đăng nhập backend; phiên demo được lưu cùng trạng thái ứng dụng, không lưu mật khẩu.

## Bản demo

Đăng nhập mẫu bằng email hợp lệ và mật khẩu tối thiểu 8 ký tự (trường đã điền sẵn). Khách vẫn có thể vào Khám phá. Lịch trình, yêu thích, hồ sơ, phiên mẫu, điểm và ưu đãi được lưu trên thiết bị. Thời tiết, Google sign-in, bản đồ và mã ưu đãi là mô phỏng; app không gọi API thật.

Ảnh chụp từ file Figma trực tuyến và ảnh chụp app được lưu trong [design/comparisons](design/comparisons/). Kết quả cùng các khác biệt còn lại được ghi trong [visual review](docs/docs/visual/REVIEW.md).
