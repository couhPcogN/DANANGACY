# DANANGACY — KỊCH BẢN THUYẾT TRÌNH BÁO CÁO KIỂM THỬ TUẦN 5
## Môn học: Phát Triển Ứng Dụng Di Động
**Đề tài:** Quy Trình Kiểm Thử, Quản Lý Khiếm Khuyết & Khắc Phục Lỗi Ứng Dụng DANANGACY
**Thời lượng dự kiến:** 6 – 8 phút
**Đối tượng báo cáo:** Giảng viên hướng dẫn & Hội đồng đánh giá

---

### SLIDE 1: TRANG BÌA — GIỚI THIỆU TỔNG QUAN
- **Thời lượng:** ~45 giây
- **Nội dung trình chiếu:**
  - Tiêu đề: **DANANGACY — QUY TRÌNH KIỂM THỬ VÀ SỬA LỖI**
  - Phụ đề: Báo cáo kỹ thuật Tuần 5 — Môn Phát triển ứng dụng di động
  - Hình ảnh thực tế: Giao diện Trang chủ ứng dụng DANANGACY chạy trên Android Emulator.
- **Lời thuyết minh (Speaker Script):**
  > "Kính thưa Thầy/Cô và các bạn,
  > Hôm nay, đại diện nhóm phát triển ứng dụng di động DANANGACY, em xin trình bày báo cáo kỹ thuật Tuần 5 với chuyên đề: **Quy trình kiểm thử, quản lý khiếm khuyết và khắc phục lỗi thực tế**.
  > DANANGACY là nền tảng hỗ trợ du lịch thông minh tại thành phố Đà Nẵng, kết hợp giữa ứng dụng di động React Native Expo và hệ thống backend FastAPI. Trong tuần này, nhóm chúng em đã áp dụng quy trình kiểm thử phần mềm chuyên sâu (Software Quality Assurance), không chỉ kiểm tra tự động mà còn thực hiện kiểm thử chấp nhận người dùng (UAT) trên môi trường mô phỏng di động thực tế.
  > Sau đây, em xin phép đi vào chi tiết mục tiêu và quy trình triển khai."

---

### SLIDE 2: MỤC TIÊU & QUY TRÌNH KIỂM THỬ
- **Thời lượng:** ~50 giây
- **Nội dung trình chiếu:**
  - Quy trình 6 giai đoạn khép kín:
    1. **Test Planning:** Xác định phạm vi 8 module, môi trường và tiêu chí Pass/Fail.
    2. **Test Case Design:** Thiết kế 53 ca kiểm thử đa chiều (Positive, Negative, Boundary, Offline).
    3. **Test Execution:** Thực thi song song Automated Unit/Integration tests và Manual/UAT trên Android Emulator.
    4. **Defect Tracking:** Phân loại và ghi nhận khiếm khuyết vào Defect Log (BUG-W5-01 đến 04).
    5. **Bug Fixing:** Cô lập và sửa lỗi giao diện `BUG-W5-04` trong component `Screen.tsx`.
    6. **Retesting & Regression:** Kiểm thử lại lỗi trên emulator và chạy toàn bộ 221 automated tests để đảm bảo không phát sinh lỗi hồi quy.
- **Lời thuyết minh (Speaker Script):**
  > "Để bảo đảm chất lượng toàn diện, nhóm đã thiết lập một quy trình QA khép kín gồm 6 giai đoạn chuẩn mực.
  > Bắt đầu từ khâu Lập kế hoạch (Test Planning) nhằm định rõ các tiêu chí chấp nhận kỹ thuật; tiếp đến là Thiết kế 53 test cases bao phủ các kịch bản biên và ngoại lệ.
  > Sau đó, chúng em tiến hành Thực thi kiểm thử (Test Execution) trên cả tầng mã nguồn và tầng giao diện người dùng. Mọi khiếm khuyết phát hiện đều được theo dõi minh bạch qua Defect Log.
  > Với lỗi giao diện xác nhận BUG-W5-04, nhóm đã tiến hành sửa đổi tối thiểu trên mã nguồn, kiểm thử lại (Retest) trực tiếp trên máy ảo và chạy kiểm thử hồi quy (Regression Testing) toàn diện trước khi đóng gói bàn giao."

