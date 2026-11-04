# Quy trình sửa giao diện

1. Đọc [frame inventory](figma/FRAME_INVENTORY.md), mở node Figma/PNG tương ứng và kiểm tra ảnh gốc trong [manifest](../../design/exports/manifest.json).
2. Xác định màn hình, trạng thái, dữ liệu chung và component đang dùng. Chỉ tạo component chung khi có ít nhất hai vị trí thực sự chia sẻ ngữ nghĩa.
3. Sửa component/state ở một nơi; dùng ảnh cục bộ và route có phản hồi. Không tự suy ra API từ nhãn Figma.
4. Chạy typecheck, kiểm tra asset và Expo export; mở trên Expo Go hoặc web, thử các tương tác liên quan.
5. Chụp app ở viewport 390×844; khi so với ảnh Figma 422×876 phải tính cả viền mockup 16 px và vùng status bar. So vị trí, cỡ chữ, crop ảnh, màu, viền, trạng thái và khả năng cuộn. Ghi kết quả vào [visual review](visual/REVIEW.md).

Trạng thái hiện tại: `FIGMA_LIVE_VERIFIED` cho cấu trúc 74 frame, style và sáu ảnh chụp trực tuyến; `EXPO_WEB_SMOKE_VERIFIED` cho các luồng được ghi trong visual review. Native Android/iOS chưa được chụp trên thiết bị. Không dùng nhãn “pixel perfect” vì biểu tượng và khoảng cách còn sai khác.
