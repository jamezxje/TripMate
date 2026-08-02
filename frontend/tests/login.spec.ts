import { test, expect } from '@playwright/test';

test.describe('Luồng Đăng nhập (Login Flow)', () => {
  test('Đăng nhập thành công với thông tin hợp lệ', async ({ page }) => {
    // 1. Mở trang đăng nhập (thay đổi port nếu frontend chạy port khác)
    await page.goto('http://localhost:3000/login');

    // 2. Điền email
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill('lanh@example.com'); // Thay bằng email có thật trong DB

    // 3. Điền mật khẩu
    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.fill('lanh@example.com'); // Thay bằng mật khẩu đúng

    // 4. Click nút Đăng nhập
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeEnabled();
    await loginButton.click();

    // 5. Xác nhận đã chuyển hướng về trang chủ thành công
    // Hệ thống sẽ redirect về '/'
    await expect(page).toHaveURL('http://localhost:3000/');

    // Kiểm tra UI Dashboard (Ví dụ: Chữ TripMate hoặc Danh sách Chuyến đi)
    await expect(page.locator('text=Danh sách Chuyến đi').first()).toBeVisible({ timeout: 10000 });
  });

  test('Hiển thị thông báo lỗi khi sai thông tin', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.locator('input[name="email"]').fill('lanh@example.com');
    await page.locator('input[name="password"]').fill('lanh@example.com');

    await page.locator('button[type="submit"]').click();

    // 6. Chờ thông báo lỗi (Alert component) hiển thị
    // Alert danger thường có CSS liên quan đến red/danger, hoặc bắt theo text
    const errorAlert = page.locator('div[role="alert"]').or(page.locator('.text-red-800')).first();
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
  });
});
