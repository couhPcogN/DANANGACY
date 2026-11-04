# DANANGACY — tài liệu ứng dụng di động

Ứng dụng khám phá di sản Đà Nẵng, tạo lịch trình cá nhân, tham gia thử thách và nhận ưu đãi **mô phỏng**. Giao diện được dựng bằng React Native + Expo từ 74 frame SVG do chủ dự án xuất từ Figma và được đối chiếu với [file Figma trực tuyến](https://www.figma.com/design/jDD0jsGqFT7O88xKzG8Yrj/danangacy?node-id=0-1).

## Đọc theo thứ tự

1. [Danh mục 74 frame](figma/FRAME_INVENTORY.md) và [nguồn ảnh](assets/README.md).
2. [Luồng màn hình và trạng thái](navigation/ROUTES_AND_STATES.md).
3. [Design system](design-system/README.md) và [kiến trúc Expo](architecture/EXPO_APP.md).
4. [Đặc tả tính năng](features/README.md), [quy trình phát triển](AI_WORKFLOW.md) và [đối chiếu giao diện](visual/REVIEW.md).

## Nguồn và mức tin cậy

- Nguồn thiết kế: các file SVG trong [`design/exports`](../../design/exports/) được chép từ `D:\Downloads\danangacy`. [`manifest.json`](../../design/exports/manifest.json) ghi tên frame, kích thước và ảnh gốc gắn với từng frame. Ảnh kết xuất để đọc nằm trong [`design/previews`](../../design/previews/).
- Các file SVG có chữ chuyển thành path. File Figma trực tuyến đã được đọc qua tài khoản kết nối Primary ngày 05/11/2026: xác nhận 74 frame thiết kế, tên, node ID, kích thước frame 390×844 và style Be Vietnam Pro. Bảng [figma-nodes.json](../../design/figma-nodes.json) nối từng SVG export với node Figma.
- Ảnh chụp trực tuyến của ba màn hình chính được lưu tại [`design/comparisons`](../../design/comparisons/), cùng ảnh chụp app để đối chiếu. Các chi tiết về khoảng cách, biểu tượng và trạng thái đơn giản hóa nằm trong [báo cáo đối chiếu](visual/REVIEW.md).
- Thời tiết, đổi ưu đãi, điểm và đăng nhập trong bản chạy mẫu là dữ liệu tại máy. Bản export không cung cấp API, quy tắc xác thực, thanh toán hay nguồn dự báo thật.

## Ranh giới triển khai

Tất cả ảnh được lưu trong dự án và tham chiếu bằng đường dẫn tương đối. Frame SVG chỉ là ảnh tham chiếu, không được dùng làm ảnh toàn màn hình trong app. Giao diện dùng component có thể tương tác, dữ liệu mẫu nhất quán và không cần mạng để trình diễn. Font Be Vietnam Pro được đóng gói trong app. Khi tích hợp dịch vụ thật, giữ nguyên hợp đồng giao diện màn hình và thay lớp dữ liệu mẫu.

Tài liệu TutorNET cũ được lưu ở [`docs/legacy-tutornet`](../legacy-tutornet/) để tham khảo quy trình; nội dung đó không mô tả DANANGACY.
