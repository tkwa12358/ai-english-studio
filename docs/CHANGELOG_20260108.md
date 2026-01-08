# AI English Studio - 变更日志

## 2026-01-08 版本更新

### 1. 后端路由架构重构

#### 问题背景
原有路由设计中，`/admin/*` 路径同时用于：
- 后端 API 端点（如 `/admin/dashboard` 返回 JSON 数据）
- 前端 SPA 页面路由（如 `/admin/dashboard` 管理后台页面）

这导致直接访问管理后台页面时返回 API 错误而非 SPA 页面。

#### 修改内容

**文件: `backend/src/app.ts`**

```javascript
// 修改前
app.use('/admin', adminRoutes);

// 修改后
// API 路由使用 /api 前缀
app.use('/api/admin', adminRoutes);

// SPA 路由逻辑更新
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/health') || req.path.startsWith('/uploads')) {
        return next();
    }
    // 返回 SPA 页面
    res.sendFile(indexPath);
});
```

**文件: `src/lib/api-client.ts`**

```javascript
// 修改前
async getDashboard() {
    const { data } = await api.get('/admin/dashboard');
    return data;
}

// 修改后
async getDashboard() {
    const { data } = await api.get('/api/admin/dashboard');
    return data;
}
```

所有 `adminApi` 方法都更新为使用 `/api/admin/*` 路径。

#### 影响范围
- 后端 API 路由
- 前端管理后台 API 调用
- 旧的 `/admin/*` API 路径不再可用，必须使用 `/api/admin/*`

---

### 2. Playwright E2E 测试框架

#### 新增文件

| 文件路径 | 说明 |
|----------|------|
| `playwright.config.ts` | Playwright 配置文件 |
| `tests/e2e/*.spec.ts` | 10 个测试文件，共 50 个测试用例 |
| `tests/fixtures/auth.fixture.ts` | 认证测试 fixture |
| `tests/utils/test-data.ts` | 测试数据配置 |

#### 测试命令

```bash
npm test              # 运行所有测试
npm run test:ui       # UI 模式运行
npm run test:headed   # 有头模式运行
npm run test:debug    # 调试模式
npm run test:report   # 查看测试报告
```

#### 测试结果
- 通过率: 86% (43/50)
- 详细报告: `docs/TEST_REPORT_20260108.md`

---

### 3. 测试账号配置

在 `tests/utils/test-data.ts` 中配置了测试账号：

```typescript
export const TEST_ACCOUNTS = {
  admin: {
    account: 'admin@163.com',
    password: 'admin@163.com',
  },
  user: {
    account: 'user1@163.com',
    password: 'user123',
  },
};
```

---

### 4. API 路由对照表

| 功能 | 旧路径 | 新路径 |
|------|--------|--------|
| 管理后台仪表盘 | `/admin/dashboard` | `/api/admin/dashboard` |
| 重置用户密码 | `/admin/reset-password` | `/api/admin/reset-password` |
| 初始化管理员 | `/admin/init` | `/api/admin/init` |
| 设置用户角色 | `/admin/set-role` | `/api/admin/set-role` |
| 添加用户额度 | `/admin/add-credits` | `/api/admin/add-credits` |
| 系统信息 | `/admin/system-info` | `/api/admin/system-info` |

其他 API 路径保持不变（兼容旧版）：
- `/auth/*` - 认证相关
- `/users/*` - 用户相关
- `/videos/*` - 视频相关
- `/categories/*` - 分类相关
- `/learning/*` - 学习进度相关
- `/words/*` - 单词本相关
- `/auth-codes/*` - 授权码相关
- `/translate/*` - 翻译相关
- `/assessment/*` - 评测相关

---

### 5. Docker 部署信息

**构建命令:**
```bash
docker build -t ai-english-studio-app .
```

**运行命令:**
```bash
docker run -d \
  --name ai-english-studio \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  --env-file .env \
  ai-english-studio-app
```

**数据持久化:**
- 数据库: `./data/ai_english.db`
- 上传文件: `./uploads/`

---

### 6. 应用授权码系统

#### 功能说明
新增独立的应用解锁授权码系统，与专业评测授权码分离：

- **30天免费试用期**: 用户注册后可免费使用所有功能30天
- **试用期结束提醒**: 试用期结束后弹出激活对话框
- **微信购买提示**: 显示微信号 384999233，引导用户购买授权码
- **应用解锁码**: 新增 `app_unlock` 授权码类型，用于解锁应用

#### 授权码类型对照表

| 类型 | 用途 | 说明 |
|------|------|------|
| `app_unlock` | 🔓 应用解锁 | 试用期结束后解锁全部功能 |
| `pro_10min` | ⭐ 专业评测 | 10分钟专业语音评测时长 |
| `pro_30min` | ⭐ 专业评测 | 30分钟专业语音评测时长 |
| `pro_60min` | ⭐ 专业评测 | 60分钟专业语音评测时长 |
| `registration` | 🔓 注册授权（旧） | 兼容旧版注册授权码 |

#### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/pages/Learn.tsx` | 移除默认激活，启用试用期检查 |
| `src/pages/LocalLearn.tsx` | 添加激活检查和弹窗 |
| `src/components/ActivationDialog.tsx` | 激活对话框（微信号 384999233） |
| `backend/src/routes/auth-codes.ts` | 添加 `app_unlock` 类型 |
| `src/pages/admin/AuthCodes.tsx` | 更新管理界面，区分应用授权和评测授权 |

#### 激活流程

```
用户注册 → 30天免费试用 → 试用期结束
                              ↓
                      弹出激活对话框
                              ↓
              显示微信号 384999233（购买授权码）
                              ↓
                      输入授权码激活
                              ↓
                        解锁全部功能
```

---

## 升级注意事项

1. **API 调用更新**: 如果有外部系统调用 `/admin/*` API，需要更新为 `/api/admin/*`
2. **缓存清理**: 部署后建议清理浏览器缓存
3. **数据备份**: 升级前建议备份 `./data/` 目录

---

## 回滚方案

如需回滚，恢复以下文件的原始版本：
1. `backend/src/app.ts`
2. `src/lib/api-client.ts`

然后重新构建 Docker 镜像。
