# Lộ trình Triển khai Dự án (Implementation Plan)
**Tên dự án:** TripMate

Tài liệu này chi tiết hóa các giai đoạn và danh sách tác vụ (tasks) cần thực hiện. 
Trong quá trình phát triển cùng AI (Antigravity), hãy thực hiện tuần tự từng task và cập nhật trạng thái `- [ ]` thành `- [x]` sau khi hoàn thành.

---

## Phase 1: Môi trường & Khởi tạo Cơ sở Dữ liệu

- [x] **Task 1.1: Khởi tạo CSDL MySQL**
  - Tạo database `trip_tracker_db`.
  - Tạo script DDL SQL cho 7 bảng: `users`, `trips`, `trip_members`, `fund_contributions`, `expenses`, `expense_splits`, `settlements`.
  - Thiết lập Foreign Keys, Constraints và Indexes.

- [x] **Task 1.2: Khởi tạo Project Spring Boot**
  - Khởi tạo project Spring Boot (Java 17/21) với các dependencies: Spring Web, Spring Data JPA, MySQL Driver, Lombok, Validation (`spring-boot-starter-validation`).
  - Cấu hình file `application.yml` (kết nối DB, timezone UTC, JPA formatting).

- [x] **Task 1.3: Khởi tạo Project ReactJS Frontend**
  - Khởi tạo project ReactJS bằng Vite.
  - Cài đặt Tailwind CSS, Axios, Lucide React (hoặc Heroicons), Zustand (State Management), React Router DOM.
  - Thiết lập cấu trúc thư mục Feature-based theo `instruction.md`.

---

## Phase 2: Backend Core - Entities, DTOs & Exception Handling

- [x] **Task 2.1: Tạo các Enum Classes**
  - `TripStatus`: `PLANNING`, `ONGOING`, `SETTLED`, `CLOSED`.
  - `Role`: `LEADER`, `MEMBER`.
  - `SplitType`: `EQUAL`, `EXACT_AMOUNT`.

- [x] **Task 2.2: Triển khai JPA Entities**
  - Tạo các class `@Entity`: `User`, `Trip`, `TripMember`, `FundContribution`, `Expense`, `ExpenseSplit`, `Settlement`.
  - Tuân thủ `instruction.md`: Sử dụng `BigDecimal` cho tiền tệ, `@ManyToOne`/`@OneToMany` mapping, `@Table` và `@Column` đặt tên `snake_case`.

- [x] **Task 2.3: Khởi tạo Spring Data JPA Repositories**
  - Tạo repository interfaces: `UserRepository`, `TripRepository`, `TripMemberRepository`, `FundContributionRepository`, `ExpenseRepository`, `ExpenseSplitRepository`, `SettlementRepository`.

- [x] **Task 2.4: Xử lý Ngoại lệ Tập trung (Global Exception Handler) & i18n**
  - Tạo `ApiResponse<T>` wrapper class cho kết quả REST API.
  - Tạo `ErrorResponse` DTO.
  - Tạo Custom Exceptions: `ResourceNotFoundException`, `InsufficientFundException`, `UnauthorizedAccessException`, `InvalidExpenseException`.
  - Triển khai `@RestControllerAdvice` (`GlobalExceptionHandler`) để bắt và format các exception.
  - Cấu hình `MessageSource` i18n hỗ trợ đa ngôn ngữ thông báo lỗi backend (`messages_vi.properties`, `messages_en.properties`), mặc định Phase 1 là `vi`.

---

## Phase 3: Backend Business Logic & REST APIs

- [x] **Task 3.1: Module Quản lý Nhóm & Thành viên (Trips & Members)**
  - Viết DTOs (`CreateTripRequest`, `TripResponse`, `JoinTripRequest`).
  - Viết `TripService`: Logic tạo nhóm, sinh mã `join_code` ngẫu nhiên duy nhất, tự động gán creator thành `LEADER`. Logic tham gia nhóm bằng `join_code`.
  - Viết `TripController`: Các endpoints `/api/v1/trips`, `/api/v1/trips/join`, `/api/v1/trips/{tripId}`.

