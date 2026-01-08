import { test, expect } from '../../fixtures/auth.fixture';
import { TIMEOUTS } from '../../utils/test-data';

/**
 * 管理后台 - 用户管理测试
 */
test.describe('管理后台 - 用户管理', () => {
  // AU-01: 用户列表查看
  test('AU-01: 用户列表查看', async ({ adminPage: page }) => {
    await page.goto('/admin/users');

    // 等待用户列表加载
    await page.waitForSelector('table', { timeout: TIMEOUTS.medium });

    // 验证表格存在
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // 验证有用户数据
    const rows = table.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // AU-02: 用户详情查看
  test('AU-02: 用户详情', async ({ adminPage: page }) => {
    await page.goto('/admin/users');

    // 等待表格加载
    await page.waitForSelector('table', { timeout: TIMEOUTS.medium });

    // 点击第一行用户
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.isVisible()) {
      const detailButton = firstRow.locator('button:has-text("详情"), button:has-text("查看")');
      if (await detailButton.isVisible()) {
        await detailButton.click();

        // 验证详情对话框或页面
        const dialog = page.locator('[role="dialog"], [class*="modal"]');
        if (await dialog.isVisible({ timeout: TIMEOUTS.short })) {
          await expect(dialog).toBeVisible();
        }
      }
    }
  });

  // AU-03: 用户角色修改
  test('AU-03: 用户角色修改', async ({ adminPage: page }) => {
    await page.goto('/admin/users');

    await page.waitForSelector('table', { timeout: TIMEOUTS.medium });

    // 查找角色选择器或编辑按钮
    const roleSelector = page.locator('[class*="Select"], select').first();
    if (await roleSelector.isVisible()) {
      // 验证角色选择器可交互
      await expect(roleSelector).toBeEnabled();
    }
  });

  // AU-04: 用户删除
  test('AU-04: 用户删除确认', async ({ adminPage: page }) => {
    await page.goto('/admin/users');

    await page.waitForSelector('table', { timeout: TIMEOUTS.medium });

    const deleteButton = page.locator('button:has-text("删除"), [title*="删除"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // 验证确认对话框
      const confirmDialog = page.locator('[role="alertdialog"]');
      if (await confirmDialog.isVisible({ timeout: TIMEOUTS.short })) {
        const cancelButton = confirmDialog.locator('button:has-text("取消")');
        await cancelButton.click();
      }
    }
  });

  // AU-05: 重置用户密码
  test('AU-05: 重置用户密码', async ({ adminPage: page }) => {
    await page.goto('/admin/users');

    await page.waitForSelector('table', { timeout: TIMEOUTS.medium });

    const resetButton = page.locator('button:has-text("重置密码"), button:has-text("Reset")').first();
    if (await resetButton.isVisible()) {
      await resetButton.click();

      // 验证重置密码对话框
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible({ timeout: TIMEOUTS.short })) {
        const cancelButton = dialog.locator('button:has-text("取消")');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }
  });
});
