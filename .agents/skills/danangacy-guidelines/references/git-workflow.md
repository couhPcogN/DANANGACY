# Git Workflow & File Exclusions Guide

Tài liệu hướng dẫn quy trình làm việc với Git trong dự án Monorepo DANANGACY và danh mục các tệp cấm đưa lên kho lưu trữ.

---

## 1. Cấu trúc kho lưu trữ Monorepo

```text
DANANGACY/ (Root)
├── .agents/skills/danangacy-guidelines/   # Workspace Skill chia sẻ cho cả team
├── frontend/                             # Ứng dụng di động (React Native + Expo)
├── backend/                              # Máy chủ API (FastAPI + PostgreSQL)
├── docs/                                 # Tài liệu kỹ thuật
├── .gitignore                            # Cấu hình bỏ qua tệp ở cấp độ root
└── README.md                             # Tài liệu tổng quan
```

---

## 2. Quy trình làm việc chuẩn

1. **Pre-flight Check:** Trước khi bắt tay vào code bất kỳ tác vụ nào, luôn chạy:
   ```powershell
   git status
   ```
   Đảm bảo working tree sạch sẽ và đang ở đúng nhánh làm việc.
2. **Thực thi trong đúng thư mục:**
   - Lệnh liên quan đến JavaScript/Expo chạy bên trong thư mục `frontend/`.
   - Lệnh liên quan đến Python/FastAPI chạy bên trong thư mục `backend/`.
3. **Commit nguyên tử (Atomic Commits):**
   - Đặt thông điệp commit rõ ràng theo Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
   - Đảm bảo các bài kiểm thử tự động đã chạy thành công trước khi commit.

---

## 3. Danh mục tệp và thư mục CẤM commit (Forbidden Exclusions)

Tuyệt đối không đưa các tệp hoặc thư mục sau vào Git:

* **Môi trường ảo & Thư viện phụ thuộc:**
  * `node_modules/` hoặc `frontend/node_modules/`
  * `.venv/`, `venv/`, `__pycache__/`, `*.py[cod]`
* **Tệp cấu hình bảo mật / Môi trường cá nhân:**
  * `.env`, `.env.*` (Chỉ cho phép commit `.env.example`)
* **Thư mục build & Cache tạm:**
  * `.expo/`, `frontend/.expo/`
  * `dist/`, `.tmp/`, `web-build/`
  * `.pytest_cache/`, `.ruff_cache/`