- [x] **Task 3.2: Module Quản lý Quỹ Chung (Fund Contributions)**
  - Viết DTOs (`FundContributionRequest`, `FundSummaryResponse`).
  - Viết `FundContributionService`: Ghi nhận đóng tiền quỹ, tính tổng quỹ hiện tại (`SUM(contributions) - SUM(expenses_paid_by_fund)`).
  - Viết `FundContributionController`: Endpoints đóng quỹ và xem tiến độ quỹ.

- [x] **Task 3.3: Module Ghi chép Chi tiêu (Expenses & Splits)**
  - Viết DTOs (`CreateExpenseRequest`, `ExpenseSplitDTO`, `ExpenseResponse`).
  - Viết `ExpenseService`:
    - Phân quyền: Nếu user là `MEMBER`, ép `payerId` = `currentUserId`. Nếu `LEADER`, cho phép chọn `payerId` hoặc `isPaidByFund = true`.
    - Logic trừ quỹ chung nếu `isPaidByFund = true` (kiểm tra dư quỹ).
    - Logic chia tiền `EQUAL`: Chia đều `amount / total_participants` (xử lý làm tròn tiền).
    - Logic chia tiền `EXACT_AMOUNT`: Validate `SUM(splits) == total_amount`.
  - Viết `ExpenseController`: Endpoints thêm/xem lịch sử chi tiêu của chuyến đi.

- [x] **Task 3.4: Module Tính toán Bảng tổng sắp & Đề xuất Quyết toán (Settlement Engine)**
  - Viết DTOs (`SettlementSummaryResponse`, `UserBalanceDTO`, `SuggestedTransferDTO`).
  - Viết `SettlementService`:
    - Tính Balance từng thành viên: `(Đã đóng quỹ + Ứng tiền trả hộ) - (Tiền cá nhân phải chịu từ splits)`.
    - Thuật toán tối ưu chuyển tiền (Greedy/Two-pointer approach): Khớp nối người nợ âm nhiều nhất với người nhận dương nhiều nhất để giảm tối đa số lượng giao dịch.
    - Logic đánh dấu giao dịch `is_settled = true` và chuyển trạng thái chuyến đi thành `CLOSED`.
  - Viết `SettlementController`: Endpoints xem bảng tổng kết, xem gợi ý chuyển khoản, tick hoàn tất quyết toán.

---

## Phase 4: Frontend Development - UI & Feature Modules

- [x] **Task 4.1: Setup Axios Client, Global Store & Frontend i18n**
  - Cấu hình Axios Instance trong `src/services/api.js` (base URL, handling response/error, header `Accept-Language`).
  - Khởi tạo Zustand Store (`useTripStore`, `useUserStore`) quản lý thông tin chuyến đi hiện tại và thông tin user.
  - Cài đặt và cấu hình `react-i18next` / `i18next` cho Frontend với các từ điển dịch `src/locales/vi/translation.json` (Phase 1 mặc định) và `src/locales/en/translation.json`.

- [x] **Task 4.2: Shared UI Components & Layout**
  - Tạo các UI Components reusable bằng Tailwind CSS: `Button`, `Input`, `Modal`, `Badge`, `Card`, `Table`, `Alert`.
  - Dựng Layout chính có Navbar, Navigation Tabs (Tổng quan, Quỹ, Chi tiêu, Lịch trình, Quyết toán).

- [x] **Task 4.3: Feature - Quản lý Nhóm & Quỹ**
  - Tạo UI Tạo nhóm mới & Nhập mã Join code.
  - Tạo UI Chi tiết nhóm: Hiển thị danh sách thành viên, vai trò (Leader/Member), Tiến độ đóng quỹ chung.
  - Tạo Modal Đóng quỹ chung.

