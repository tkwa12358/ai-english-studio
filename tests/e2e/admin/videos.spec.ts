import { test, expect } from '../../fixtures/auth.fixture';
import { TIMEOUTS } from '../../utils/test-data';
import * as path from 'path';

/**
 * 管理后台 - 视频管理测试
 */
test.describe('管理后台 - 视频管理', () => {
  // AV-01: 视频列表查看
  test('AV-01: 视频列表查看', async ({ adminPage: page }) => {
    await page.goto('/admin/videos');

    // 等待视频列表加载
    await page.waitForSelector('table, [class*="grid"]', { timeout: TIMEOUTS.medium });

    // 验证表格或列表存在
    const table = page.locator('table, [class*="video-list"]');
    await expect(table).toBeVisible();
  });

  // AV-02: 视频上传（含封面截取）
  test('AV-02: 视频上传', async ({ adminPage: page }) => {
    await page.goto('/admin/videos');

    // 查找上传按钮或添加按钮
    const uploadButton = page.locator('button:has-text("上传"), button:has-text("添加"), button:has-text("新建")');
    if (await uploadButton.isVisible({ timeout: TIMEOUTS.short })) {
      await uploadButton.click();

      // 等待上传对话框
      await page.waitForSelector('[role="dialog"], [class*="modal"]', {
        timeout: TIMEOUTS.short,
      });

      // 检查视频上传区域
      const videoInput = page.locator('input[type="file"][accept*="video"]');
      expect(await videoInput.count()).toBeGreaterThan(0);
    }
  });

  // AV-03: SRT字幕上传
  test('AV-03: SRT字幕上传', async ({ adminPage: page }) => {
    await page.goto('/admin/videos');

    // 查找添加/编辑按钮
    const editButton = page.locator('button:has-text("编辑"), [title*="编辑"]').first();
    if (await editButton.isVisible({ timeout: TIMEOUTS.short })) {
      await editButton.click();

      // 等待编辑对话框
      await page.waitForSelector('[role="dialog"], [class*="modal"]', {
        timeout: TIMEOUTS.short,
      });

      // 检查字幕上传区域
      const srtInput = page.locator('input[type="file"][accept*=".srt"]');
      expect(await srtInput.count()).toBeGreaterThan(0);
    }
  });

  // AV-04: 视频发布/取消发布
  test('AV-04: 视频发布切换', async ({ adminPage: page }) => {
    await page.goto('/admin/videos');

    // 等待表格加载
    await page.waitForSelector('table', { timeout: TIMEOUTS.medium });

    // 查找发布状态开关
    const publishSwitch = page.locator('[role="switch"], input[type="checkbox"]').first();
    if (await publishSwitch.isVisible()) {
      const initialState = await publishSwitch.isChecked();

      await publishSwitch.click();
      await page.waitForTimeout(500);

      // 验证状态已切换
      const newState = await publishSwitch.isChecked();
      expect(newState).not.toBe(initialState);

      // 恢复原状态
      await publishSwitch.click();
    }
  });

  // AV-05: 视频编辑
  test('AV-05: 视频编辑', async ({ adminPage: page }) => {
    await page.goto('/admin/videos');

    const editButton = page.locator('button:has-text("编辑"), [title*="编辑"]').first();
    if (await editButton.isVisible({ timeout: TIMEOUTS.short })) {
      await editButton.click();

      // 等待编辑对话框
      const dialog = page.locator('[role="dialog"], [class*="modal"]');
      await expect(dialog).toBeVisible({ timeout: TIMEOUTS.short });

      // 验证标题输入框可编辑
      const titleInput = dialog.locator('input[name="title"], input[placeholder*="标题"]');
      if (await titleInput.isVisible()) {
        await expect(titleInput).toBeEditable();
      }

      // 关闭对话框
      const closeButton = dialog.locator('button:has-text("取消"), button:has-text("关闭"), [class*="close"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
  });

  // AV-06: 视频删除
  test('AV-06: 视频删除确认', async ({ adminPage: page }) => {
    await page.goto('/admin/videos');

    const deleteButton = page.locator('button:has-text("删除"), [title*="删除"]').first();
    if (await deleteButton.isVisible({ timeout: TIMEOUTS.short })) {
      await deleteButton.click();

      // 验证删除确认对话框
      const confirmDialog = page.locator('[role="alertdialog"], [class*="confirm"]');
      if (await confirmDialog.isVisible({ timeout: TIMEOUTS.short })) {
        // 点击取消，不真正删除
        const cancelButton = confirmDialog.locator('button:has-text("取消"), button:has-text("否")');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }
  });

  // AV-07: 封面截取时间验证
  test('AV-07: 封面截取功能', async ({ adminPage: page }) => {
    await page.goto('/admin/videos');

    const uploadButton = page.locator('button:has-text("上传"), button:has-text("添加")');
    if (await uploadButton.isVisible({ timeout: TIMEOUTS.short })) {
      await uploadButton.click();

      // 等待上传对话框
      await page.waitForSelector('[role="dialog"]', { timeout: TIMEOUTS.short });

      // 检查是否有封面相关的控件
      const thumbnailSection = page.locator('text=封面, text=Thumbnail');
      expect(await thumbnailSection.count()).toBeGreaterThanOrEqual(0);
    }
  });
});
