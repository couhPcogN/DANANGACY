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

Ảnh gốc nằm tại [`assets/images`](assets/images/), được tham chiếu tương đối bằng `require(...)` trong [`src/data.ts`](src/data.ts). [`design/exports`](design/exports/) và [`design/previews`](design/previews/) là nguồn đối chiếu, không được dùng làm ảnh toàn màn hình khi app chạy. Ảnh chụp app để so sánh nằm tại [`design/comparisons`](design/comparisons/).

## Bản demo

Đăng nhập mẫu bằng email hợp lệ và mật khẩu tối thiểu 8 ký tự (trường đã điền sẵn). Khách vẫn có thể vào Khám phá. Lịch trình, yêu thích, hồ sơ, phiên mẫu, điểm và ưu đãi được lưu trên thiết bị. Thời tiết, Google sign-in, bản đồ và mã ưu đãi là mô phỏng; app không gọi API thật.

Ảnh chụp từ file Figma trực tuyến và ảnh chụp app được lưu trong [design/comparisons](design/comparisons/). Kết quả cùng các khác biệt còn lại được ghi trong [visual review](docs/docs/visual/REVIEW.md).