- [x] **Task 4.4: Feature - Chi tiết Chi tiêu & Form Thêm khoản chi**
  - Tạo Màn hình danh sách chi tiêu (Expense List) hiển thị ai trả, bao nhiêu tiền, chia cho ai.
  - Tạo Component `SplitExpenseForm`:
    - Dropdown chọn Người thanh toán (Phân quyền Leader vs Member trên UI).
    - Toggle nút "Dùng tiền quỹ chung".
    - Switch tab "Chia đều" / "Chia theo số tiền cụ thể".
    - Auto-calculate và UI warning nếu tổng tiền chia lẻ không khớp với bill.

- [x] **Task 4.5: Feature - Màn hình Quyết toán (Settlement Dashboard)**
  - Hiển thị Bảng tổng kết số dư cá nhân (Màu Xanh = Nhận lại, Màu Đỏ = Cần đóng thêm).
  - Hiển thị Danh sách các chuyển khoản đề xuất ("A chuyển cho B 200.000đ").
  - Nút Checkbox cho Leader đánh dấu đã hoàn tất chuyển khoản.

---

## Phase 5: Tích hợp, Kiểm thử & Hoàn thiện

- [x] **Task 5.1: End-to-End Integration Testing**
  - Kiểm thử toàn bộ luồng nghiệp vụ từ A-Z:
    1. Leader tạo Trip -> Member dùng Join Code vào nhóm.
    2. Thành viên đóng quỹ ban đầu.
    3. Thêm khoản chi lấy từ quỹ -> Kiểm tra trừ quỹ.
    4. Thêm khoản chi do cá nhân tự trả (chia đều / chia lẻ).
    5. Chốt sổ -> Kiểm tra Bảng tổng sắp và thuật toán đề xuất chuyển khoản.
    6. Tick hoàn tất -> Khóa chuyến đi (`CLOSED`).

- [x] **Task 5.2: Edge Case & Validation Check**
  - Kiểm thử ghi âm quỹ.
  - Kiểm thử chia lẻ tiền lẻ (ví dụ 100.000 / 3 người).
  - Kiểm thử phân quyền Member thử sửa/xóa giao dịch hoặc chọn payer là người khác.
  - Kiểm thử Responsive UI trên màn hình Mobile.

- [x] **Task 5.3: Hoàn thiện & Code Cleanup**
  - Kiểm tra lại các quy tắc trong `instruction.md` (không còn `@Autowired` field, không trả về Entity out API, no inline CSS).
  - Đóng gói file `.env` mẫu (`.env.example`) và file `README.md` hướng dẫn chạy project.

---

## Phase 6: Authentication & Authorization (Đăng ký, Đăng nhập & Phân quyền)

- [x] **Task 6.1: Spring Security & JWT Core Configuration (Backend)**
  - Cài đặt dependency `spring-boot-starter-security` và `jjwt` trong `pom.xml`.
  - Triển khai `JwtUtils` / `JwtTokenProvider` (generateToken, validateToken, extractEmail).
  - Triển khai `JwtAuthenticationFilter` để bắt Bearer Token từ `Authorization` Header.
  - Cấu hình `SecurityConfig`: Disable CSRF, SessionManagement Statutory (STATELESS), permitAll cho `/api/v1/auth/**`, cấu hình CORS.

- [x] **Task 6.2: Module Auth REST APIs (Backend Service & Controller)**
  - Tạo các DTOs: `RegisterRequest`, `LoginRequest`, `AuthResponse`, `UserResponse`.
  - Viết `AuthService`: Logic kiểm tra email trùng, mã hóa password với `BCryptPasswordEncoder`, sinh JWT Token.
  - Viết `AuthController`: Đăng ký `/api/v1/auth/register`, Đăng nhập `/api/v1/auth/login`, Lấy thông tin bản thân `/api/v1/auth/me`.
  - Cập nhật các service hiện tại (`TripService`, `ExpenseService`, `FundContributionService`) tự động lấy `currentUserId` từ `SecurityContextHolder`.

