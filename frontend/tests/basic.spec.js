import { test, expect } from '@playwright/test';

test('Truy cập thử trang chủ Google để xác nhận Playwright hoạt động', async ({ page }) => {
  // Đi tới trang chủ Google
  await page.goto('https://www.google.com/');
  
  // Kiểm tra tiêu đề có chứa chữ "Google" không
  await expect(page).toHaveTitle(/Google/);
  
  console.log('Đã tải thành công trang web với Playwright!');
});
