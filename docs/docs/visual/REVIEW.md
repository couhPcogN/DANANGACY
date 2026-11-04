# Đối chiếu giao diện với Figma

## Nguồn kiểm tra

- Đã đọc trực tiếp [trang Figma 01 · Mockup & UI kit](https://www.figma.com/design/jDD0jsGqFT7O88xKzG8Yrj/danangacy?node-id=0-1) ngày 05/11/2026. Metadata xác nhận 74 frame ứng dụng 390×844, cùng bảng UI foundations và bottom navigation. [Bảng node ID](../../../design/figma-nodes.json) nối từng frame online với 74 SVG export.
- Phần lớn PNG/SVG export rộng 422×876 vì bao gồm viền mockup 16 px quanh frame 390×844. Ba ảnh chụp trực tiếp từ Figma (Chào mừng, Home, Explore) có sai khác màu trung bình mỗi kênh dưới 2/255 so với PNG kết xuất từ SVG tương ứng; bản export là nguồn tham chiếu phù hợp.
- Chữ trong Figma dùng Be Vietnam Pro. App đã đóng gói Regular, SemiBold và Bold; cả 9 ảnh gốc được tách từ SVG, giữ nguyên byte và tham chiếu tương đối trong `src/data.ts`.

## So từng màn hình chính

Ảnh app được chụp từ Expo Web ở viewport 390×844. Ảnh Figma có viền mockup và giờ 9:41 giả; khi so vị trí nội dung cần bỏ viền ngoài và tính đến status bar/safe area của thiết bị.

| Màn hình | Figma trực tuyến | Ảnh app | Kết quả đối chiếu |
|---|---|---|---|
| Chào mừng A01 | [PNG](../../../design/comparisons/figma-live-welcome.png) | [PNG](../../../design/comparisons/app-welcome-final.png) | Đúng ảnh toàn cảnh, thứ tự nội dung, màu, font, nút chính/phụ. Biểu tượng di sản và ghim là Ionicons nên nét khác bản vẽ. |
| Home trước tạo lịch | [PNG](../../../design/comparisons/figma-live-home.png) | [PNG](../../../design/comparisons/app-home-final.png) | Đúng ảnh thời tiết, lịch Hội An, hai ảnh gợi ý đầu, thử thách và tab. Badge, biểu tượng thời tiết và khoảng cách card còn khác nhẹ. |
| Explore | [PNG](../../../design/comparisons/figma-live-explore.png) | [PNG](../../../design/comparisons/app-explore-final.png) | Đúng năm điểm đến, ảnh và thứ tự card, tìm kiếm/lọc, tab. Cỡ card, icon tìm kiếm và các khoảng cách còn khác. |
| Tạo lịch bước 1 C02 | [PNG](../../../design/comparisons/figma-live-trip-info.png) | [PNG](../../../design/comparisons/app-trip-info-final.png) | Đúng cấu trúc 3 bước, giá trị ngày giờ, nhãn và CTA. Field ngày có nhãn phụ định dạng, icon khác bản thiết kế. |
| Mini game E01 | [PNG](../../../design/comparisons/figma-live-game.png) | [PNG](../../../design/comparisons/app-game-final.png) | Ba thẻ thử thách hiện trọn vẹn, đúng nội dung, tiến độ thẻ đầu và tab. Icon thử thách dùng thư viện thay icon Figma. |
| Hồ sơ G01 sau đổi ưu đãi | [PNG](../../../design/comparisons/figma-live-profile.png) | [PNG](../../../design/comparisons/app-profile-70-final.png) | Đúng trạng thái 70 điểm, một ưu đãi, thử thách hoàn thành và danh sách mục. Chiều cao các khối/chữ phụ còn khác nhẹ. |

## Kiểm tra tương tác

- Expo Web: chào mừng → đăng nhập mẫu → Home; khách → Explore; lọc/tìm/chi tiết và yêu thích.
- Tạo lịch ba bước → xem lại → lưu; lịch đã lưu còn sau khi tải lại. Chỉnh giờ có thông báo lỗi; cảnh báo mưa → chọn Bảo tàng Đà Nẵng → xác nhận thay Sơn Trà, giữ khung 14:00–16:00.
- Tiếp tục từ câu 2/5 (câu 1 đã được trả lời đúng trong mẫu), trả lời ba câu đúng và câu 4 sai → 4/5 và cộng 50 điểm một lần; đổi ưu đãi 100 điểm → hồ sơ còn 70 điểm, mã ưu đãi và trạng thái lưu còn sau khi tải lại.
- Các luồng trên không phát sinh lỗi runtime trong kiểm tra Chrome DevTools. `npm run typecheck`, `npm run export:web`, `npm run export:android` và `python scripts/verify-assets.py` đều được dùng làm cổng kiểm tra.

## Khác biệt và giới hạn

- App dùng Ionicons để giữ UI có thể tương tác; vài icon, nét vẽ, đổ bóng và khoảng cách chưa trùng từng pixel. Bản đồ là sơ đồ minh họa, không có dữ liệu bản đồ thật.
- Một số trạng thái C07 và ưu đãi được gom thành UI tương tác thay vì tạo 74 trang tĩnh riêng. Xác thực, thời tiết, điểm và mã ưu đãi vẫn là dữ liệu demo tại máy.
- Đã đóng gói được Android, nhưng máy kiểm tra thiếu dung lượng cho Android Emulator nên chưa có ảnh chụp chạy native. Cần kiểm tra safe area, bàn phím và tab trên thiết bị Android/iOS thực tế trước khi phát hành.
