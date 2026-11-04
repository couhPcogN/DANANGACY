# Ảnh và nguồn gốc

Script [`import-figma-export.py`](../../../scripts/import-figma-export.py) tách ảnh data URI của 74 SVG và khử trùng lặp theo SHA-256. Có **9 ảnh gốc** trong [`assets/images`](../../../assets/images/); [`manifest.json`](../../../design/exports/manifest.json) cho biết từng frame dùng ảnh nào. Script [`render-references.ps1`](../../../scripts/render-references.ps1) kết xuất bản tham chiếu thành PNG.

| File | Nội dung | Vị trí trong thiết kế |
|---|---|---|
| `asset-767638f9cfe9.jpg` | Toàn cảnh Đà Nẵng | Chào mừng, Home, Lịch trình |
| `asset-d2086cd1b860.jpg` | Bảo tàng Điêu khắc Chăm | Explore, chi tiết, chọn điểm, quiz |
| `asset-92a5828ee3ad.jpg` | Bán đảo Sơn Trà | Explore, chi tiết, thời tiết |
| `asset-1544b7b32269.jpg` | Cầu Rồng | Explore, chi tiết |
| `asset-87f5109464f0.jpg` | Ngũ Hành Sơn | Explore, chi tiết |
| `asset-3b59e2b537ce.jpg` | Bảo tàng Đà Nẵng | Explore, địa điểm thay thế |
| `asset-0195e69a627e.jpg` | Hội An | Lịch trình mới/đã lưu |
| `asset-6b99d91a985a.png` | Hiện vật Chăm Pa | Giới thiệu thử thách |
| `asset-d1ce9c2af0b1.png` | Biểu tượng Google | Nút xác thực Google |

Các tên hash giữ nguyên để manifest và `require(...)` ổn định. Ảnh được chép từ file export do chủ dự án cung cấp; quyền sử dụng ngoài dự án chưa được kiểm chứng. Không dùng SVG chụp cả màn hình làm UI runtime.
