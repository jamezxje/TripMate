# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\auth.spec.ts >> Epic 0: Quản lý Tài khoản & Xác thực (Auth Flow) >> US 0.1: Đăng ký tài khoản thành công
- Location: tests\auth.spec.ts:10:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="full_name"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - button "vi" [ref=e5]
  - generic [ref=e10]:
    - generic [ref=e11]: TripMate
    - heading "Đăng ký tài khoản" [level=2] [ref=e17]
    - paragraph [ref=e18]: Bắt đầu chuyến hành trình tuyệt vời cùng TripMate
  - generic [ref=e20]:
    - generic [ref=e21]:
      - generic [ref=e22]:
        - generic [ref=e23]: Họ và tên
        - textbox "Nguyễn Văn A" [ref=e25]
      - generic [ref=e26]:
        - generic [ref=e27]: Địa chỉ Email
        - textbox "name@example.com" [ref=e29]
      - generic [ref=e30]:
        - generic [ref=e31]: Mật khẩu
        - textbox "••••••••" [ref=e33]
      - generic [ref=e34]:
        - generic [ref=e35]: Xác nhận mật khẩu
        - textbox "••••••••" [ref=e37]
      - button "Đăng ký tài khoản" [ref=e39]
    - paragraph [ref=e45]:
      - text: Đã có tài khoản?
      - link "Đăng nhập ngay" [ref=e46] [cursor=pointer]:
        - /url: /login
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const BASE_URL = 'http://localhost:3000';
  4  | 
  5  | test.describe('Epic 0: Quản lý Tài khoản & Xác thực (Auth Flow)', () => {
  6  |   // Tạo email ngẫu nhiên để tránh lỗi trùng lặp khi chạy test nhiều lần
  7  |   const testEmail = `testuser_${Date.now()}@example.com`;
  8  |   const testPassword = 'password123';
  9  | 
  10 |   test('US 0.1: Đăng ký tài khoản thành công', async ({ page }) => {
  11 |     await page.goto(`${BASE_URL}/register`);
  12 | 
  13 |     // Điền thông tin đăng ký
> 14 |     await page.locator('input[name="full_name"]').fill('Test User');
     |                                                   ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  15 |     await page.locator('input[name="email"]').fill(testEmail);
  16 |     await page.locator('input[name="password"]').fill(testPassword);
  17 |     
  18 |     // Submit
  19 |     await page.locator('button[type="submit"]').click();
  20 | 
  21 |     // Chờ và verify chuyển hướng về trang login sau khi đăng ký thành công
  22 |     await expect(page).toHaveURL(new RegExp(`${BASE_URL}/login`));
  23 |   });
  24 | 
  25 |   test('US 0.1: Báo lỗi khi mật khẩu quá ngắn', async ({ page }) => {
  26 |     await page.goto(`${BASE_URL}/register`);
  27 |     
  28 |     await page.locator('input[name="full_name"]').fill('Test User');
  29 |     await page.locator('input[name="email"]').fill(`short_${Date.now()}@example.com`);
  30 |     await page.locator('input[name="password"]').fill('123'); // Quá ngắn
  31 |     
  32 |     await page.locator('button[type="submit"]').click();
  33 | 
  34 |     // Validate lỗi UI
  35 |     const errorMsg = page.locator('text=Mật khẩu tối thiểu 6 ký tự').first();
  36 |     await expect(errorMsg).toBeVisible();
  37 |   });
  38 | 
  39 |   test('US 0.2 & US 0.3: Đăng nhập thành công và Đăng xuất', async ({ page }) => {
  40 |     await page.goto(`${BASE_URL}/login`);
  41 | 
  42 |     // Dùng account đã tạo hoặc tạo mock account trước
  43 |     // Ở đây ta giả sử dùng email `testEmail` đã đăng ký ở trên,
  44 |     // Tuy nhiên do các bài test chạy song song/độc lập, 
  45 |     // tốt nhất là test với 1 account cố định có sẵn trong DB hoặc tự động đăng ký qua API.
  46 |     // Ở đây tôi viết chuẩn quy trình UI.
  47 |     
  48 |     await page.locator('input[name="email"]').fill('lanh@example.com');
  49 |     await page.locator('input[name="password"]').fill('lanh@example.com');
  50 |     
  51 |     await page.locator('button[type="submit"]').click();
  52 | 
  53 |     // Verify đăng nhập thành công và chuyển về Home
  54 |     await expect(page).toHaveURL(`${BASE_URL}/`);
  55 |     
  56 |     // US 0.3: Đăng xuất
  57 |     // Nhấn vào nút tài khoản / Logout
  58 |     const logoutButton = page.locator('button').filter({ hasText: 'Đăng xuất' });
  59 |     if (await logoutButton.count() > 0) {
  60 |       await logoutButton.click();
  61 |       // Chuyển hướng về login
  62 |       await expect(page).toHaveURL(new RegExp(`${BASE_URL}/login`));
  63 |     }
  64 |   });
  65 | });
  66 | 
```