import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Epic 1: Quản lý Nhóm & Quỹ (Trip Flow)', () => {

  // Test cần đăng nhập trước nên ta dùng một hook tiện lợi
  test.beforeEach(async ({ page }) => {
    // Giả sử có một API hỗ trợ hoặc UI đăng nhập cho user
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[name="email"]').fill('lanh@example.com');
    await page.locator('input[name="password"]').fill('lanh@example.com');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('US 2.1: Tạo nhóm mới thành công', async ({ page }) => {
    // Vào giao diện tạo nhóm
    const createTripBtn = page.locator('text="Tạo chuyến đi"').first();
    if (await createTripBtn.count() > 0) {
      await createTripBtn.click();
    } else {
      await page.goto(`${BASE_URL}/trips`);
    }

    await page.locator('input[name="name"]').fill('Chuyến đi Nha Trang 2026');
    await page.locator('button[type="submit"]').click();

    // Verify nhóm đã được tạo và chuyển tới trang chi tiết
    await expect(page.locator('text="Chuyến đi Nha Trang 2026"').first()).toBeVisible();
    
    // Kiểm tra trạng thái Planning
    await expect(page.locator('text="PLANNING"').first()).toBeVisible();
  });

  test('US 2.2: Tham gia nhóm bằng mã Invite', async ({ page }) => {
    // Vào mục Join trip
    await page.goto(`${BASE_URL}/trips/join`);
    
    // Nhập mã giả định (mã này sinh ngẫu nhiên thực tế nên nếu test E2E cần lấy mã từ test case 1)
    await page.locator('input[name="join_code"]').fill('ABCDEF');
    await page.locator('button[type="submit"]').click();

    // Verify gia nhập thành công
    // Sẽ redirect tới /trips/ID
    await expect(page.locator('text="Chi tiết Chuyến đi"').first()).toBeVisible({ timeout: 5000 });
  });

  test('US 2.3: Đóng quỹ ban đầu', async ({ page }) => {
    // Vào một chuyến đi cụ thể (Giả định ID = 1)
    await page.goto(`${BASE_URL}/trips/1`);
    
    // Nhấn Đóng quỹ
    await page.locator('button').filter({ hasText: 'Đóng quỹ' }).click();

    // Nhập số tiền
    await page.locator('input[name="amount"]').fill('500000');
    await page.locator('button[type="submit"]').filter({ hasText: 'Xác nhận' }).click();

    // Verify bảng tiến độ quỹ tăng lên
    await expect(page.locator('text="500,000"').first()).toBeVisible();
  });
});
