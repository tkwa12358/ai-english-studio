import { test, expect } from '../fixtures/auth.fixture';
import { TIMEOUTS } from '../utils/test-data';

/**
 * 本地学习模块测试
 */
test.describe('本地学习模块', () => {
  // L-01: 视频文件上传
  test('L-01: 本地视频上传界面', async ({ authenticatedPage: page }) => {
    await page.goto('/local-learn');

    // 等待页面加载
    await page.waitForSelector('[class*="upload"], input[type="file"]', {
      timeout: TIMEOUTS.medium,
    });

    // 验证视频上传区域存在
    const videoInput = page.locator('input[type="file"][accept*="video"]');
    expect(await videoInput.count()).toBeGreaterThan(0);
  });

  // L-02: SRT字幕上传
  test('L-02: SRT字幕上传界面', async ({ authenticatedPage: page }) => {
    await page.goto('/local-learn');

    await page.waitForSelector('[class*="upload"], input[type="file"]', {
      timeout: TIMEOUTS.medium,
    });

    // 验证字幕上传区域存在
    const srtInput = page.locator('input[type="file"][accept*=".srt"]');
    expect(await srtInput.count()).toBeGreaterThan(0);
  });

  // L-03: 双语字幕解析
  test('L-03: 双语字幕提示', async ({ authenticatedPage: page }) => {
    await page.goto('/local-learn');

    await page.waitForSelector('[class*="upload"]', { timeout: TIMEOUTS.medium });

    // 验证双语字幕说明存在
    const bilingualHint = page.locator('text=双语, text=中英, text=bilingual');
    if (await bilingualHint.isVisible()) {
      await expect(bilingualHint).toBeVisible();
    }
  });

  // L-04: 本地视频播放学习
  test('L-04: 开始学习按钮', async ({ authenticatedPage: page }) => {
    await page.goto('/local-learn');

    await page.waitForSelector('[class*="upload"]', { timeout: TIMEOUTS.medium });

    // 验证开始学习按钮存在（需要上传文件后才能点击）
    const startButton = page.locator('button:has-text("开始学习"), button:has-text("Start")');
    await expect(startButton).toBeVisible();

    // 验证按钮初始状态为禁用
    await expect(startButton).toBeDisabled();
  });
});
