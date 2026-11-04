# Điều hướng và trạng thái

Tên route bên dưới là lựa chọn của ứng dụng Expo, không phải deep link hay endpoint backend. Hành vi được suy luận từ các frame liên tiếp, nhãn nút và cấu trúc đọc được từ Figma.

| Điểm vào | Luồng | Bằng chứng export |
|---|---|---|
| Chào mừng | Đăng nhập / Đăng ký / Khám phá ngay | A01–A06 |
| Trang chủ | Xem thời tiết, lịch sắp tới, gợi ý, thử thách | Home trước/sau khi tạo lịch |
| Khám phá | Tìm kiếm, lọc, xem chi tiết, lưu yêu thích, bản đồ | Explore, B01–B06, B01A |
| Lịch trình | Danh sách → thông tin chuyến đi → sở thích/nhịp độ → chọn điểm → xem lại → lưu → chi tiết | C01–C07J |
| Chi tiết lịch trình | Chỉnh giờ/địa điểm, cảnh báo mưa, gợi ý thay thế, xác nhận | C06, C07, D01–D03 |
| Mini game | Danh sách → giới thiệu → 5 câu → kết quả → xem lại đáp án | E01–E05 |
| Phần thưởng | Danh sách → chi tiết → đổi điểm → ưu đãi của tôi | F01–F04 |
| Hồ sơ | Chỉnh thông tin, lịch trình, yêu thích, ưu đãi, thử thách | G01–G03A |

## Hợp đồng trạng thái quan trọng

- Xác thực: `guest`, `signedIn`, form `idle/invalid/submitting`. Đăng nhập mẫu chỉ tạo phiên trong app; Google là nút giao diện và báo chưa có tích hợp.
- Yêu thích: một tập ID địa điểm dùng chung cho Explore, chi tiết địa điểm và Hồ sơ. `B01A`/`G03A` là trạng thái sau khi lưu và trống.
- Lịch trình: bản nháp tách khỏi bản đã lưu; hủy chỉnh sửa hoàn nguyên. Giờ bắt đầu < giờ kết thúc, nằm trong ngày chuyến đi, không trùng slot khác. Ngoài giờ mở cửa là cảnh báo riêng. Các frame C06 Ready/InvalidRange/Conflict/HoursWarning và C07C–G là bằng chứng cho các trạng thái này.
- Thời tiết: cảnh báo mẫu 80% mưa tại Sơn Trà lúc 14:00–16:00; người dùng có thể giữ lịch hoặc thay bằng Bảo tàng Đà Nẵng. Chỉ cập nhật lịch sau khi xác nhận, giữ nguyên khung giờ.
- Mini game: mẫu đang ở câu 2/5 nên câu 1 đã có đáp án đúng trong dữ liệu ban đầu. Các câu còn lại theo `unselected → selected → confirmed`; câu 4 trong mẫu trả lời sai. Màn kết quả mẫu 4/5 và cộng 50 điểm một lần khi hoàn tất lần đầu. Đáp án đã xác nhận được lưu để tiếp tục đúng câu sau khi mở lại.
- Ưu đãi: số dư mẫu 170 sau thử thách, đổi cà phê 100 điểm, còn 70; mã `DEMO-HAN-1511` chỉ là mô phỏng và không có giá trị thanh toán.

Nút Back trả về màn trước và giữ trạng thái nháp nếu chưa chọn Hủy. Thanh tab quay về tab gốc; card và các nút có phản hồi rõ ràng, không có vùng chạm giả.
