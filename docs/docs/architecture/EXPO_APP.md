# Kiến trúc ứng dụng Expo

## Tổ chức

```text
App.tsx                    # composition root và chọn màn hình theo route
src/
  ui.tsx                   # Screen, form, card, tab và thành phần chung
  theme.ts                # token màu, khoảng cách và bo góc
  data.ts                 # địa điểm, lịch, câu hỏi, ảnh cục bộ
  state.tsx               # route, state, AsyncStorage
  screens/                 # màn hình theo tính năng
assets/images/             # ảnh gốc tách từ SVG, dùng require tương đối
design/exports/            # SVG tham chiếu, không import vào runtime
design/previews/           # PNG tham chiếu để so sánh
design/comparisons/        # ảnh chụp Figma trực tuyến và Expo Web
design/figma-nodes.json    # đối chiếu 74 frame với node ID trực tuyến
docs/docs/                 # tài liệu dự án hiện hành
```

Giao diện dùng `AppProvider` để chia sẻ route, địa điểm yêu thích, lịch trình, quiz, điểm và ưu đãi. State cần giữ lại được lưu bằng AsyncStorage. Dữ liệu mẫu tập trung để cùng một địa điểm, lịch và số điểm nhất quán ở mọi màn hình. Không tạo lớp repository hay use-case rỗng; chỉ tách adapter khi có API thật.

## Quy tắc triển khai

- TypeScript với kiểu rõ cho `Place`, `Trip`, `QuizQuestion` và `Route`.
- Dùng ảnh cục bộ trong [`assets/images`](../../../assets/images/) bằng `require('../assets/images/...')` ở `src/data.ts`; không tham chiếu URL tạm của Figma.
- Font Be Vietnam Pro được nạp trước khi hiện route, theo ba độ đậm dùng trong Figma.
- `ScrollView` cho màn hình dài và safe area cho vùng hệ thống. Input có nhãn và kiểu bàn phím phù hợp.
- Dữ liệu thời tiết, xác thực, điểm thưởng là demo được gắn nhãn rõ; không phát sinh yêu cầu mạng.
- Khi nối backend, thay dữ liệu mẫu và hàm cập nhật state bằng adapter dịch vụ có kiểu rõ; màn hình không tự gọi HTTP.

## Kiểm chứng

Chạy `npm install`, `npm run typecheck`, `npm run export:web`, `npm run export:android`, `python scripts/verify-assets.py` và khởi động `npm start`. Đối chiếu ảnh app ở viewport 390×844 với [ảnh chụp trực tuyến và export](../../../design/comparisons/) theo [báo cáo visual](../visual/REVIEW.md). Những sai khác còn lại phải được ghi rõ.
