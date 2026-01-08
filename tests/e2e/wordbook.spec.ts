import { test, expect } from '../fixtures/auth.fixture';
import { TIMEOUTS } from '../utils/test-data';

/**
 * 单词本模块测试
 */
test.describe('单词本模块', () => {
  // W-01: 字幕点击查词
  test('W-01: 字幕点击查词', async ({ authenticatedPage: page }) => {
    await page.goto('/learn');

    const videoCard = page.locator('[class*="card"]').first();
    if (await videoCard.isVisible({ timeout: TIMEOUTS.medium })) {
      await videoCard.click();

      await page.waitForSelector('[class*="subtitle"]', { timeout: TIMEOUTS.long });

      // 点击字幕中的单词
      const wordSpan = page.locator('[class*="subtitle"] span').first();
      if (await wordSpan.isVisible()) {
        await wordSpan.click();

        // 等待查词弹窗
        const lookupDialog = page.locator('[class*="WordLookup"], [class*="lookup"], [role="dialog"]');
        await expect(lookupDialog).toBeVisible({ timeout: TIMEOUTS.medium });
      }
    }
  });

  // W-02: 单词添加到单词本
  test('W-02: 添加单词到单词本', async ({ authenticatedPage: page }) => {
    await page.goto('/learn');

    const videoCard = page.locator('[class*="card"]').first();
    if (await videoCard.isVisible({ timeout: TIMEOUTS.medium })) {
      await videoCard.click();

      await page.waitForSelector('[class*="subtitle"]', { timeout: TIMEOUTS.long });

      const wordSpan = page.locator('[class*="subtitle"] span').first();
      if (await wordSpan.isVisible()) {
        await wordSpan.click();

        // 等待查词弹窗
        await page.waitForTimeout(1000);

        // 点击添加按钮
        const addButton = page.locator('button:has-text("添加"), button:has-text("加入")');
        if (await addButton.isVisible()) {
          await addButton.click();

          // 验证添加成功提示
          const toast = page.locator('[class*="toast"], [role="alert"]');
          if (await toast.isVisible({ timeout: TIMEOUTS.short })) {
            await expect(toast).toContainText(/添加|成功/);
          }
        }
      }
    }
  });

  // W-03: 单词本列表查看
  test('W-03: 单词本列表', async ({ authenticatedPage: page }) => {
    await page.goto('/wordbook');

    // 等待单词本页面加载
    await page.waitForSelector('[class*="word"], table, [class*="list"]', {
      timeout: TIMEOUTS.medium,
    });

    // 验证页面加载
    const wordList = page.locator('[class*="word"], table, [class*="list"]');
    await expect(wordList).toBeVisible();
  });

  // W-04: 单词删除
  test('W-04: 单词删除', async ({ authenticatedPage: page }) => {
    await page.goto('/wordbook');

    await page.waitForSelector('[class*="word"], table', { timeout: TIMEOUTS.medium });

    const deleteButton = page.locator('button:has-text("删除"), [title*="删除"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // 验证删除确认或删除成功
      const confirmDialog = page.locator('[role="alertdialog"]');
      if (await confirmDialog.isVisible({ timeout: TIMEOUTS.short })) {
        const cancelButton = confirmDialog.locator('button:has-text("取消")');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }
  });
});