- [x] **Task 6.3: Feature Đăng ký, Đăng nhập & Router Guard (Frontend)**
  - Tạo giao diện Màn hình Đăng nhập (`LoginPage.jsx`) & Màn hình Đăng ký (`RegisterPage.jsx`).
  - Cập nhật `useUserStore` lưu `token` và `currentUser` vào `localStorage`.
  - Cập nhật Axios client (`src/services/api.js`): Đính kèm `Authorization: Bearer <token>` vào mọi request, tự động bẫy lỗi 401 và logout/chuyển hướng về `/login`.
  - Tạo `ProtectedRoute.jsx` đóng gói bảo vệ toàn bộ màn hình ứng dụng chính.

## Phase 7: UI/UX Redesign & Visual Modernization (Nâng cấp Giao diện)

Tài liệu này chi tiết hóa danh sách tác vụ tái thiết kế giao diện (UI Redesign) cho TripMate, nâng cấp giao diện từ chuẩn cơ bản sang phong cách **Modern Travel FinTech Dashboard** (kết hợp Glassmorphism, Micro-interactions, Bố cục thẻ Clean & Sleek).

- [x] **Task 7.1: Chuẩn hóa Design System & Tailwind Theme Config**
  - Cập nhật `tailwind.config.js` với Bảng màu chính thức (Color Palette):
    - **Primary:** Violet/Indigo Gradient (`from-violet-600 to-indigo-700`).
    - **Accent/Money:** Emerald Green (`#10B981`) cho thu/dương số dư, Rose Red (`#F43F5E`) cho chi/âm số dư.
    - **Background:** Soft Gray (`#F8FAFC` / `#F1F5F9`) kết hợp hiệu ứng Ambient Glow.
  - Cấu hình Shadow Tokens (`shadow-sm`, `shadow-soft`, `shadow-glow`) và Border Radius (`rounded-2xl` mặc định cho Card).
  - Tích hợp font chữ hiện đại (Inter hoặc Plus Jakarta Sans).

- [x] **Task 7.2: Redesign Navigation Bar & Header**
  - Chuyển Navbar sang dạng **Glassmorphism Header** (`backdrop-blur-md bg-white/80 sticky top-0 z-50 border-b border-slate-100`).
  - Thiết kế lại Navigation Tabs: Chuyển active state từ nút bấm phẳng sang hiệu ứng **Sliding Indicator / Pill Tab** tinh tế.
  - Tối ưu khu vực User Profile & Language Switcher: Thêm Menu Dropdown bo tròn, hiển thị avatar sắc nét với trạng thái online badge.

- [x] **Task 7.3: Redesign Hero Banner & Tổng quan Chuyến đi (Trip Overview Header)**
  - Tái thiết kế Hero Banner chuyến đi: Thay khối tím phẳng bằng **Gradient Card với họa tiết Pattern/Mesh ẩn**, bo tròn 24px (`rounded-3xl`).
  - Nâng cấp phần **Mã mời (Invite Code)**: Thiết kế thành khối Glass Card nhỏ gọn, có hiệu ứng Ripple/Toast khi click nút "Sao chép".
  - Bổ sung **Dashboard Quick Stats Widget** ngay dưới Banner: 3 thẻ chỉ số nhanh (Tổng Quỹ, Tổng Chi Tiêu, Số dư cá nhân) với icon chuyển màu sinh động.

- [x] **Task 7.4: Modernize Thành viên & Card Layouts**
  - Thiết kế lại Danh sách Thành viên: Chuyển sang dạng **Grid Card tương tác**.
  - Mỗi Member Card có: Avatar viền Gradient, Badge Role (`LEADER` / `MEMBER`) bo tròn mềm mại, hiệu ứng `hover:-translate-y-1 transition-all duration-200 hover:shadow-md`.
  - Tối ưu không gian chứa (Card Container): Thêm viền mảnh (`border border-slate-200/60`), khoảng trắng (padding) thoáng đạt.

