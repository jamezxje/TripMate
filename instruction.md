# AI Coding Conventions & System Instructions

File này quy định các chuẩn mực lập trình (Code Conventions) và kiến trúc hệ thống mà AI BẮT BUỘC phải tuân thủ khi khởi tạo, tái cấu trúc hoặc viết mới code cho dự án **TripMate**.

---

## 1. Nguyên tắc chung (General Rules)

- **Single Responsibility Principle:** Mỗi class, module hoặc UI component chỉ đảm nhận duy nhất một trách nhiệm.
- **Không hardcode:** Toàn bộ hằng số cấu hình, API URL, secret keys phải được quản lý qua `application.yml` (Backend) hoặc `.env` (Frontend).
- **Độ chính xác dữ liệu tài chính:** 
  - **BẮT BUỘC** sử dụng kiểu `BigDecimal` cho tất cả các trường dữ liệu liên quan đến tiền tệ (`amount`, `balance`, `owed`, `fund`).
  - **CẤM** sử dụng `double` hoặc `float` để tránh lỗi sai số dấu câu động (floating-point arithmetic).
- **Xử lý thời gian:**
  - Backend: Sử dụng `java.time.LocalDateTime` hoặc `java.time.Instant`. Không dùng `java.util.Date`.
  - Giữ múi giờ đồng nhất (UTC hoặc ISO-8601 string khi giao tiếp qua REST API).

---

## 2. Backend Conventions (Java + Spring Boot)

### 2.1. Kiến trúc Layer
Hệ thống tuân thủ nghiêm ngặt mô hình 3 lớp:
`Controller` ➔ `Service` ➔ `Repository` ➔ `Database`

1. **Controller Layer:**
   - Chịu trách nhiệm tiếp nhận request, validate payload và trả về response.
   - **KHÔNG** chứa bất kỳ đoạn business logic nào.
   - Tất cả endpoint phải trả về định dạng bọc chuẩn: `ResponseEntity<ApiResponse<T>>`.
   - **KHÔNG** bao giờ trả về trực tiếp `@Entity` ra API. Bắt buộc map sang Data Transfer Object (DTO).
   - Sử dụng `@Valid` để trigger validation trên Request DTO.

2. **Service Layer:**
   - Chứa toàn bộ Business Logic và kiểm soát giao dịch (Transaction).
   - Đánh dấu `@Transactional(readOnly = true)` ở cấp độ class và `@Transactional` ở từng method thực hiện thao tác Thêm/Sửa/Xóa.
   - Xử lý bù trừ tiền tệ, phân quyền (Leader vs Member) và tính toán balance đều nằm tại lớp này.

3. **Repository Layer:**
   - Kế thừa `JpaRepository`.
   - Các truy vấn phức tạp ưu tiên viết JPQL hoặc `@Query`. Limit số lượng Native Query trừ khi thật sự cần thiết.

### 2.2. Dependency Injection & Annotations
- **CẤM** sử dụng Field Injection (dùng `@Autowired` trực tiếp trên field).
- **BẮT BUỘC** sử dụng Constructor Injection.
- Sử dụng annotation `@RequiredArgsConstructor` của Lombok kết hợp khai báo các thuộc tính `private final`.

