# AI English Studio - 数据库迁移方案

> 从 Supabase 迁移到 MySQL + Express 的完整方案

## 背景

当前项目使用 Supabase 全栈架构，存在以下问题：
- 本地配置复杂，Docker 服务多达 8 个容器
- 服务器部署和运维困难
- 项目报错多，调试成本高
- 不利于后期转为移动端 App

## 目标

将数据库从 Supabase (PostgreSQL + 微服务) 迁移到更轻量的方案，支持：
- 本地开发简单
- 服务器部署容易
- 移动端友好

---

## 最终方案

**MySQL + Express 后端**

| 选项 | 选择 |
|------|------|
| 数据库 | MySQL 8.0 |
| 后端框架 | Express + TypeScript |
| 认证方式 | 自建 JWT 认证 |
| 文件存储 | 本地文件系统 |

选择理由：
1. 支持高并发写入和行级锁
2. 远程访问原生支持
3. 成熟的生态和工具链
4. 适合多用户 Web 服务场景
5. 后期如需移动端，可使用 MySQL 作为云端同步数据库，移动端本地使用 SQLite 缓存

---

## 架构对比

### 当前架构 (Supabase)
```
前端 (React) → Supabase Client SDK → Kong API Gateway
                                          ↓
                    ┌─────────────────────────────────────┐
                    │  PostgreSQL  │  GoTrue  │  Storage  │
                    │  PostgREST   │ Realtime │  Edge Fn  │
                    └─────────────────────────────────────┘

容器数量：8 个
```

### 目标架构 (MySQL + Express)
```
前端 (React) → Express API → MySQL 数据库
                    ↓
              ┌─────────────────┐
              │  认证模块       │
              │  文件存储模块   │
              │  业务 API 模块  │
              └─────────────────┘

容器数量：3 个
```

---

## 需要替换的 Supabase 功能

### 1. 认证系统 (Auth)
| 当前使用 | 替换方案 |
|---------|---------|
| `auth.signInWithPassword()` | `POST /auth/login` + bcrypt |
| `auth.signUp()` | `POST /auth/register` |
| `auth.signOut()` | `POST /auth/logout` |
| `auth.getSession()` | JWT token 验证 |
| `auth.onAuthStateChange()` | 前端 token 状态管理 |

### 2. 数据库查询
| 当前使用 | 替换方案 |
|---------|---------|
| `supabase.from('table').select()` | `api.get('/table')` |
| `supabase.from('table').insert()` | `api.post('/table')` |
| `supabase.from('table').update()` | `api.put('/table/:id')` |
| `supabase.from('table').delete()` | `api.delete('/table/:id')` |

### 3. RPC 函数
| 当前使用 | 替换方案 |
|---------|---------|
| `rpc('is_admin')` | `GET /auth/me` 返回角色 |
| `rpc('check_device_limit')` | `POST /auth/check-device` |
| `rpc('update_user_statistics')` | `POST /learning/statistics` |

### 4. 文件存储 (Storage)
| 当前使用 | 替换方案 |
|---------|---------|
| `storage.from('videos').upload()` | `POST /videos/upload` + multer |
| `storage.getPublicUrl()` | 静态文件服务 `/uploads/videos/` |

### 5. Edge Functions
| 函数 | 替换方案 |
|------|---------|
| `redeem-code` | `POST /auth-codes/redeem` |
| `translate` | `POST /translate` |
| `professional-assessment` | `POST /assessment/evaluate` |
| `import-dictionary` | `POST /words/import` |
| `init-admin` | `POST /admin/init` |
| `admin-action` | `POST /admin/reset-password` |

### 6. Row Level Security (RLS)
- 在 API 层实现权限检查中间件
- 每个请求验证 user_id 归属

---

## MySQL 数据库 Schema

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS ai_english CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_english;

-- 用户表（合并 auth.users 和 profiles）
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  role ENUM('user', 'admin') DEFAULT 'user',
  voice_credits INT DEFAULT 0,
  professional_voice_minutes INT DEFAULT 0,
  email_confirmed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone)
) ENGINE=InnoDB;

