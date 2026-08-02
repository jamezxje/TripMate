# 🌍 TripMate - Smart Group Trip & Expense Management

**TripMate** là ứng dụng web quản lý chuyến đi, ghi chép chi tiêu nhóm và quyết toán bù trừ tài chính thông minh. Hệ thống hỗ trợ tính toán tiến độ quỹ chung, chia nhỏ chi phí (chia đều / chia lẻ cụ thể), thuật toán **Greedy Two-Pointer Settlement Engine** gợi ý số lượt chuyển tiền tối ưu nhất, và hỗ trợ đa ngôn ngữ (**Tiếng Việt** / **English**).

---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

### Backend Service
- **Framework:** Spring Boot 3.3.0 (Java 17/21)
- **Database:** MySQL 8.0 / JPA / Spring Data Repositories
- **API Standard:** Generic `ApiResponse<T>` & `ErrorResponse` với i18n `MessageSource`
- **Build Tool:** Apache Maven
- **Testing:** JUnit 5, Mockito, Spring MockMvc (37 Unit & E2E Tests - 100% Passed)

### Frontend Application
- **Framework:** React 19 (Vite Build Tool)
- **Styling:** Vanilla Tailwind CSS (Responsive, Mobile Touch-Friendly)
- **State Management:** Zustand (`useUserStore`, `useTripStore`)
- **HTTP Client:** Axios Client (Centralized Interceptors for Auth, i18n & Error Handling)
- **Internationalization (i18n):** `i18next` & `react-i18next` (Tiếng Việt `vi` & English `en`)
- **Icons:** Lucide React

### DevOps & Containerization
- **Containerization:** Docker Multi-stage Builds
- **Orchestration:** Docker Compose (`mysql`, `backend`, `frontend`)

---

## 🛠️ Hướng Dẫn Chạy Local (Development Mode)

### 1. Chuẩn bị Cơ sở dữ liệu MySQL
1. Tạo database tên `trip_mate_db` trên MySQL Local Server (Port 3306).
2. Nạp dữ liệu khởi tạo từ file `schema.sql` ở thư mục gốc:
   ```bash
   mysql -u root -p trip_mate_db < schema.sql
   ```

### 2. Chạy Backend Service
```bash
cd backend
mvn spring-boot:run
```
Backend sẽ khởi chạy tại: `http://localhost:8080` (Base URL: `http://localhost:8080/api/v1`)

### 3. Chạy Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Frontend sẽ khởi chạy tại: `http://localhost:3000`

---

## 🐳 Hướng Dẫn Chạy Bằng Docker & Docker Compose

Chỉ cần 1 lệnh duy nhất để khởi tạo toàn bộ môi trường MySQL, Backend Spring Boot và Frontend React Nginx:

```bash
# Đứng tại thư mục gốc dự án
docker compose up -d --build
```

- **Frontend App:** `http://localhost:3000`
- **Backend REST API:** `http://localhost:8080/api/v1`
- **MySQL Database:** `localhost:3306` (`trip_mate_db`)

Để dừng và dọn dẹp các containers:
```bash
docker compose down -v
```

---

## 📡 Danh Sách API Endpoints Trọng Tâm

| HTTP Method | API Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/v1/trips` | Tạo chuyến đi mới (Status: PLANNING, sinh joinCode 6 ký tự) |
| `POST` | `/api/v1/trips/join` | Gia nhập chuyến đi bằng mã joinCode |
| `GET` | `/api/v1/trips/{id}` | Lấy chi tiết chuyến đi & danh sách thành viên kèm vai trò |
| `POST` | `/api/v1/funds` | Ghi nhận tiền đóng quỹ nhóm |
| `GET` | `/api/v1/trips/{id}/funds` | Xem tiến độ đóng quỹ & số dư quỹ hiện tại |
| `POST` | `/api/v1/expenses` | Thêm khoản chi tiêu mới (EQUAL / EXACT_AMOUNT / Quỹ chung) |
| `GET` | `/api/v1/trips/{id}/expenses` | Xem danh sách lịch sử chi tiêu của chuyến đi |
| `GET` | `/api/v1/trips/{id}/settlements` | Xem Bảng tổng sắp số dư & Đề xuất chuyển khoản tối ưu |
| `PATCH` | `/api/v1/settlements/{id}/complete` | Leader đánh dấu hoàn tất chuyển khoản (Tự động CLOSE trip) |

---

## 🧪 Kiểm Thử Tự Động (Unit & E2E Integration Testing)

Để chạy toàn bộ 37 bài test tự động hóa (bao gồm các test case kiểm tra tiền lẻ, phân quyền Member/Leader và luồng E2E):
```bash
cd backend
mvn test
```

---

## 📜 Giấy Phép & Tác Giả

Dự án **TripMate** được phát triển tuân thủ các tiêu chuẩn code sạch, 3-layer architecture, responsive mobile-first và bảo mật phân quyền.