### 2.3. Quy tắc đặt tên (Naming Conventions)
- **Class/Interface:** PascalCase (ví dụ: `ExpenseService`, `TripRepository`).
- **Method/Variable:** camelCase (ví dụ: `calculateSettlement()`, `totalAmount`).
- **Constant:** UPPER_SNAKE_CASE (ví dụ: `DEFAULT_PAGE_SIZE`, `MAX_JOIN_CODE_LENGTH`).
- **RESTful API Endpoints:**
  - Sử dụng danh từ số nhiều, chữ thường, phân cách bằng dấu gạch ngang (`kebab-case`).
  - Đúng chuẩn ngữ nghĩa HTTP Methods (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`).
  - Ví dụ:
    - ✅ `POST /api/v1/trips/{tripId}/expenses`
    - ✅ `GET /api/v1/trips/{tripId}/settlements`
    - ❌ `POST /api/v1/trip/addExpense`

### 2.4. Xử lý Ngoại lệ (Exception Handling)
- Bắt và xử lý ngoại lệ tập trung tại `@RestControllerAdvice`.
- Tạo các Custom Exception kế thừa từ `RuntimeException` (ví dụ: `ResourceNotFoundException`, `InsufficientFundException`, `UnauthorizedAccessException`).
- Response lỗi phải tuân theo cấu trúc `ErrorResponse` đồng nhất (chứa timestamp, status code, error message, chi tiết validation errors).

---

## 3. Database Conventions (MySQL & JPA)

- **Tên bảng & Cột:** Sử dụng `snake_case` số nhiều cho tên bảng (ví dụ: `trips`, `expense_splits`).
- **Khóa chính (PK):** Đặt tên là `id`, kiểu `BIGINT`, cấu hình Auto Increment.
- **Khóa ngoại (FK):** Đặt tên theo dạng `[target_entity_singular]_id` (ví dụ: `trip_id`, `payer_id`).
- **Mapping JPA:**
  - Sử dụng `@Table(name = "...")` và `@Column(name = "...")` rõ ràng.
  - Sử dụng Enum mapping dạng `@Enumerated(EnumType.STRING)` cho các trường trạng thái.

---

## 4. Frontend Conventions (ReactJS + Tailwind CSS)

### 4.1. Khởi tạo & Cấu trúc Dự án
- Tạo project với **Vite** (sử dụng JavaScript/JSX hoặc TypeScript tùy chọn).
- Cấu trúc cây thư mục theo tính năng (Feature-based structure):
```text
src/
├── assets/          # Static assets (images, icons)
├── components/      # Common UI Components (Button, Modal, Input, Table)
├── features/        # Business Modules
│   ├── trips/       # Trip components, hooks, api
│   ├── expenses/    # Expense form, list, split UI
│   └── settlement/  # Balance & settlement suggestion UI
├── services/        # Axios client setup, Interceptors
├── store/           # Zustand/Redux Global state
├── utils/           # Helper functions (formatCurrency, formatDate)
└── routes/          # React Router setup
```

### 4.2. Viết Component & Hook
- Tất cả component là **Functional Components** sử dụng Arrow Function.
- Destructure `props` trực tiếp ở tham số truyền vào.
- Tách biệt logic fetch dữ liệu ra khỏi UI bằng cách viết Custom Hooks.
- Quản lý state cục bộ bằng `useState`/`useReducer`, state toàn cục bằng **Zustand** hoặc **Redux Toolkit**.

### 4.3. Styling & Form Handling
- **Styling:** Sử dụng thuần **Tailwind CSS**. Không viết file CSS riêng trừ trường hợp custom font hoặc animation đặc biệt.
- **Form:** Sử dụng `React Hook Form` kết hợp thư viện validate schema như `Zod` hoặc `Yup`.
- **API Call:** Sử dụng **Axios** instance có cấu hình sẵn `baseURL` và Interceptor để tự động gắn Token/xử lý lỗi 401, 403, 500.

### 4.4. Mobile-Responsive Standard (Tailwind CSS)
- Sử dụng các breakpoint chuẩn của Tailwind CSS (`sm:`, `md:`, `lg:`) để dựng giao diện.
- Sử dụng Mobile Navigation (Hamburger menu hoặc Bottom Navigation bar) trên màn hình nhỏ.
- Bảng dữ liệu (Tables) trên Mobile phải hỗ trợ cuộn ngang (`overflow-x-auto`) hoặc chuyển đổi sang dạng Card view để tránh vỡ giao diện.
- Form nhập liệu trên Mobile phải dễ bấm (touch-friendly targets, min-height 44px cho buttons/inputs).

### 4.5. Chuẩn Đa Ngôn Ngữ (Internationalization - i18n)
- **CẤM hardcode chuỗi hiển thị:** Không ghi cứng các chuỗi văn bản (String literals) trên UI hay thông báo lỗi API.
- **Frontend (i18next):**
  - Cài đặt `i18next` và `react-i18next`.
  - Quản lý các từ điển dịch tại `src/locales/vi/translation.json` và `src/locales/en/translation.json`.
  - Ở Phase 1, mặc định cấu hình ngôn ngữ là **Tiếng Việt (`vi`)**.
  - Component hiển thị văn bản phải gọi qua hook `useTranslation()` (ví dụ: `{t('common.save')}`).
- **Backend (Spring MessageSource):**
  - Cấu hình `ResourceBundleMessageSource` và các file `messages_vi.properties`, `messages_en.properties` trong `src/main/resources/`.
  - Xử lý ngôn ngữ phản hồi thông báo lỗi dựa theo Header `Accept-Language` (mặc định fallback về `vi`).
