/**
 * 测试数据配置
 */

// 测试账号（使用邮箱登录）
export const TEST_ACCOUNTS = {
  admin: {
    account: 'admin@163.com',
    password: 'admin@163.com',
  },
  user: {
    account: 'user1@163.com',
    password: 'user123',
  },
  newUser: {
    account: 'newuser@163.com',
    password: 'newuser123',
  },
};

// API 基础 URL
export const API_BASE_URL = 'http://localhost:3000';

// 测试超时时间
export const TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
  upload: 60000,
};

// 测试文件路径
export const TEST_FILES = {
  video: 'tests/fixtures/test-video.mp4',
  subtitlesEn: 'tests/fixtures/test-subtitles.srt',
  subtitlesBilingual: 'tests/fixtures/test-bilingual.srt',
};

// 测试数据生成
export const generateTestData = {
  phone: () => `138${Date.now().toString().slice(-8)}`,
  email: () => `test${Date.now()}@example.com`,
  password: () => 'Test123456',
};

// 等待条件
export const waitForConditions = {
  networkIdle: { waitUntil: 'networkidle' as const },
  domContentLoaded: { waitUntil: 'domcontentloaded' as const },
};
