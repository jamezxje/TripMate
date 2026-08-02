# Tài liệu Đặc tả Dự án (Project Specification)
**Tên dự án:** TripMate
**Mô hình:** Web Application

## 1. Tổng quan Công nghệ (Tech Stack)
- **Backend:** Java + Spring Boot (RESTful API, JPA/Hibernate, Spring Security, JWT Authentication).
- **Frontend:** ReactJS (Vite, Tailwind CSS, Zustand/Redux Toolkit, Axios).
- **Database:** MySQL.

---

## 2. Yêu cầu Nghiệp vụ (Business Requirements)

### 2.0. Quản lý Tài khoản & Xác thực (Authentication & Authorization)
- **Đăng ký (Register):** Người dùng tạo tài khoản mới với Họ tên (`full_name`), Email (duy nhất), Mật khẩu (`password`). Mật khẩu được mã hóa an toàn bằng BCrypt.
- **Đăng nhập (Login):** Người dùng đăng nhập bằng Email & Mật khẩu. Hệ thống xác thực và trả về JWT Access Token cùng thông tin User Profile.
- **Quản lý phiên làm việc & Phân quyền:**
  - Token được lưu ở Frontend (`localStorage`) và tự động đính kèm vào Header `Authorization: Bearer <token>` của mọi API call ngoại trừ các public auth endpoints.
  - Phân quyền thao tác trên chuyến đi dựa vào thông tin người dùng được trích xuất từ JWT Token của request.

### 2.1. Quản lý Nhóm & Quỹ (Group & Fund Management)
- Trạng thái chuyến đi: Lên kế hoạch (Planning) -> Đang diễn ra (Ongoing) -> Đã kết thúc (Completed) -> Đã quyết toán xong (Settled).
- Cơ chế tham gia: 
  - Trưởng nhóm tạo Invite Link/Code. Thành viên sử dụng code/link để gia nhập.
  - **Thành viên ảo (Guest Member):** Trưởng nhóm có thể tự tạo các thành viên ảo (không cần đăng ký tài khoản) để dễ dàng quản lý việc chia tiền cho những người không dùng app.
- Góp quỹ ban đầu (Advance Fund): Ghi nhận số tiền đóng quỹ của từng cá nhân, hiển thị tiến độ thu quỹ chung.

### 2.2. Quản lý Chi tiêu & Quyết toán (Expense Tracking)
- **Phân quyền:**
  - *Leader:* Thêm/Sửa/Xóa chi tiêu, được quyền gán "Người thanh toán" là bất kỳ ai hoặc chọn "Lấy từ Quỹ".
  - *Member:* Thêm chi tiêu (mặc định người thanh toán là chính họ). Không thể sửa/xóa giao dịch của người khác.
- **Logic chia tiền:**
  - *Chia đều (EQUAL):* Tổng tiền chia đều cho những người tham gia giao dịch.
  - *Chia theo số tiền cụ thể (EXACT_AMOUNT):* Nhập số tiền cụ thể cho từng cá nhân (tổng phải bằng số tiền chi).
- **Quyết toán:**
  - Bù trừ tự động: `[Tiền đã đóng quỹ + Tiền ứng ra trả] - [Tổng chi phí cá nhân phải chịu] = Balance`.
  - Đề xuất chuyển khoản bù trừ tối ưu nhất giữa các thành viên.

---

## 3. User Stories & Acceptance Criteria

### Epic 0: Quản lý Tài khoản & Xác thực
**US 0.1: Đăng ký tài khoản mới**
- *Là một* người dùng mới, *tôi muốn* đăng ký tài khoản bằng email để bắt đầu sử dụng ứng dụng.
- **AC 0.1.1:** Validate định dạng Email, độ dài mật khẩu (tối thiểu 6 ký tự).
- **AC 0.1.2:** Kiểm tra trùng lặp email. Nếu email đã tồn tại, hiển thị thông báo lỗi phù hợp.
- **AC 0.1.3:** Mã hóa password bằng BCrypt trước khi lưu vào CSDL.

**US 0.2: Đăng nhập & Duy trì đăng nhập**
- *Là một* người dùng đã đăng ký, *tôi muốn* đăng nhập vào ứng dụng và duy trì phiên làm việc.
- **AC 0.2.1:** Validate email và mật khẩu. Trả về lỗi nếu sai thông tin xác thực.
- **AC 0.2.2:** Sinh và trả về JWT Access Token hợp lệ khi đăng nhập thành công.
- **AC 0.2.3:** Frontend lưu trữ Token và duy trì trạng thái đăng nhập khi làm mới trang.

