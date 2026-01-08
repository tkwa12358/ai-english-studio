import { test, expect } from '../../fixtures/auth.fixture';
import { TIMEOUTS } from '../../utils/test-data';

/**
 * 管理后台 - 分类管理测试
 */
test.describe('管理后台 - 分类管理', () => {
  // CT-01: 分类列表查看
  test('CT-01: 分类列表查看', async ({ adminPage: page }) => {
    await page.goto('/admin/categories');

    // 等待分类列表加载
    await page.waitForSelector('table, [class*="grid"], [class*="list"]', {
      timeout: TIMEOUTS.medium,
    });

    // 验证列表存在
    const list = page.locator('table, [class*="category-list"]');
    await expect(list).toBeVisible();
  });

  // CT-02: 创建分类
  test('CT-02: 创建分类', async ({ adminPage: page }) => {
    await page.goto('/admin/categories');

    const addButton = page.locator('button:has-text("添加"), button:has-text("新建"), button:has-text("创建")');
    if (await addButton.isVisible({ timeout: TIMEOUTS.short })) {
      await addButton.click();

      // 等待对话框
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: TIMEOUTS.short });

      // 验证名称输入框
      const nameInput = dialog.locator('input[name="name"], input[placeholder*="名称"]');
      await expect(nameInput).toBeVisible();

      // 关闭对话框
      const cancelButton = dialog.locator('button:has-text("取消")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      }
    }
  });

  // CT-03: 编辑分类
  test('CT-03: 编辑分类', async ({ adminPage: page }) => {
    await page.goto('/admin/categories');

    await page.waitForSelector('table, [class*="list"]', { timeout: TIMEOUTS.medium });

    const editButton = page.locator('button:has-text("编辑"), [title*="编辑"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();

      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible({ timeout: TIMEOUTS.short })) {
        // 验证输入框可编辑
        const nameInput = dialog.locator('input').first();
        await expect(nameInput).toBeEditable();

        // 关闭对话框
        const cancelButton = dialog.locator('button:has-text("取消")');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }
  });

  // CT-04: 删除分类
  test('CT-04: 删除分类确认', async ({ adminPage: page }) => {
    await page.goto('/admin/categories');

    await page.waitForSelector('table, [class*="list"]', { timeout: TIMEOUTS.medium });

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
});