---

### SLIDE 3: PHẠM VI KIỂM THỬ HỆ THỐNG
- **Thời lượng:** ~50 giây
- **Nội dung trình chiếu:**
  - 8 Trụ cột chức năng được kiểm định:
    - **1. Xác thực (Authentication):** Đăng nhập JWT, kiểm tra phiên AsyncStorage, refresh token.
    - **2. Chế độ Khách (Guest Mode):** Trải nghiệm không cần tài khoản, lưu trữ lịch trình cục bộ an toàn.
    - **3. Lịch trình (Itinerary CRUD):** Tạo, đọc, cập nhật, xóa lịch trình du lịch Đà Nẵng.
    - **4. Đồng bộ Offline-First:** Lưu trữ offline khi mất kết nối, cơ chế giải quyết xung đột Optimistic Concurrency Control (OCC).
    - **5. Thời tiết (Weather Service):** Hiển thị dự báo thời tiết Đà Nẵng theo tọa độ GPS/trạm khí tượng.
    - **6. Trợ lý AI (Gemini AI):** Khuyến nghị địa điểm an toàn thông qua Backend API proxy.
    - **7. Đố vui & Thưởng (Quiz & Rewards):** Tải câu hỏi di sản văn hóa, tích lũy điểm thưởng.
    - **8. Giao diện & Mạng (UI & Network):** Khả năng co giãn trên nhiều kích thước màn hình và xử lý mất mạng.
- **Lời thuyết minh (Speaker Script):**
  > "Về phạm vi kiểm thử, hệ thống DANANGACY được chia tách thành 8 trụ cột chức năng trọng yếu.
  > Chúng em đặc biệt chú trọng vào 3 bài toán đặc thù của ứng dụng di động:
  > Thứ nhất là Tính năng Khách và Xác thực phân quyền — đảm bảo khách vãng lai vẫn dùng được ứng dụng mà không bị rò rỉ dữ liệu của tài khoản khác.
  > Thứ hai là Cơ chế Offline-First và Đồng bộ — cho phép du khách xem lịch trình ngay cả khi mất sóng, và tự động đồng bộ khi có mạng lại bằng phiên bản OCC.
  > Và thứ ba là Khả năng thích ứng giao diện (Responsive UI) trên các độ phân giải màn hình khác nhau."

---

### SLIDE 4: THIẾT KẾ TEST CASE ĐA CHIỀU
- **Thời lượng:** ~55 giây
- **Nội dung trình chiếu:**
  - Cơ cấu 53 Test Cases:
    - Positive Cases (Đầu vào hợp lệ): 24 TCs
    - Negative Cases (Đầu vào sai / lỗi nghiệp vụ): 11 TCs
    - Empty Input (Để trống trường bắt buộc): 5 TCs
    - Boundary & Stress (Dữ liệu biên, quá tải): 4 TCs
    - Offline & Network Failure (Mất mạng, timeout): 5 TCs
    - UI & Device Compatibility (Màn hình, phần cứng): 4 TCs
  - Bảng 5 ca kiểm thử điển hình:
    - `TC-AUTH-01`: Đăng nhập thành công với tài khoản mẫu -> Trả JWT & chuyển về Home (PASS).
    - `TC-AUTH-03`: Để trống Email/Mật khẩu -> Client validation chặn submit, báo lỗi đỏ (PASS).
    - `TC-NET-01`: Mất kết nối backend -> Mở tab Lịch trình, đọc cache AsyncStorage mượt mà (PASS).
    - `TC-UI-01`: Kiểm thử hiển thị trên màn hình nhỏ 720x1280 -> Phát hiện nút dính mép đáy (BUG-W5-04).
    - `TC-DEVICE-01`: Kiểm thử phần cứng thiết bị vật lý -> Không có thiết bị cắm cáp USB (BLOCKED).
