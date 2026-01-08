import { test as base, expect, Page } from '@playwright/test';
import { TEST_ACCOUNTS, TIMEOUTS } from '../utils/test-data';

/**
 * 认证 Fixture - 提供登录状态的测试上下文
 */

// 扩展 test fixture
export const test = base.extend<{
  authenticatedPage: Page;
  adminPage: Page;
}>({
  // 普通用户登录状态
  authenticatedPage: async ({ page }, use) => {
    await loginAs(page, TEST_ACCOUNTS.user);
    await use(page);
  },

  // 管理员登录状态
  adminPage: async ({ page }, use) => {
    await loginAs(page, TEST_ACCOUNTS.admin);
    await use(page);
  },
});

/**
 * 登录辅助函数
 */
export async function loginAs(
  page: Page,
  account: { account: string; password: string }
) {
  await page.goto('/login');

  // 等待登录表单加载
  await page.waitForSelector('#account, input[placeholder*="手机"], input[placeholder*="邮箱"]', {
    timeout: TIMEOUTS.medium,
  });

  // 填写登录表单
  await page.fill('#account, input[placeholder*="手机"], input[placeholder*="邮箱"]', account.account);
  await page.fill('input[type="password"]', account.password);

  // 点击登录按钮
  await page.click('button[type="submit"]');

  // 等待登录成功（跳转到首页或学习页）
  await page.waitForURL(/\/(learn|index|$)/, {
    timeout: TIMEOUTS.medium,
  });

  // 等待网络请求完成，确保 token 已保存
  await page.waitForLoadState('networkidle');

  // 验证 token 已保存
  const token = await page.evaluate(() => localStorage.getItem('token'));
  if (!token) {
    throw new Error('Login failed: token not found in localStorage');
  }
}

/**
 * 登录并导航到指定页面
 */
export async function loginAndNavigate(
  page: Page,
  account: { account: string; password: string },
  targetUrl: string
) {
  await loginAs(page, account);

  // 导航到目标页面
  await page.goto(targetUrl);

  // 等待页面加载完成
  await page.waitForLoadState('networkidle');
}

/**
 * 登出辅助函数
 */
export async function logout(page: Page) {
  // 点击用户头像/菜单
  const userMenu = page.locator('[data-testid="user-menu"], .user-avatar, header button:has(svg)').first();
  if (await userMenu.isVisible()) {
    await userMenu.click();
    // 点击登出按钮
    const logoutBtn = page.locator('text=登出, text=退出登录, text=Logout');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL('/login', { timeout: TIMEOUTS.short });
    }
  }
}

/**
 * 检查是否已登录
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // 检查 localStorage 中的 token
  const token = await page.evaluate(() => localStorage.getItem('token'));
  return !!token;
}

/**
 * 清除登录状态
 */
export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  });
}

export { expect };