- [x] **Task 7.5: Redesign Màn hình Chi tiêu (Expense) & Quyết toán (Settlement)**
  - **Expense List:** Tái thiết kế từng dòng chi tiêu thành Transaction Card trực quan (Icon phân loại chi tiêu, highlight người trả, hiển thị Avatar người tham gia).
  - **Settlement Dashboard:** Hiển thị Số dư (Balance) dạng **Meter Bar / Progress Card** với màu sắc phân biệt rõ ràng (Xanh = Nhận lại, Đỏ = Cần đóng).
  - Tái thiết kế Modal/Drawer (Thêm khoản chi, Đóng quỹ): Sử dụng hiệu ứng Blur Backdrop, mượt mà khi đóng/mở.

- [x] **Task 7.6: Mobile Responsiveness & Bottom Navigation Bar**
  - Tối ưu giao diện trên Mobile (< 640px): Tự động ẩn Header Tab, bật **Bottom Navigation Bar** để thao tác bằng 1 tay.
  - Chuyển toàn bộ Table view sang **Card View** trên màn hình nhỏ.

- [x] **Task 7.7: Animations & Page Transitions**
  - Tích hợp `framer-motion` cho các hiệu ứng chuyển trang (fade-in, slide-up) khi chuyển đổi giữa các tab.
  - Sử dụng Micro-interactions cho các nút bấm (Ripple effect, Scale on hover).

- [x] **Task 7.8: Empty States & Skeleton Loading**
  - Cập nhật các trạng thái trống (Empty State) bằng hình minh họa (Illustrations) hoặc SVG Icons lớn, kèm Call-to-Action rõ ràng.
  - Áp dụng Skeleton Loaders thay vì spinner mặc định khi fetch dữ liệu từ API.

- [x] **Task 7.9: Nâng cấp Toast Notifications**
  - Thay thế Alert tĩnh bằng hệ thống Toast Notifications hiện đại (như `react-hot-toast` hoặc `sonner`) cho thông báo thành công/lỗi.

- [x] **Task 7.10: Tích hợp Dark Mode (Tùy chọn)**
  - Cấu hình TailwindCSS hỗ trợ `darkMode: 'class'`.
  - Bổ sung nút Toggle chuyển đổi Theme sáng/tối.
  - Review và tinh chỉnh màu sắc các thành phần UI ở chế độ tối.

---

## Phase 8: Tính năng Thành viên Ảo (Guest Member)

- [ ] **Task 8.1: Cập nhật Database Schema**
  - Sửa đổi bảng `users`: thêm cột `is_guest`, sửa `email` và `password_hash` thành Nullable.
  - Sửa đổi Enum Role trong `trip_members` thêm giá trị `GUEST`.

- [ ] **Task 8.2: Backend API tạo Guest**
  - Tạo API `POST /api/trips/{tripId}/guests` (Chỉ Leader được gọi).
  - Logic: Tạo bản ghi User (`is_guest=true`, email/pass null) -> Tạo bản ghi TripMember (`role=GUEST`).
  - Trả về thông tin Guest Member.

- [ ] **Task 8.3: Cập nhật API Get Members**
  - Bổ sung trường `isGuest` vào DTO trả về danh sách thành viên để Frontend phân biệt.

- [ ] **Task 8.4: Frontend UI Quản lý Thành viên**
  - Thêm nút "Thêm thành viên ảo" vào giao diện Quản lý Chuyến đi (TripDetailView hoặc modal riêng).
  - Xử lý Form thêm thành viên ảo (gọi API).
  - Hiển thị danh sách có phân biệt rõ các `MEMBER`, `LEADER` và `GUEST` (sử dụng Badge/màu khác).
