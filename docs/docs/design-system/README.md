# Design system

## Token xác nhận từ Figma và SVG export

| Vai trò | Giá trị | Dùng cho |
|---|---|---|
| Primary | `#FF8A00` | Nút chính, lựa chọn đang hoạt động, tiến độ |
| Primary text | `#B35F00` | Chữ cam trên nền sáng |
| Primary dark | `#A65300` | Trạng thái nhấn và nhãn đậm |
| Ink | `#172B3A` | Tiêu đề, nội dung chính |
| Muted | `#757575` | Mô tả phụ |
| Border | `#E7E7E7` | Viền card, trường nhập, đường phân cách |
| Surface subtle | `#F7F7F7` | Nền trường nhập |
| Warm | `#FFF2E2` | Card gợi ý, nút phụ, badge |
| Warm border | `#FFE0B8` | Viền chú thích màu cam |
| Success | `#17876D`, `#E3F4EF` | Đã lưu, đúng, trong nhà |
| Info | `#176B88`, `#E4F1F5` | Cảnh báo mưa và điểm ngoài trời |

Màu được đọc từ `fill` và `stroke` của SVG, rồi kiểm tra với style Figma trực tuyến. Font thiết kế là **Be Vietnam Pro**. App đóng gói ba độ đậm Regular 400, SemiBold 600 và Bold 700 từ `@expo-google-fonts/be-vietnam-pro` qua `expo-font`; chữ trên màn hình dùng các cỡ 12, 13, 14, 15, 16, 20, 24, 36 theo từng vai trò. Xem [gói font chính thức của Expo](https://github.com/expo/google-fonts/tree/main/font-packages/be-vietnam-pro).

## Hình học và thành phần chung

- Frame thiết kế Figma là 390×844. Phần lớn ảnh SVG/PNG export là 422×876 vì có thêm viền mockup 16 px quanh frame; một số trạng thái được export đúng 390×844. App thực tế dùng safe area và chiều rộng linh hoạt.
- Khoảng đệm ngang phần nội dung khoảng 20–24, card và nút bo khoảng 14–16, trường nhập cao khoảng 48–52. Tất cả giá trị là quan sát từ bản export, có thể điều chỉnh khi so ảnh trên thiết bị.
- Component chung trong [`src/ui.tsx`](../../../src/ui.tsx): `Screen`, `Header`, `Button`, `Field`, `Card`, `Pill`, `PlaceRow`, `PlacePhoto`, `InfoBanner`, `Progress`, `Tabs`.
- Thanh tab: **Trang chủ, Khám phá, Lịch trình, Mini game, Hồ sơ**. Chỉ dùng một component và một nguồn trạng thái đang chọn.
- Ảnh địa điểm phải giữ đúng vị trí/crop trong từng card. Dùng ảnh gốc đã tách, không nhúng ảnh SVG toàn màn hình.

## Tính dễ dùng

Cho phép cuộn trên máy thấp; vùng chạm tối thiểu 44×44; input có nhãn và hỗ trợ bàn phím; thông báo lỗi xuất hiện bằng chữ và màu; không chỉ dựa vào màu để biểu thị lựa chọn. Không vẽ giờ/status bar giả trong vùng ứng dụng. Nội dung dài không bị cắt bởi thanh tab hay bàn phím.