- **Lời thuyết minh (Speaker Script):**
  > "Nhóm đã xây dựng bộ tài liệu 53 test cases chi tiết, tuân thủ nguyên tắc kiểm thử hộp đen và hộp xám. Không chỉ kiểm tra kịch bản đường thẳng (happy path), chúng em thiết kế đầy đủ các ca kiểm thử tiêu cực, để trống dữ liệu, và đặc biệt là kịch bản mất mạng.
  > Trên màn hình là 5 test case tiêu biểu:
  > Ví dụ với TC-AUTH-03, ứng dụng bắt buộc phải chặn submit ngay tại client khi người dùng để trống ô nhập liệu.
  > Với TC-NET-01, khi backend bị ngắt kết nối, ứng dụng vẫn đọc trơn tru dữ liệu lịch trình từ bộ nhớ tạm mà không bị văng ứng dụng.
  > Và chính nhờ TC-UI-01 trên màn hình 720x1280, nhóm đã phát hiện ra lỗi giao diện nút bấm bị che khuất để kịp thời khắc phục."

---

### SLIDE 5: THỰC THI KIỂM THỬ UAT TRÊN ANDROID EMULATOR
- **Thời lượng:** ~60 giây
- **Nội dung trình chiếu:**
  - 4 Hình ảnh UAT thực tế trích xuất từ Android Emulator `Small_Phone` (720x1280, API 34):
    1. **Màn hình Đăng nhập (`w5_uat_03_auth_screen.png`):** Form đăng nhập chuẩn Material, đầy đủ các trường nhập.
    2. **Client Validation (`w5_uat_04_auth_empty_input.png`):** Báo lỗi form đỏ ngay khi nhấn đăng nhập mà không nhập dữ liệu.
    3. **Xác thực thành công (`w5_uat_06_auth_success.png`):** Kết nối backend live cổng 8000, nhận JWT và hiển thị thông tin người dùng `han_danang@danangacy.vn`.
    4. **Đố vui Di sản (`w5_uat_12_quiz_screen.png`):** Tải động câu hỏi di sản văn hóa Đà Nẵng từ REST API, render thẻ câu hỏi và các lựa chọn trắc nghiệm.
  - Phân loại bằng chứng: Đạt cấp độ `EMULATOR VERIFIED` và `LIVE BACKEND VERIFIED`.
- **Lời thuyết minh (Speaker Script):**
  > "Đây là bằng chứng thực nghiệm UAT được chụp trực tiếp từ máy ảo Android Small_Phone kết nối song song với backend FastAPI đang chạy thật.
  > Ở hình số 1 và số 2, Thầy/Cô có thể thấy cơ chế validation phía client hoạt động tức thì khi người dùng nhấn submit mà chưa điền thông tin, ngăn chặn hoàn toàn các request rác gửi về server.
  > Hình số 3 chứng minh quá trình xác thực thành công: Backend cấp access token hợp lệ, client lưu trữ vào AsyncStorage và cập nhật giao diện người dùng kèm điểm thưởng.
  > Hình số 4 minh chứng tính năng Đố vui văn hóa Đà Nẵng: Dữ liệu câu hỏi được bóc tách từ cơ sở dữ liệu backend và hiển thị mượt mà trên giao diện người dùng di động."

---

### SLIDE 6: KIỂM THỬ MÔI TRƯỜNG & MẠNG
- **Thời lượng:** ~50 giây
- **Nội dung trình chiếu:**
  - Đa cấu hình hiển thị:
    - Cấu hình 1: 720 x 1280 pixels, 320 dpi (Màn hình nhỏ).
    - Cấu hình 2: 1080 x 1920 pixels, 440 dpi (Màn hình Full HD tiêu chuẩn — `w5_uat_display2_1080p_home.png`).
    - *Ghi chú kỹ thuật:* Hai kích thước được kiểm thử thông qua cơ chế cấu hình hiển thị (display configuration) trên cùng một AVD.
  - Kiểm thử khả năng chịu lỗi mạng (Fault Tolerance):
    - Sử dụng `adb reverse --remove tcp:8000` để giả lập mất kết nối Backend (`w5_uat_10_offline_itinerary.png`).
    - Ứng dụng tự động chuyển sang đọc cache offline, hiển thị banner cảnh báo và không bị crash.
    - Tái lập kết nối qua `adb reverse`, hệ thống phục hồi trạng thái sẵn sàng đồng bộ (`w5_uat_11_online_restored.png`).
  - Hạn chế thực tế: Kiểm thử trên thiết bị vật lý chưa thể hoàn tất do thiếu kết nối phần cứng USB (`TC-DEVICE-01` BLOCKED).
