---
name: danangacy-guidelines
description: >-
  Hướng dẫn kiến trúc, quy chuẩn mã nguồn và quy tắc nghiệp vụ cho dự án DANANGACY.
  Kích hoạt khi phát triển tính năng, sửa lỗi, viết API hoặc kiểm thử cho Frontend
  (React Native Expo MVVM) và Backend (FastAPI + SQLAlchemy + PostgreSQL).
---

# DANANGACY Developer & Agent Playbook

Dự án DANANGACY là ứng dụng du lịch khám phá di sản Đà Nẵng, áp dụng mô hình Monorepo gồm **Frontend Mobile** và **Backend API**.

---

## 1. Cấu trúc Monorepo

```text
DANANGACY/ (Root)
├── .agents/skills/danangacy-guidelines/   # Workspace Skill chia sẻ cho cả team
├── frontend/                             # Mobile App (React Native + Expo)
├── backend/                              # Backend Service (Python FastAPI + PostgreSQL)
├── docs/                                 # Tài liệu kỹ thuật dự án
├── .gitignore
└── README.md
```

---

## 2. Quy chuẩn Frontend (`frontend/`)

### Kiến trúc MVVM bắt buộc
Tuân thủ nghiêm ngặt luồng: **View (Screen) → ViewModel → Model/Repository**.

1. **View / Screen (`src/features/*/screens/`):**
   - Chỉ chịu trách nhiệm hiển thị UI và lắng nghe sự kiện người dùng.
   - **Tuyệt đối KHÔNG** gọi trực tiếp API hoặc thao tác trực tiếp với Repository trong Screen.
   - Luôn sử dụng custom hook ViewModel tương ứng (ví dụ: `useItineraryViewModel`).

2. **ViewModel (`src/features/*/viewmodels/`):**
   - Quản lý form state, validation, điều phối navigation và gọi các action từ Repository.

3. **Repository & State (`src/features/*/repositories/`, `shared/state/`):**
   - Quản lý dữ liệu (state/store) độc lập với React qua `createStore`.
   - Sử dụng `useSyncExternalStore` để render tối ưu.
   - Khóa lưu trữ cục bộ: `STORAGE_KEY = 'danangacy.demo.v1'`.

4. **Lệnh kiểm tra chất lượng trước khi commit:**
   ```powershell
   cd frontend
   npm run typecheck     # Kiểm tra TypeScript (0 lỗi)
   npm test              # Chạy 16 bài kiểm tra MVVM
   ```

---

## 3. Quy chuẩn Backend (`backend/`)

### Kiến trúc & Môi trường
- **Framework:** FastAPI + SQLAlchemy 2.0 + Pydantic v2 + Alembic.
- **Database:** PostgreSQL (chạy qua Docker container, cổng `5432`). Khóa chính dùng số nguyên (`Integer IDs`).
- **Khởi chạy máy chủ:**
  ```powershell
  cd backend
  .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
  ```

### Quy tắc nghiệp vụ Lịch trình (`Itinerary Rules`)
Bắt buộc tuân thủ khi viết API hoặc logic liên quan đến lịch trình:
- **Độ dài chuyến đi:** 1 đến 3 ngày (`duration: 1..3`).
- **Số điểm dừng:** Tối đa 8 điểm (`MAX_STOPS = 8`), tối thiểu 1 điểm.
- **Thời gian ghé thăm:** Mỗi điểm tối thiểu 30 phút (`MIN_VISIT_MINUTES = 30`).
- **Khung giờ hoạt động:** Nằm trong khoảng từ **06:00 đến 22:00**.
- **Không trùng giờ:** Các điểm dừng trong cùng một ngày không được trùng lặp thời gian.
- **Kiểm thử tự động:**
  ```powershell
  cd backend
  .\.venv\Scripts\python.exe -m pytest
  ```

---

## 4. Quy tắc thích ứng thời tiết (Weather Replacement)
- Khi điểm tham quan ngoài trời (như Bán đảo Sơn Trà) có cảnh báo thời tiết xấu (mưa > 70%), cho phép gợi ý thay thế bằng điểm trong nhà (như Bảo tàng Đà Nẵng).
- **Quy tắc bất biến:** Phải giữ nguyên khung giờ ban đầu (`start`, `end`) và không làm xáo trộn các điểm dừng khác trong ngày.

---

## 5. Quy trình làm việc với Git
- Luôn kiểm tra `git status` trước khi thay đổi.
- Không commit các thư mục tạm / cache: `.venv/`, `node_modules/`, `.expo/`, `dist/`, `.env`.