**US 0.3: Bảo vệ API & Đăng xuất**
- *Là một* người dùng, *tôi muốn* an toàn dữ liệu và có thể đăng xuất khỏi ứng dụng.
- **AC 0.3.1:** Đăng xuất xóa Token khỏi `localStorage` và điều hướng người dùng về màn hình Đăng nhập.
- **AC 0.3.2:** Backend từ chối (401 Unauthorized) tất cả các request không hợp lệ hoặc thiếu Token bảo vệ.

**US 0.4: Quản lý thành viên ảo (Guest Member)**
- *Là một* Leader, *tôi muốn* tạo thành viên ảo để ghi nhận chi phí cho những người không có tài khoản.
- **AC 0.4.1:** Leader nhập tên thành viên, hệ thống sinh ra một bản ghi trong Database với cờ `is_guest = true` và không có thông tin email/mật khẩu.
- **AC 0.4.2:** Thành viên ảo này sẽ tự động tham gia vào chuyến đi với vai trò `GUEST`.
- **AC 0.4.3:** Thành viên ảo xuất hiện trong danh sách chia tiền như một thành viên bình thường.

### Epic 1: Quản lý Chi Tiêu
**US 1.1: Thêm mới khoản chi**
- *Là một* thành viên, *tôi muốn* ghi lại một khoản chi tiêu mới.
- **AC 1.1.1:** Nếu user là Member, trường "Người thanh toán" mặc định là chính user (disabled). Nếu user là Leader, dropdown cho phép chọn bất kỳ ai hoặc "Quỹ chung".
- **AC 1.1.2:** Validate các trường: Tên, Số tiền (>0), Ngày, Người thanh toán, Loại chia tiền. Báo lỗi UI nếu trống.
- **AC 1.1.3:** Nếu thanh toán từ Quỹ chung, hệ thống trừ số dư quỹ. Cảnh báo nếu ghi âm quỹ.

**US 1.2: Phân bổ chia tiền**
- *Là một* người ghi chép, *tôi muốn* chọn chia đều hoặc chia theo số tiền cụ thể.
- **AC 1.2.1:** (Chia đều) Hệ thống tự chia `Tổng tiền / Số người` (làm tròn).
- **AC 1.2.2:** (Nhập tay) Hệ thống validate tổng số tiền từng người cộng lại BẮT BUỘC bằng tổng bill. Disable nút Lưu nếu sai lệch.

### Epic 2: Quyết Toán Chuyến Đi
**US 2.1: Xem Bảng tổng sắp**
- *Là một* thành viên, *tôi muốn* xem bảng tổng kết tài chính cá nhân.
- **AC 2.1.1:** Hiển thị số dư (Balance) của user.
- **AC 2.1.2:** Hiển thị màu Đỏ ("Cần đóng thêm") nếu < 0, Xanh ("Nhận lại") nếu > 0.

**US 2.2: Đề xuất chuyển tiền (Settlement)**
- *Là một* Leader, *tôi muốn* hệ thống tự động chỉ ra ai cần chuyển cho ai.
- **AC 2.2.1:** Khi chuyến đi chuyển sang "Settled", hệ thống tính toán và sinh danh sách giao dịch bù trừ (giảm thiểu số lượt chuyển khoản).
- **AC 2.2.2:** Leader tick chọn "Đã hoàn tất" cho các khoản chuyển tiền. Khi tick hết, chuyến đi chuyển sang trạng thái "Closed".

---

## 4. Thiết kế Cơ sở dữ liệu (Database Schema)

*Lưu ý triển khai: Các cột `amount` nên được ánh xạ sang kiểu `BigDecimal` trong các Entity JPA để đảm bảo độ chính xác của các phép tính tài chính.*

### 4.1. Core Entities
**1. users**
- `id` (BIGINT, PK)
- `email` (VARCHAR 255, Unique, Nullable) - *Nullable để hỗ trợ Guest Member*
- `full_name` (VARCHAR 100, Not Null)
- `password_hash` (VARCHAR 255, Nullable) - *Nullable để hỗ trợ Guest Member*
- `is_guest` (BOOLEAN, Default False) - *Cờ xác định tài khoản ảo*
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**2. trips**
- `id` (BIGINT, PK)
- `name` (VARCHAR, Not Null)
- `status` (VARCHAR, Not Null) - *Enum: PLANNING, ONGOING, SETTLED, CLOSED*
- `join_code` (VARCHAR, Unique)
- `created_at` (TIMESTAMP)

**3. trip_members**
- `id` (BIGINT, PK)
- `trip_id` (FK -> trips)
- `user_id` (FK -> users)
- `role` (VARCHAR, Not Null) - *Enum: LEADER, MEMBER, GUEST*

### 4.2. Finance & Tracking Entities
**4. fund_contributions**
- `id` (BIGINT, PK)
- `trip_id` (FK -> trips)
- `user_id` (FK -> users)
- `amount` (DECIMAL 12,2, Not Null)
- `created_at` (TIMESTAMP)

