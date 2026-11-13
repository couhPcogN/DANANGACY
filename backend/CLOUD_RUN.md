# Deploy thử backend lên Cloud Run

Cấu hình này dùng để thử build, deploy và truy cập FastAPI qua HTTPS.
Chưa cần database: `/health`, `/docs` và `/openapi.json` vẫn hoạt động.
`/health/db` và API lịch trình sẽ trả lỗi 503 nếu chưa kết nối PostgreSQL.
Không chạy migration tự động lúc khởi động.

## 1. Chuẩn bị một lần

Cài [Google Cloud CLI](https://cloud.google.com/sdk/docs/install), mở lại PowerShell.
Tạo hoặc chọn Google Cloud project đã bật billing. Thay `YOUR_PROJECT_ID`
bằng **project ID**, không phải tên hiển thị:

```powershell
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Tài khoản deploy cần quyền tạo Cloud Run service, chạy build và sử dụng service
account. Với project do tổ chức quản lý, xem quyền trong
[hướng dẫn deploy từ source](https://docs.cloud.google.com/run/docs/deploying-source-code).
Nếu build báo thiếu `roles/run.builder`, cấp role cho service account build
được ghi trong thông báo lỗi rồi chạy lại.

## 2. Deploy từ thư mục backend

```powershell
cd D:\Danagacy\backend
gcloud run deploy danangacy-api-test --source . --region asia-southeast1 --allow-unauthenticated --port 8080 --memory 512Mi --cpu 1 --min-instances 0 --max-instances 1
```

Nếu CLI hỏi tạo Artifact Registry repository để lưu image, chọn `y`.
Google Cloud build image bằng Dockerfile đã thêm; không cần chạy Docker trên máy.
`.gcloudignore` loại `.env`, môi trường ảo và backup khỏi dữ liệu upload;
`.dockerignore` cũng loại chúng khỏi Docker build context.

Lệnh này mở URL công khai để thử bằng trình duyệt. Giới hạn tối đa một instance
phù hợp cho lần thử này; dịch vụ và quá trình build vẫn có thể phát sinh phí.

## 3. Kiểm tra

Lấy URL từ dòng `Service URL` sau khi deploy, ví dụ
`https://danangacy-api-test-....run.app`, rồi mở:

- `SERVICE_URL/health`: phải trả `{"status":"ok"}`.
- `SERVICE_URL/docs`: giao diện Swagger.
- `SERVICE_URL/openapi.json`: đặc tả API.

Hoặc dùng PowerShell:

```powershell
$serviceUrl = gcloud run services describe danangacy-api-test --region asia-southeast1 --format="value(status.url)"
Invoke-RestMethod "$serviceUrl/health"
Start-Process "$serviceUrl/docs"
```

API lịch trình chưa dùng được khi chưa có database; đây không phải lỗi deploy.
Muốn thử CRUD sau này, cấu hình PostgreSQL cloud bằng các biến `DB_HOST`,
`DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` và chạy `alembic upgrade head`
trên database đó trước. Database trên máy cá nhân không tự kết nối với Cloud Run.

## 4. Deploy lại hoặc xóa sau khi thử

Sau khi sửa code, chạy lại lệnh deploy ở bước 2 để tạo revision mới.

```powershell
gcloud run services delete danangacy-api-test --region asia-southeast1
```

Xóa service không xóa image đã build. Có thể xóa các image không cần dùng trong
Artifact Registry trên Google Cloud Console để dọn phần lưu trữ còn lại.
