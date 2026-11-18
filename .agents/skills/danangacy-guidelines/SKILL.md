---
name: danangacy-guidelines
description: >-
  Hướng dẫn kiến trúc, quy chuẩn mã nguồn và quy tắc nghiệp vụ cho dự án DANANGACY.
  Kích hoạt khi phát triển tính năng, sửa lỗi, viết API hoặc kiểm thử cho Frontend
  (React Native Expo MVVM) và Backend (FastAPI + SQLAlchemy + PostgreSQL).
---

# DANANGACY Guidelines

## Goal

Đảm bảo mọi mã nguồn phát triển cho dự án DANANGACY tuân thủ nghiêm ngặt mô hình Monorepo, kiến trúc MVVM ở Frontend (`frontend/`) và các quy tắc nghiệp vụ lịch trình ở Backend (`backend/`).

## Instructions

1. **Bước 1: Kiểm tra trạng thái Git.**
   - Chạy `git status` trước khi bắt đầu công việc.
   - Tuân thủ quy trình làm việc và các loại trừ bị cấm theo hướng dẫn tại [git-workflow.md](./references/git-workflow.md).

2. **Bước 2: Phát triển hoặc chỉnh sửa Frontend (`frontend/`).**
   - Đọc kỹ tài liệu kiến trúc tại [frontend-mvvm.md](./references/frontend-mvvm.md) trước khi viết code.
   - Đảm bảo tuân thủ luồng: Screen (View) gọi ViewModel hook; ViewModel thao tác với Repository; Screen không gọi API trực tiếp.
   - Sau khi hoàn thành code, bắt buộc chạy kiểm tra:
     ```powershell
     cd frontend
     npm run typecheck
     npm test
     ```

3. **Bước 3: Phát triển hoặc chỉnh sửa Backend (`backend/`).**
   - Đọc kỹ tài liệu quy tắc nghiệp vụ tại [backend-rules.md](./references/backend-rules.md) trước khi viết code.
   - Đảm bảo áp dụng đúng các ràng buộc lịch trình: 1–3 ngày, tối đa 8 điểm, mỗi điểm $\ge 30$ phút, khung giờ 06:00–22:00, không trùng giờ và quy tắc giữ nguyên khung giờ khi thay thế điểm do thời tiết.
   - Sau khi hoàn thành code, bắt buộc chạy kiểm thử:
     ```powershell
     cd backend
     .\.venv\Scripts\python.exe -m pytest
     ```

## Examples

### Ví dụ 1: Tổ chức mã nguồn Frontend chuẩn MVVM

```typescript
// Screen (View) chỉ lắng nghe và ủy quyền cho ViewModel:
export function ItineraryScreen() {
  const { itinerary, isSaving, handleSaveDraft, handleTimeChange } = useItineraryViewModel();

  return (
    <Screen>
      <TimeEditor onChange={handleTimeChange} />
      <Button title="Lưu lịch trình" loading={isSaving} onPress={handleSaveDraft} />
    </Screen>
  );
}
```

### Ví dụ 2: Payload tạo lịch trình đúng chuẩn Backend Rules

```json
{
  "title": "Một ngày di sản Đà Nẵng",
  "date": "2026-11-15",
  "duration": 1,
  "pace": "Thư thả",
  "stops": [
    { "place_id": "cham", "day": 1, "start": "09:00", "end": "10:30" },
    { "place_id": "son-tra", "day": 1, "start": "14:00", "end": "16:00" }
  ]
}
```
*Ghi chú: Lịch trình 1 ngày, 2 điểm dừng ($\le 8$), mỗi điểm ghé thăm từ 90 đến 120 phút ($\ge 30$ phút), khung giờ nằm trong 06:00–22:00 và không trùng nhau.*

## Constraints

- **CẤM** gọi API mạng (fetch, axios) hoặc mutate state trực tiếp bên trong component Screen (bắt buộc thông qua ViewModel và Repository).
- **CẤM** tạo hoặc cập nhật lịch trình trùng khung giờ, vượt quá 8 điểm dừng, hoặc nằm ngoài khoảng 06:00 - 22:00.
- **CẤM** làm thay đổi khung giờ (`start`, `end`) hoặc làm xáo trộn các điểm dừng khác khi thực hiện tính năng thay thế điểm do thời tiết xấu (Weather Replacement).
- **CẤM** commit các tệp môi trường và phụ thuộc: `.venv/`, `node_modules/`, `.expo/`, `.env`.