**5. expenses**
- `id` (BIGINT, PK)
- `trip_id` (FK -> trips)
- `description` (VARCHAR, Not Null)
- `amount` (DECIMAL 12,2, Not Null)
- `is_paid_by_fund` (BOOLEAN, Default False)
- `payer_id` (FK -> users, Nullable)
- `split_type` (VARCHAR, Not Null) - *Enum: EQUAL, EXACT_AMOUNT*
- `created_by` (FK -> users)

**6. expense_splits**
- `id` (BIGINT, PK)
- `expense_id` (FK -> expenses)
- `user_id` (FK -> users)
- `amount_owed` (DECIMAL 12,2, Not Null)

**7. settlements**
- `id` (BIGINT, PK)
- `trip_id` (FK -> trips)
- `from_user_id` (FK -> users)
- `to_user_id` (FK -> users)
- `amount` (DECIMAL 12,2, Not Null)
- `is_settled` (BOOLEAN, Default False)

---

## 5. Lưu ý Thiết kế & Mở rộng (Implementation Notes)

- **Cấu trúc Backend:** Áp dụng mô hình chuẩn (Controller - Service - Repository). Các logic tính toán quyết toán nên được đóng gói cẩn thận trong tầng Service để dễ dàng viết Unit Test.
- **Bảo mật & Xác thực (Security & Auth):**
  - Cấu hình Spring Security Filter Chain chuẩn Stateless Session.
  - Sử dụng JWT (`jjwt`) để quản lý phiên xác thực REST API.
  - Cấu hình CORS chi tiết cho phép Frontend gửi các Headers: `Authorization`, `Content-Type`, `Accept-Language`.
- **Xử lý đồng thời (Concurrency):** Cần chú ý vấn đề đồng bộ khi nhiều người cùng add expense hoặc trừ tiền từ quỹ chung cùng một lúc (sử dụng Optimistic Locking với `@Version` trong JPA nếu cần thiết).

## 6. Yêu cầu Giao diện & Trải nghiệm Người dùng (UI/UX & Mobile Responsiveness)

- **Đa nền tảng (Responsive Design):** Giao diện phải hiển thị mượt mà và tối ưu trải nghiệm trên mọi kích thước màn hình: Desktop (≥1024px), Tablet (640px - 1023px) và Điện thoại di động (Mobile < 640px).
- **Điều hướng Mobile (Mobile Navigation):** Sử dụng Bottom Navigation Bar hoặc Hamburger Menu linh hoạt trên màn hình nhỏ để người dùng dễ dàng thao tác bằng một tay.
- **Tối ưu hiển thị Dữ liệu & Bảng:**
  - Trên màn hình Mobile, danh sách chi tiêu và bảng quyết toán ưu tiên chuyển sang dạng **Card View** trực quan thay cho dạng Table nguyên bản.
  - Trường hợp hiển thị dạng Bảng (Table), bắt buộc hỗ trợ cuộn ngang (`overflow-x-auto`) để không gây vỡ khung giao diện.
- **Đa ngôn ngữ (Internationalization - i18n):**
  - Hệ thống được kiến trúc để hỗ trợ 2 ngôn ngữ: **Tiếng Việt (`vi`)** và **Tiếng Anh (`en`)**.
  - Ở Phase 1, ngôn ngữ mặc định (Default Locale) là **Tiếng Việt (`vi`)**. Toàn bộ cấu trúc giao diện và API phản hồi phải sử dụng translation key để dễ dàng bật chuyển đổi ngôn ngữ sang Tiếng Anh ở các giai đoạn sau.
- **Tương tác Cảm ứng (Touch-Friendly UI):** Nút bấm (Buttons), Dropdowns, Inputs và Chức năng chọn/tick phải có kích thước vùng bấm tối thiểu 44x44px, khoảng cách giữa các phần tử đủ rộng để tránh thao tác nhầm trên điện thoại.

## 7. Định hướng Triển khai (Deployment & DevOps)
- **Containerization:** Dự án chuẩn hóa đóng gói bằng **Docker** cho cả Backend và Frontend.
- **Cấu hình Đóng gói:**
  - **Backend:** Đóng gói ứng dụng Spring Boot bằng Multi-stage Build (`Dockerfile`) dựa trên JDK 17/21.
  - **Frontend:** Đóng gói ReactJS/Vite bằng Multi-stage Build với `Nginx` làm web server điều hướng.
  - **Database:** Sử dụng Docker container cho MySQL 8.0.
- **Orchestration:** Sử dụng `docker-compose.yml` ở thư mục gốc để phối hợp khởi chạy 3 services (`backend`, `frontend`, `mysql_db`) chỉ bằng 1 lệnh.
- **Environment Variables:** Toàn bộ thông tin nhạy cảm (DB password, secret keys) phải được truyền qua file `.env`.