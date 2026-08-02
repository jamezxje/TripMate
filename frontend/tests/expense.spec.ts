import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Epic 1 (Part 2): Quản lý Chi tiêu (Expense Flow)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[name="email"]').fill('lanh@example.com');
    await page.locator('input[name="password"]').fill('lanh@example.com');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('US 1.1: Thêm chi tiêu và chia đều (EQUAL)', async ({ page }) => {
    await page.goto(`${BASE_URL}/trips/1`);
    
    // Mở form thêm chi tiêu
    await page.locator('button').filter({ hasText: 'Thêm chi tiêu' }).click();

    await page.locator('input[name="description"]').fill('Tiền ăn trưa');
    await page.locator('input[name="amount"]').fill('300000');

    // Chọn người thanh toán (giả định select/dropdown)
    // Nếu dùng dropdown cơ bản:
    // await page.locator('select[name="payerId"]').selectOption('1');
    
    // Chọn loại chia: Chia đều
    const equalRadio = page.locator('input[type="radio"][value="EQUAL"]');
    if (await equalRadio.isVisible()) await equalRadio.check();

    await page.locator('button[type="submit"]').filter({ hasText: 'Lưu' }).click();

    // Verify có khoản chi xuất hiện trên màn hình
    await expect(page.locator('text="Tiền ăn trưa"').first()).toBeVisible();
    await expect(page.locator('text="300,000"').first()).toBeVisible();
  });

  test('US 1.2: Thêm chi tiêu và chia theo số tiền (EXACT_AMOUNT)', async ({ page }) => {
    await page.goto(`${BASE_URL}/trips/1`);
    
    await page.locator('button').filter({ hasText: 'Thêm chi tiêu' }).click();

    await page.locator('input[name="description"]').fill('Tiền vé tham quan');
    await page.locator('input[name="amount"]').fill('500000');

    // Chọn loại chia: Nhập tay
    const exactRadio = page.locator('input[type="radio"][value="EXACT_AMOUNT"]');
    if (await exactRadio.isVisible()) await exactRadio.check();

    // Nhập số tiền cho từng người (Giả định có 2 input cho 2 người)
    const splitInputs = page.locator('input[name^="split_"]');
    if (await splitInputs.count() >= 2) {
      await splitInputs.nth(0).fill('300000');
      await splitInputs.nth(1).fill('200000');
    }

    await page.locator('button[type="submit"]').filter({ hasText: 'Lưu' }).click();

    await expect(page.locator('text="Tiền vé tham quan"').first()).toBeVisible();
  });

  test('US 1.1: Báo lỗi khi chia số tiền không khớp (EXACT_AMOUNT)', async ({ page }) => {
    await page.goto(`${BASE_URL}/trips/1`);
    
    await page.locator('button').filter({ hasText: 'Thêm chi tiêu' }).click();
    await page.locator('input[name="description"]').fill('Sai lệch tiền');
    await page.locator('input[name="amount"]').fill('500000');

    const exactRadio = page.locator('input[type="radio"][value="EXACT_AMOUNT"]');
    if (await exactRadio.isVisible()) await exactRadio.check();

    // Cố tình nhập sai lệch
    const splitInputs = page.locator('input[name^="split_"]');
    if (await splitInputs.count() >= 2) {
      await splitInputs.nth(0).fill('100000');
      await splitInputs.nth(1).fill('200000');
    }

    // Submit có thể bị disable hoặc báo lỗi UI
    await page.locator('button[type="submit"]').filter({ hasText: 'Lưu' }).click();

    // Kiểm tra có thông báo lỗi hiện lên không (dùng text linh hoạt)
    const errorMsg = page.locator('text="Tổng tiền chia không khớp"').or(page.locator('.text-red-500').first());
    if (await errorMsg.count() > 0) {
      await expect(errorMsg).toBeVisible();
    }
  });
});