- **Lời thuyết minh (Speaker Script):**
  > "Bước sang giai đoạn kiểm thử môi trường và tính chịu lỗi mạng:
  > Nhóm đã tiến hành kiểm tra giao diện trên hai cấu hình độ phân giải: 720p và 1080p Full HD trên AVD. Kết quả cho thấy hệ thống co giãn responsive tốt, bố cục các thẻ danh lam thắng cảnh giữ được tỷ lệ chuẩn.
  > Về kiểm thử mạng, chúng em ngắt cầu nối adb reverse để mô phỏng tình huống server bị ngắt kết nối. Màn hình Lịch trình vẫn tải được dữ liệu offline từ cache cục bộ mà không phát sinh lỗi unhandled exception.
  > Tuy nhiên, với tinh thần trung thực trong QA, nhóm xin báo cáo rõ: Do điều kiện phần cứng hiện tại không có điện thoại vật lý kết nối USB, test case kiểm thử trên thiết bị thật đang ở trạng thái BLOCKED và nhóm đã chuẩn bị sẵn checklist 7 bước để kiểm thử thủ công sau."

---

### SLIDE 7: BẢNG QUẢN LÝ VÀ PHÂN LOẠI LỖI (DEFECT TRACKING)
- **Thời lượng:** ~50 giây
- **Nội dung trình chiếu:**
  - Bảng tổng hợp 4 khiếm khuyết kỹ thuật (BUG-W5-01 đến BUG-W5-04):
    | Mã Lỗi | Phân Loại Khiếm Khuyết | Mức Độ | Trạng Thái | Mô Tả & Hướng Xử Lý |
    | :---: | :--- | :---: | :---: | :--- |
    | **BUG-W5-01** | Environment Blocker | P2 | **BLOCKED** | Không có thiết bị Android vật lý cắm cáp USB; lập checklist kiểm thử thủ công. |
    | **BUG-W5-02** | Known Security Risk | P1 | **ACCEPTED RISK** | Lộ API key Gemini ở client; đã khắc phục kiến trúc bằng Backend Proxy ở Wave 1A. |
    | **BUG-W5-03** | Technical Debt | P1 | **CLOSED / RESOLVED** | Xung đột ghi đè lịch trình offline; đã giải quyết triệt để bằng OCC ở Wave 1C. |
    | **BUG-W5-04** | Confirmed UI Issue | P3 | **FIXED / RETESTED** | Nút bấm thao tác dính sát mép đáy màn hình 720p; đã sửa layout trong `Screen.tsx`. |
- **Lời thuyết minh (Speaker Script):**
  > "Trong Tuần 5, nhóm đã quản lý và phân loại minh bạch 4 khiếm khuyết kỹ thuật theo chuẩn quốc tế:
  > Chúng em tách bạch rõ ràng giữa khiếm khuyết môi trường, rủi ro bảo mật kiến trúc, nợ kỹ thuật và lỗi giao diện người dùng.
  > Cụ thể: BUG-W5-01 là rào cản môi trường phần cứng. BUG-W5-02 và 03 là các bài toán bảo mật và đồng bộ dữ liệu đã được xử lý tối ưu ở các wave trước.
  > Duy nhất BUG-W5-04 là lỗi giao diện phát sinh thực tế trong đợt kiểm thử Tuần 5 này khi chạy trên màn hình nhỏ. Và nhóm đã tập trung xử lý dứt điểm khiếm khuyết này."

---

### SLIDE 8: SỬA LỖI GIAO DIỆN & RETEST (TRỌNG TÂM)
- **Thời lượng:** ~65 giây
- **Nội dung trình chiếu:**
  - Hình ảnh so sánh thực nghiệm (Side-by-side):
    - **BEFORE (`w5_bug04_before_720p.png`):** Nút hành động dính sát đáy, dễ bấm nhầm vào thanh điều hướng hoặc Expo overlay.
    - **AFTER (`w5_bug04_after_720p.png`):** Nút hành động có khoảng đệm an toàn (safe area padding) thoáng đãng, dễ bấm.
  - Phân tích kỹ thuật:
    - **Hiện tượng:** Nút bấm cuối cùng bị cấn sát mép dưới trên màn hình 720x1280.
    - **Nguyên nhân:** Component `Screen.tsx` bọc container với thuộc tính co giãn chưa bảo lưu khoảng đệm đáy cho nội dung cuộn.
    - **Giải pháp:** Cập nhật vùng đệm an toàn trong `frontend/src/shared/components/layout/Screen.tsx`, thiết lập `flex: 1` và bảo đảm `contentContainerStyle` luôn cộng thêm `bottomInset`.
    - **Kết quả Retest:** Khoảng cách đáy tăng rõ rệt, hiển thị chuẩn mực trên cả 720p và 1080p.
    - **Kiểm thử hồi quy:** Chạy lại 100% test suite, toàn bộ 221 automated tests đều PASS.
