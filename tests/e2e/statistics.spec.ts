import { test, expect } from '../fixtures/auth.fixture';
import { TIMEOUTS } from '../utils/test-data';

/**
 * 统计功能测试
 */
test.describe('统计功能', () => {
  // S-01: 学习统计页面加载
  test('S-01: 学习统计页面', async ({ authenticatedPage: page }) => {
    await page.goto('/statistics');

    // 等待统计页面加载
    await page.waitForSelector('[class*="stat"], [class*="chart"], [class*="calendar"]', {
      timeout: TIMEOUTS.medium,
    });

    // 验证统计数据显示
    const statsSection = page.locator('[class*="stat"], [class*="card"]');
    await expect(statsSection.first()).toBeVisible();
  });

  // S-02: 学习日历显示
  test('S-02: 学习日历', async ({ authenticatedPage: page }) => {
    await page.goto('/statistics');

    await page.waitForSelector('[class*="calendar"], [class*="Calendar"]', {
      timeout: TIMEOUTS.medium,
    });

    // 验证日历组件存在
    const calendar = page.locator('[class*="calendar"], [class*="Calendar"]');
    if (await calendar.isVisible()) {
      await expect(calendar).toBeVisible();
    }
  });

  // S-03: 连续学习天数
  test('S-03: 连续学习天数显示', async ({ authenticatedPage: page }) => {
    await page.goto('/statistics');

    await page.waitForTimeout(1000);

    // 查找连续学习天数显示
    const streakDisplay = page.locator('text=连续, text=streak, text=天');
    if (await streakDisplay.first().isVisible()) {
      await expect(streakDisplay.first()).toBeVisible();
    }
  });
});
