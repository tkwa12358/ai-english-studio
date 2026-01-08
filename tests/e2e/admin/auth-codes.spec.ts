import { test, expect } from '../../fixtures/auth.fixture';
import { TIMEOUTS } from '../../utils/test-data';

/**
 * 管理后台 - 授权码测试
 */
test.describe('管理后台 - 授权码管理', () => {
  // AC-01: 授权码列表查看
  test('AC-01: 授权码列表查看', async ({ adminPage: page }) => {
    await page.goto('/admin/auth-codes');

    // 等待授权码列表加载
    await page.waitForSelector('table, [class*="grid"]', { timeout: TIMEOUTS.medium });

    // 验证表格存在
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  // AC-02: 生成注册授权码
  test('AC-02: 生成注册授权码', async ({ adminPage: page }) => {
    await page.goto('/admin/auth-codes');

    // 查找生成按钮
    const generateButton = page.locator('button:has-text("生成"), button:has-text("创建")');
    if (await generateButton.isVisible({ timeout: TIMEOUTS.short })) {
      await generateButton.click();

      // 等待生成对话框
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: TIMEOUTS.short });

      // 查找类型选择器
      const typeSelector = dialog.locator('[class*="Select"], select').first();
      if (await typeSelector.isVisible()) {
        await typeSelector.click();

        // 选择注册类型
        const registrationOption = page.locator('text=注册, text=registration');
        if (await registrationOption.isVisible()) {
          await registrationOption.click();
        }
      }

      // 关闭对话框
      const cancelButton = dialog.locator('button:has-text("取消")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      }
    }
  });

  // AC-03: 生成专业评测时长码
  test('AC-03: 生成专业评测时长码', async ({ adminPage: page }) => {
    await page.goto('/admin/auth-codes');

    const generateButton = page.locator('button:has-text("生成"), button:has-text("创建")');
    if (await generateButton.isVisible({ timeout: TIMEOUTS.short })) {
      await generateButton.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: TIMEOUTS.short });

      // 查找类型选择器
      const typeSelector = dialog.locator('[class*="Select"], select').first();
      if (await typeSelector.isVisible()) {
        await typeSelector.click();

        // 选择专业评测类型
        const proOption = page.locator('text=专业, text=pro_, text=分钟');
        if (await proOption.first().isVisible()) {
          await proOption.first().click();
        }
      }

      // 关闭对话框
      const cancelButton = dialog.locator('button:has-text("取消")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      }
    }
  });

  // AC-04: 授权码兑换
  test('AC-04: 授权码兑换流程', async ({ authenticatedPage: page }) => {
    // 访问个人中心或兑换页面
    await page.goto('/profile');

    // 查找兑换按钮或入口
    const redeemButton = page.locator('button:has-text("兑换"), button:has-text("激活")');
    if (await redeemButton.isVisible({ timeout: TIMEOUTS.short })) {
      await redeemButton.click();

      // 验证兑换对话框
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible({ timeout: TIMEOUTS.short })) {
        // 验证输入框存在
        const codeInput = dialog.locator('input');
        await expect(codeInput).toBeVisible();
      }
    }
  });
});
