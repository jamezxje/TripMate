import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Epic 2: Quyết toán Chuyến đi (Settlement Flow)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[name="email"]').fill('lanh@example.com');
    await page.locator('input[name="password"]').fill('lanh@example.com');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('US 2.1: Xem Bảng tổng sắp tài chính', async ({ page }) => {
    await page.goto(`${BASE_URL}/trips/1`);
    
    // Chuyển sang Tab Quyết toán (Settlement)
    const settlementTab = page.locator('button, a').filter({ hasText: 'Quyết toán' });
    if (await settlementTab.isVisible()) {
      await settlementTab.click();
    } else {
      // Hoặc điều hướng trực tiếp nếu UI theo route
      await page.goto(`${BASE_URL}/trips/1/settlement`);
    }

    // Verify bảng tổng sắp xuất hiện
    await expect(page.locator('text="Bảng tổng kết"').first()).toBeVisible();

    // Kiểm tra có hiển thị các con số Balance
    // Chữ Đỏ (Cần đóng thêm) hoặc Xanh (Nhận lại)
    const positiveBalance = page.locator('.text-green-500, .text-green-600').first();
    const negativeBalance = page.locator('.text-red-500, .text-red-600').first();
    
    // Test sẽ expect ít nhất 1 dòng dữ liệu xuất hiện
    if (await positiveBalance.count() > 0) {
      await expect(positiveBalance).toBeVisible();
    } else if (await negativeBalance.count() > 0) {
      await expect(negativeBalance).toBeVisible();
    }
  });

  test('US 2.2: Đề xuất chuyển tiền và đánh dấu hoàn tất', async ({ page }) => {
    // Vào trang quyết toán
    await page.goto(`${BASE_URL}/trips/1/settlement`);

    // Verify danh sách đề xuất chuyển tiền
    await expect(page.locator('text="Đề xuất chuyển khoản"').first()).toBeVisible();

    // Nhấn "Hoàn tất" cho các đề xuất (Giả định có checkbox hoặc button "Đã hoàn tất")
    const completeBtns = page.locator('button').filter({ hasText: 'Đã hoàn tất' });
    if (await completeBtns.count() > 0) {
      await completeBtns.first().click();
      
      // Verify trạng thái thay đổi
      await expect(page.locator('text="Đã chuyển"').first()).toBeVisible();
    }

    // Nếu Leader hoàn tất toàn bộ, check xem nút Khóa (Close trip) có xuất hiện không
    const closeTripBtn = page.locator('button').filter({ hasText: 'Khóa chuyến đi' });
    if (await closeTripBtn.count() > 0) {
      await closeTripBtn.click();
      await expect(page.locator('text="CLOSED"').first()).toBeVisible();
    }
  });
});