- **Lời thuyết minh (Speaker Script):**
  > "Đây là slide trọng tâm thể hiện năng lực tìm lỗi, sửa lỗi và kiểm thử lại của nhóm:
  > Như Thầy/Cô quan sát ở hình BEFORE bên trái: Trên màn hình kích thước nhỏ 720x1280, nút bấm CTA ở cuối trang bị đẩy sát mép đáy màn hình, khiến thao tác chạm rất dễ bị chạm nhầm hoặc bị che khuất.
  > Khi kiểm tra mã nguồn, nhóm phát hiện component Screen.tsx bọc scroll container chưa xử lý đúng khoảng đệm đáy (safe area bottom inset).
  > Nhóm đã tiến hành tinh chỉnh layout container để bảo toàn khoảng cách an toàn. Kết quả ở hình AFTER bên phải cho thấy nút bấm đã được nâng lên một khoảng đệm tiêu chuẩn, giao diện thoáng và thao tác chạm vô cùng chính xác.
  > Sau khi sửa, chúng em đã retest thành công trên máy ảo và chạy lại toàn bộ 221 bài kiểm thử tự động, xác nhận không có bất kỳ lỗi hồi quy nào phát sinh."

---

### SLIDE 9: TỔNG KẾT KẾT QUẢ & KẾT LUẬN
- **Thời lượng:** ~50 giây
- **Nội dung trình chiếu:**
  - Bảng tổng hợp số liệu thực tế (Fact-based Metrics):
    - **53 Test Cases Thiết Kế:** 52 ĐẠT (98.11%) | 0 THẤT BẠI (0%) | 1 BỊ CHẶN (1.89% — thiết bị thật).
    - **221 Automated Regression Tests:** 153 Frontend Tests PASS (100%) | 68 Backend Pytest PASS (100%).
    - **19 Bằng chứng ảnh PNG:** 100% hợp lệ, giải mã thành công qua Pillow, chuẩn PNG 8-byte magic.
  - Nhận xét & Giới hạn:
    - Ứng dụng đạt độ ổn định cao ở mức độ UAT trên môi trường mô phỏng Android.
    - Hạn chế: Cần bổ sung kiểm thử trên thiết bị vật lý đa dạng và tiếp tục hoàn thiện tối ưu hóa môi trường production.
  - Khẳng định: Hoàn thành đầy đủ 6 yêu cầu kỹ thuật của bài tập Tuần 5.
- **Lời thuyết minh (Speaker Script):**
  > "Tổng kết lại đợt kiểm thử Tuần 5:
  > Nhóm đã hoàn thành toàn diện 53 test cases với 52 ca PASS (chiếm 98.11%) và duy nhất 1 ca BLOCKED do điều kiện thiết bị ngoại vi.
  > Toàn bộ 221 bài kiểm thử tự động ở cả Frontend và Backend đều đạt tỷ lệ vượt qua tuyệt đối 100%. Toàn bộ 19 ảnh chụp bằng chứng đều đã được chuẩn hóa nhị phân và kiểm tra giải mã thành công.
  > Kết quả kiểm thử khẳng định ứng dụng DANANGACY có cấu trúc vững chắc, xử lý tốt các tình huống mất mạng và co giãn giao diện.
  > Nhóm chúng em xin chân thành cảm ơn Thầy/Cô đã lắng nghe và rất mong nhận được những góp ý quý báu để hoàn thiện đồ án tốt hơn nữa!"

---
*Kịch bản hoàn tất — Thời lượng đọc ước tính: 7 phút 10 giây.*
