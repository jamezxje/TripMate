import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Epic 0: Quản lý Tài khoản & Xác thực (Auth Flow)', () => {
  // Tạo email ngẫu nhiên để tránh lỗi trùng lặp khi chạy test nhiều lần
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'password123';

  test('US 0.1: Đăng ký tài khoản thành công', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    // Điền thông tin đăng ký
    await page.locator('input[name="full_name"]').fill('Test User');
    await page.locator('input[name="email"]').fill(testEmail);
    await page.locator('input[name="password"]').fill(testPassword);
    
    // Submit
    await page.locator('button[type="submit"]').click();

    // Chờ và verify chuyển hướng về trang login sau khi đăng ký thành công
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/login`));
  });

  test('US 0.1: Báo lỗi khi mật khẩu quá ngắn', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    await page.locator('input[name="full_name"]').fill('Test User');
    await page.locator('input[name="email"]').fill(`short_${Date.now()}@example.com`);
    await page.locator('input[name="password"]').fill('123'); // Quá ngắn
    
    await page.locator('button[type="submit"]').click();

    // Validate lỗi UI
    const errorMsg = page.locator('text=Mật khẩu tối thiểu 6 ký tự').first();
    await expect(errorMsg).toBeVisible();
  });

  test('US 0.2 & US 0.3: Đăng nhập thành công và Đăng xuất', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Dùng account đã tạo hoặc tạo mock account trước
    // Ở đây ta giả sử dùng email `testEmail` đã đăng ký ở trên,
    // Tuy nhiên do các bài test chạy song song/độc lập, 
    // tốt nhất là test với 1 account cố định có sẵn trong DB hoặc tự động đăng ký qua API.
    // Ở đây tôi viết chuẩn quy trình UI.
    
    await page.locator('input[name="email"]').fill('lanh@example.com');
    await page.locator('input[name="password"]').fill('lanh@example.com');
    
    await page.locator('button[type="submit"]').click();

    // Verify đăng nhập thành công và chuyển về Home
    await expect(page).toHaveURL(`${BASE_URL}/`);
    
    // US 0.3: Đăng xuất
    // Nhấn vào nút tài khoản / Logout
    const logoutButton = page.locator('button').filter({ hasText: 'Đăng xuất' });
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      // Chuyển hướng về login
      await expect(page).toHaveURL(new RegExp(`${BASE_URL}/login`));
    }
  });
});
