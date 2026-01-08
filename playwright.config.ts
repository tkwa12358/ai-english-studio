import { defineConfig, devices } from '@playwright/test';

/**
 * AI English Studio - Playwright E2E 测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 测试目录
  testDir: './tests/e2e',

  // 测试超时时间
  timeout: 60000,

  // 期望超时时间
  expect: {
    timeout: 10000,
  },

  // 不并行运行（避免登录状态冲突）
  fullyParallel: false,

  // 失败时重试次数
  retries: 1,

  // 单进程运行
  workers: 1,

  // 报告配置
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // 全局配置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',

    // 失败时截图
    screenshot: 'only-on-failure',

    // 失败时录制视频
    video: 'retain-on-failure',

    // 失败时保存 trace
    trace: 'retain-on-failure',

    // 视口大小
    viewport: { width: 1280, height: 720 },

    // 忽略 HTTPS 错误
    ignoreHTTPSErrors: true,

    // 语言设置
    locale: 'zh-CN',
  },

  // 浏览器配置
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
          ],
        },
      },
    },
  ],

  // 输出目录
  outputDir: 'test-results',
});