-- 用户会话表
CREATE TABLE user_sessions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  device_id VARCHAR(255),
  device_info TEXT,
  ip_address VARCHAR(45),
  token VARCHAR(500) UNIQUE,
  expires_at DATETIME,
  last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_device (user_id, device_id),
  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 视频分类表
CREATE TABLE video_categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 视频表
CREATE TABLE videos (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  category_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INT,
  subtitles_en LONGTEXT,
  subtitles_cn LONGTEXT,
  is_published TINYINT(1) DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category_id),
  INDEX idx_published (is_published),
  FOREIGN KEY (category_id) REFERENCES video_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 学习进度表
CREATE TABLE learning_progress (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  video_id VARCHAR(36),
  last_position INT DEFAULT 0,
  completed_sentences JSON DEFAULT '[]',
  total_practice_time INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_video (user_id, video_id),
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 单词本表
CREATE TABLE word_book (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  word VARCHAR(100) NOT NULL,
  phonetic VARCHAR(100),
  translation TEXT,
  context TEXT,
  context_translation TEXT,
  definitions JSON DEFAULT '[]',
  mastery_level INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  INDEX idx_user (user_id),
  INDEX idx_word (word),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 单词缓存表
CREATE TABLE word_cache (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  word VARCHAR(100) NOT NULL UNIQUE,
  phonetic VARCHAR(100),
  translation TEXT,
  definitions JSON DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_word (word),
  INDEX idx_word_lower ((LOWER(word)))
) ENGINE=InnoDB;

-- 授权码表
CREATE TABLE auth_codes (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(50) NOT NULL UNIQUE,
  code_type ENUM('registration', '10min', '60min', 'pro_10min', 'pro_30min', 'pro_60min') NOT NULL,
  minutes_amount INT,
  is_used TINYINT(1) DEFAULT 0,
  used_by VARCHAR(36),
  used_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_used (is_used),
  FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 语音评测表
CREATE TABLE voice_assessments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  video_id VARCHAR(36),
  original_text TEXT NOT NULL,
  user_audio_url TEXT,
  accuracy_score DECIMAL(5,2),
  fluency_score DECIMAL(5,2),
  completeness_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 专业评测供应商表
CREATE TABLE professional_assessment_providers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  provider_type VARCHAR(50) NOT NULL,
  api_endpoint TEXT NOT NULL,
  api_key_secret_name VARCHAR(100),
  api_secret_key_name VARCHAR(100),
  region VARCHAR(50),
  is_active TINYINT(1) DEFAULT 1,
  is_default TINYINT(1) DEFAULT 0,
  priority INT DEFAULT 0,
  config_json JSON DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 专业评测记录表
CREATE TABLE professional_assessments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  video_id VARCHAR(36),
  original_text TEXT NOT NULL,
  provider_id VARCHAR(36),
  provider_name VARCHAR(100) NOT NULL,
  pronunciation_score DECIMAL(5,2),
  accuracy_score DECIMAL(5,2),
  fluency_score DECIMAL(5,2),
  completeness_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  words_result JSON,
  phonemes_result JSON,
  feedback TEXT,
  duration_seconds INT,
  minutes_charged INT DEFAULT 0,
  is_billed TINYINT(1) DEFAULT 0,
  billing_error TEXT,
  raw_response JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL,
  FOREIGN KEY (provider_id) REFERENCES professional_assessment_providers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 翻译供应商表
CREATE TABLE translation_providers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  provider_type VARCHAR(50) NOT NULL,
  app_id VARCHAR(100),
  api_key VARCHAR(255) NOT NULL,
  api_secret VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  is_default TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 用户统计表
CREATE TABLE user_statistics (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL UNIQUE,
  total_watch_time INT DEFAULT 0,
  total_practice_time INT DEFAULT 0,
  today_watch_time INT DEFAULT 0,
  today_practice_time INT DEFAULT 0,
  total_videos_watched INT DEFAULT 0,
  total_sentences_completed INT DEFAULT 0,
  total_words_learned INT DEFAULT 0,
  total_assessments INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_study_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 每日统计表
CREATE TABLE daily_statistics (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  study_date DATE NOT NULL,
  watch_time INT DEFAULT 0,
  practice_time INT DEFAULT 0,
  sentences_completed INT DEFAULT 0,
  words_learned INT DEFAULT 0,
  videos_watched INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date (user_id, study_date),
  INDEX idx_user (user_id),
  INDEX idx_date (study_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 注册尝试记录表（防刷）
CREATE TABLE registration_attempts (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  ip_address VARCHAR(45) NOT NULL,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip (ip_address),
  INDEX idx_time (attempted_at)
) ENGINE=InnoDB;
```

---

## 后端项目结构

```
backend/
├── src/
│   ├── app.ts                 # Express 主入口
│   ├── config/
│   │   └── database.ts        # MySQL 连接池配置
│   ├── middleware/
│   │   ├── auth.ts            # JWT 认证中间件
│   │   ├── admin.ts           # 管理员权限检查
│   │   └── error-handler.ts   # 错误处理
│   ├── routes/
│   │   ├── auth.ts            # /auth/*
│   │   ├── users.ts           # /users/*
│   │   ├── videos.ts          # /videos/*
│   │   ├── categories.ts      # /categories/*
│   │   ├── learning.ts        # /learning/*
│   │   ├── words.ts           # /words/*
│   │   ├── auth-codes.ts      # /auth-codes/*
│   │   ├── translate.ts       # /translate
│   │   ├── assessment.ts      # /assessment/*
│   │   └── admin.ts           # /admin/*
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── video.service.ts
│   │   ├── learning.service.ts
│   │   ├── word.service.ts
│   │   ├── translate.service.ts
│   │   └── assessment.service.ts
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── video.repository.ts
│   │   └── ... (每个表一个)
│   └── utils/
│       ├── crypto.ts          # 密码加密、签名
│       └── jwt.ts             # JWT 工具
├── sql/
│   └── init.sql               # 数据库初始化脚本
├── uploads/
│   ├── videos/
│   └── thumbnails/
├── package.json
└── tsconfig.json
```

### 核心依赖

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "mysql2": "^3.6.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "multer": "^1.4.5",
    "cors": "^2.8.5",
    "axios": "^1.6.0",
    "dotenv": "^16.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/bcrypt": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/multer": "^1.4.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0"
  }
}
```

---

## API 端点设计

```
认证模块:
POST   /auth/register          # 注册
POST   /auth/login             # 登录
POST   /auth/logout            # 登出
GET    /auth/me                # 获取当前用户
POST   /auth/refresh           # 刷新 token

用户模块:
GET    /users                  # 用户列表 (管理员)
GET    /users/:id              # 用户详情
PUT    /users/:id              # 更新用户
DELETE /users/:id              # 删除用户

视频模块:
GET    /videos                 # 视频列表
GET    /videos/:id             # 视频详情
POST   /videos                 # 创建视频 (管理员)
PUT    /videos/:id             # 更新视频 (管理员)
DELETE /videos/:id             # 删除视频 (管理员)
POST   /videos/:id/upload      # 上传视频文件

分类模块:
GET    /categories             # 分类列表
POST   /categories             # 创建分类 (管理员)
PUT    /categories/:id         # 更新分类 (管理员)
DELETE /categories/:id         # 删除分类 (管理员)

学习模块:
GET    /learning/progress      # 获取学习进度
POST   /learning/progress      # 更新学习进度
GET    /learning/statistics    # 获取学习统计
GET    /learning/daily         # 获取每日统计

单词模块:
GET    /words                  # 获取单词本
POST   /words                  # 添加单词
DELETE /words/:id              # 删除单词
GET    /words/cache/:word      # 查询单词缓存
POST   /words/cache            # 缓存单词

翻译模块:
POST   /translate              # 翻译文本

评测模块:
GET    /assessment/providers   # 获取评测供应商
POST   /assessment/evaluate    # 发音评测

授权码模块:
GET    /auth-codes             # 授权码列表 (管理员)
POST   /auth-codes/generate    # 生成授权码 (管理员)
POST   /auth-codes/redeem      # 兑换授权码

管理员模块:
GET    /admin/dashboard        # 仪表盘统计
POST   /admin/reset-password   # 重置用户密码
POST   /admin/init             # 初始化管理员
```

---

## 前端改造

### 1. 创建 API 客户端

```typescript
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

// 自动附加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 处理 401 自动登出
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { api };
```

### 2. 修改 AuthContext

```typescript
// 登录
const login = async (phone: string, password: string) => {
  const { data } = await api.post('/auth/login', { phone, password });
  localStorage.setItem('token', data.token);
  setUser(data.user);
};

// 注册
const register = async (phone: string, password: string, code: string) => {
  const { data } = await api.post('/auth/register', { phone, password, code });
  localStorage.setItem('token', data.token);
  setUser(data.user);
};

// 登出
const logout = async () => {
  await api.post('/auth/logout');
  localStorage.removeItem('token');
  setUser(null);
};
```

### 3. 数据查询改造示例

```typescript
// 原来 (Supabase)
const { data } = await supabase.from('videos').select('*');

// 改为 (API)
const { data } = await api.get('/videos');
```

### 4. 文件上传改造

```typescript
// 原来
const { data } = await supabase.storage
  .from('videos')
  .upload(filename, file);

// 改为
const formData = new FormData();
formData.append('file', file);
const { data } = await api.post('/videos/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

---

## 需要修改的前端文件清单

### 核心文件（必须修改）
```
src/integrations/supabase/client.ts    → 删除，替换为 src/lib/api.ts
src/lib/supabase.ts                    → 删除，类型定义移动到新位置
src/contexts/AuthContext.tsx           → 重写认证逻辑
```

### 页面文件（需要修改数据获取）
```
src/pages/Index.tsx
src/pages/Learn.tsx
src/pages/LocalLearn.tsx
src/pages/Login.tsx
src/pages/Register.tsx
src/pages/Profile.tsx
src/pages/Statistics.tsx
src/pages/WordBook.tsx
src/pages/admin/Dashboard.tsx
src/pages/admin/Users.tsx
src/pages/admin/Videos.tsx
src/pages/admin/Categories.tsx
src/pages/admin/AuthCodes.tsx
src/pages/admin/Dictionary.tsx
src/pages/admin/TranslationProviders.tsx
src/pages/admin/ProfessionalProviders.tsx
```

### 组件文件（需要修改）
```
src/components/Header.tsx
src/components/VideoPlayer.tsx
src/components/SubtitleList.tsx
src/components/WordLookup.tsx
src/components/CategoryTabs.tsx
src/components/RecentlyLearned.tsx
src/components/LearningCalendar.tsx
src/components/ProfessionalAssessment.tsx
src/components/AuthCodeDialog.tsx
src/components/ActivationDialog.tsx
src/components/RedeemCode.tsx
```

### Hooks（需要修改）
```
src/hooks/useLearningProgress.ts
src/hooks/useUserStatistics.ts
```

### 工具文件（需要修改）
```
src/lib/wordCache.ts
```

---

## 迁移步骤

### 第一阶段：后端搭建
1. 创建 Express 项目结构
2. 配置 MySQL 数据库连接池
3. 执行 SQL 脚本创建所有数据表
4. 实现认证模块 (register/login/logout)
5. 实现 JWT 中间件

### 第二阶段：API 实现
1. 实现用户管理 API
2. 实现视频管理 API（含文件上传）
3. 实现分类管理 API
4. 实现学习进度 API
5. 实现单词本 API
6. 实现授权码 API

### 第三阶段：外部服务集成
1. 迁移翻译服务（百度/OpenAI）
2. 迁移语音评测服务（Azure/腾讯）
3. 实现词库导入功能

### 第四阶段：前端改造
1. 创建新的 API 客户端
2. 替换 AuthContext
3. 逐页修改数据查询调用
4. 修改文件上传逻辑
5. 测试所有功能

### 第五阶段：数据迁移
1. 导出现有 PostgreSQL 数据
2. 转换并导入到 MySQL
3. 验证数据完整性

---

## Docker 部署简化

迁移后的 docker-compose.yml：

```yaml
version: "3.8"

services:
  # MySQL 数据库
  db:
    image: mysql:8.0
    container_name: ai-english-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ai_english
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - ./volumes/mysql:/var/lib/mysql
      - ./backend/sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"

  # Express 后端
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ai-english-backend
    restart: unless-stopped
    environment:
      DB_HOST: db
      DB_USER: ${MYSQL_USER}
      DB_PASSWORD: ${MYSQL_PASSWORD}
      DB_NAME: ai_english
      JWT_SECRET: ${JWT_SECRET}
    volumes:
      - ./uploads:/app/uploads
    ports:
      - "3001:3001"
    depends_on:
      - db

  # 前端
  frontend:
    build:
      context: .
      dockerfile: docker/frontend/Dockerfile
    container_name: ai-english-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

**从 8 个容器 → 3 个容器**，大幅降低运维复杂度。

---

## 预计工作量

| 阶段 | 工作内容 | 文件数量 |
|------|---------|---------|
| 后端搭建 | 项目结构 + 数据库 + 认证 | ~15 个 |
| API 实现 | 所有业务 API | ~25 个 |
| 外部服务 | 翻译 + 评测 | ~5 个 |
| 前端改造 | API 客户端 + 页面修改 | ~30 个 |
| 数据迁移 | 脚本 + 验证 | ~3 个 |

**总计：约 78 个文件需要创建或修改**

---

## 迁移后优势

1. **部署简单**：只需 MySQL + Node.js，无需复杂的微服务架构
2. **调试方便**：传统 REST API，日志清晰，排错容易
3. **维护容易**：代码集中在一个后端项目，不需要管理多个服务
4. **成本降低**：服务器资源需求大幅减少
5. **移动端友好**：后端 API 可直接复用，前端可改为 React Native

---

## 迁移完成状态（2026-01-08 更新）

### ✅ 已完成任务

#### 阶段 1：修复关键Bug
- [x] 在 `api-client.ts` 中添加 `authCodesApi.getMyAuthCodes()` 方法
- [x] 统一封面截取时间为 0.5s

#### 阶段 2：前端组件迁移
- [x] CategoryTabs.tsx → categoriesApi
- [x] RecentlyLearned.tsx → learningApi
- [x] AuthCodeDialog.tsx → authCodesApi
- [x] RedeemCode.tsx → authCodesApi
- [x] ProfessionalAssessment.tsx → assessmentApi
- [x] Statistics.tsx → wordsApi + learningApi
- [x] wordCache.ts → wordsApi + translateApi

#### 阶段 3：管理后台迁移
- [x] Videos.tsx → videosApi
- [x] Categories.tsx → categoriesApi
- [x] Dictionary.tsx → wordsApi
- [x] TranslationProviders.tsx → translateApi
- [x] ProfessionalProviders.tsx → assessmentApi

#### 阶段 4：后端功能补充
- [x] `/auth-codes/my` GET - 获取用户授权码
- [x] `/assessment/evaluate` POST - 专业评测（模拟实现）
- [x] `/translate` POST - 翻译API（百度+OpenAI）
- [x] `/words/cache/:word` GET - 获取缓存单词
- [x] `/words/cache` POST - 缓存单词
- [x] `/words/stats` GET - 词库统计
- [x] `/words/import-dictionary` POST - 词库导入
- [x] `/translate/providers/:id` PUT - 更新翻译供应商
- [x] `/translate/providers/:id/default` PUT - 设置默认翻译供应商
- [x] `/assessment/providers/:id/default` PUT - 设置默认评测供应商

#### 阶段 5：清理 Supabase 遗留代码
- [x] 删除 `src/lib/supabase.ts`
- [x] 删除 `src/integrations/supabase/` 目录
- [x] 从 `package.json` 移除 `@supabase/supabase-js`
- [x] 将 Subtitle 类型、getStorageUrl、parseSRT、parseBilingualSRT 移至 api-client.ts

#### 阶段 6：功能测试
- [x] 前端构建成功（`npm run build`）
- [x] 后端构建成功（`npm run build`）

### ⚠️ 待处理项

#### 可删除的遗留目录
```
supabase/                              # 旧的 Supabase 配置和 Edge Functions
├── functions/                         # 7个 Edge Function（已迁移到后端）
│   ├── admin-action/
│   ├── import-dictionary/
│   ├── init-admin/
│   ├── main/
│   ├── professional-assessment/
│   ├── redeem-code/
│   └── translate/
├── migrations/                        # PostgreSQL 迁移脚本（已不需要）
├── config.toml                        # Supabase 配置
└── seed-dictionaries.sql              # 种子数据
```

#### 需要真实实现的功能
以下功能目前使用模拟/占位实现，如需生产使用需要完善：

1. **专业语音评测** (`backend/src/routes/assessment.ts`)
   - 当前返回模拟评分结果
   - 需实现腾讯SOE签名算法和API调用
   - 需实现微软Azure语音评测集成
   - 需实现按秒计费扣费逻辑

2. **词库导入** (`backend/src/routes/words.ts`)
   - 当前 `/words/import-dictionary` 返回占位响应
   - 需实现批量词库解析和导入逻辑

### 📊 迁移统计

| 类别 | 数量 |
|------|------|
| 迁移的前端组件 | 12 个 |
| 迁移的管理页面 | 5 个 |
| 新增后端路由 | 10 个 |
| 删除的 Supabase 文件 | 3 个目录 |
| 修改的文件总数 | ~30 个 |

### 🏗️ 当前架构

```
前端 (React + Vite)
    ↓ axios
后端 (Express + TypeScript)
    ↓ mysql2
数据库 (MySQL 8.0 / SQLite)

容器数量：3 个（db + backend + frontend）
```

### 📝 API Client 完整方法列表

```typescript
// 认证 API
authApi.login(phone, password)
authApi.register(phone, password, code?)
authApi.logout()
authApi.getMe()

// 视频 API
videosApi.getVideos(filters)
videosApi.getVideo(id)
videosApi.createVideo(data)
videosApi.updateVideo(id, data)
videosApi.deleteVideo(id)
videosApi.uploadVideo(file, onProgress)
videosApi.uploadThumbnail(file)

// 分类 API
categoriesApi.getCategories()
categoriesApi.createCategory(data)
categoriesApi.updateCategory(id, data)
categoriesApi.deleteCategory(id)

// 学习进度 API
learningApi.getProgress(videoId)
learningApi.updateProgress(videoId, data)
learningApi.getStatistics()
learningApi.updateStatistics(data)
learningApi.getDailyStatistics(days)
learningApi.getRecentVideos(limit)

// 单词 API
wordsApi.getWords()
wordsApi.addWord(data)
wordsApi.deleteWord(id)
wordsApi.getCachedWord(word)
wordsApi.cacheWord(data)
wordsApi.getStats()
wordsApi.importDictionary(dictionary, action)

// 授权码 API
authCodesApi.getAuthCodes()
authCodesApi.generateCodes(type, count, expiresAt)
authCodesApi.redeemCode(code)
authCodesApi.getMyAuthCodes()

// 翻译 API
translateApi.translate(text, from, to)
translateApi.getProviders()
translateApi.createProvider(data)
translateApi.updateProvider(id, data)
translateApi.deleteProvider(id)
translateApi.setDefaultProvider(id)

// 评测 API
assessmentApi.evaluate(text, audioBase64, videoId)
assessmentApi.getProviders()
assessmentApi.createProvider(data)
assessmentApi.updateProvider(id, data)
assessmentApi.deleteProvider(id)
assessmentApi.setDefaultProvider(id)

// 用户管理 API
usersApi.getUsers()
usersApi.getUser(id)
usersApi.updateUser(id, data)
usersApi.deleteUser(id)

// 管理员 API
adminApi.getDashboard()
adminApi.initAdmin(email, password)
adminApi.resetPassword(userId, newPassword)
```
