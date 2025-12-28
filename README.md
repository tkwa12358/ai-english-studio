# AI English Club - 英语口语学习平台

专为油管、tiktok、x等平台的英语口语设计的学习网站，支持视频学习、语音评测、单词本等功能。

## 目录

- [项目简介](#项目简介)
- [技术栈](#技术栈)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [本地开发](#本地开发)
- [数据库部署](#数据库部署)
- [生产部署](#生产部署)
- [管理员账号](#管理员账号)
- [项目结构](#项目结构)

## 项目简介

AI English Club 是一个基于 React + Supabase 的英语口语学习平台，主要功能包括：

- 🎬 **视频学习** - 支持双语字幕的视频播放
- 🎤 **语音评测** - 专业级语音评测，提供发音评分和反馈
- 📚 **单词本** - 收藏生词，支持复习功能
- 📊 **学习统计** - 记录学习进度和时长
- 🔐 **用户管理** - 完整的用户注册、登录系统
- 🛠️ **管理后台** - 视频管理、分类管理、授权码管理等

## 技术栈

### 前端
- **React 18** - 前端框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库
- **React Router** - 路由管理
- **TanStack Query** - 数据请求

### 后端
- **Supabase** - 后端即服务 (BaaS)
  - PostgreSQL 数据库
  - 用户认证
  - 文件存储
  - Edge Functions (Serverless)

## 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 或 **bun** >= 1.0.0
- **Supabase CLI** (可选，用于本地开发)
- **Docker** (可选，用于本地 Supabase)

## 快速开始

### 1. 克隆项目

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. 安装依赖

```bash
npm install
# 或
bun install
```

### 3. 配置环境变量

创建 `.env` 文件（如果使用云端 Supabase，这些变量已自动配置）：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### 4. 启动开发服务器

```bash
npm run dev
# 或
bun dev
```

访问 http://localhost:5173 查看应用。

## 本地开发

### 使用云端 Supabase（推荐）

如果项目已连接到 Lovable Cloud，环境变量会自动配置，直接启动即可。

### 使用本地 Supabase

如需在本地运行完整的 Supabase 环境：

#### 1. 安装 Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (使用 scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/scripts/install.sh | sh
```

#### 2. 启动本地 Supabase

```bash
# 初始化（首次运行）
supabase init

# 启动 Docker 容器
supabase start
```

启动后会显示本地连接信息：

```
API URL: http://localhost:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
```

#### 3. 配置本地环境变量

创建 `.env.local` 文件：

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=your-local-anon-key
```

#### 4. 应用数据库迁移

```bash
supabase db push
```

## 数据库部署

### 数据库架构

项目包含以下数据表：

| 表名 | 说明 |
|------|------|
| `profiles` | 用户资料 |
| `user_roles` | 用户角色（admin/user） |
| `videos` | 视频内容 |
| `video_categories` | 视频分类 |
| `word_book` | 用户单词本 |
| `word_cache` | 单词缓存 |
| `voice_assessments` | 语音评测记录 |
| `professional_assessments` | 专业评测记录 |
| `learning_progress` | 学习进度 |
| `auth_codes` | 授权码 |
| `voice_usage_logs` | 语音使用日志 |

### 迁移文件

所有数据库迁移文件位于 `supabase/migrations/` 目录下，包含：

- 表结构定义
- 行级安全策略 (RLS)
- 数据库函数和触发器
- 存储桶配置

### 手动执行迁移

如果需要手动执行迁移（例如在新的 Supabase 项目中）：

```bash
# 使用 Supabase CLI
supabase db push

# 或直接在 SQL 编辑器中执行 migrations 目录下的 SQL 文件
```

### 存储桶

项目使用两个存储桶：

- `videos` - 公开访问，存储视频文件
- `audio` - 私有访问，存储用户录音

## 生产部署

### 方式一：Lovable 一键部署（推荐）

1. 打开 [Lovable](https://lovable.dev) 项目
2. 点击右上角 **Publish** 按钮
3. 首次部署后，点击 **Update** 更新

### 方式二：自托管部署

#### 使用 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 配置环境变量
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
```

#### 使用 Nginx

1. 构建生产版本：

```bash
npm run build
```

2. Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/ai-english-club/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. 部署文件：

```bash
# 上传 dist 目录到服务器
scp -r dist/* user@server:/var/www/ai-english-club/dist/
```

#### 使用 Docker

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

构建并运行：

```bash
docker build -t ai-english-club .
docker run -p 80:80 ai-english-club
```

## 管理员账号

### 默认管理员

系统预设管理员账号：

- **手机号**: `13717753455`
- **密码**: `13717753455`

### 初始化管理员

如果管理员账号不存在，可通过 Edge Function 初始化：

```bash
# 调用初始化接口
curl -X POST https://your-project.supabase.co/functions/v1/init-admin
```

或在前端调用：

```typescript
import { supabase } from '@/integrations/supabase/client';

await supabase.functions.invoke('init-admin');
```

### 手动添加管理员

也可以通过 SQL 手动添加管理员角色：

```sql
-- 1. 先注册用户获取 user_id
-- 2. 添加管理员角色
INSERT INTO user_roles (user_id, role)
VALUES ('用户UUID', 'admin');
```

## 项目结构

```
├── public/                 # 静态资源
│   └── dictionaries/       # 词典文件
├── src/
│   ├── components/         # React 组件
│   │   ├── admin/          # 管理后台组件
│   │   └── ui/             # shadcn/ui 组件
│   ├── contexts/           # React Context
│   ├── hooks/              # 自定义 Hooks
│   ├── integrations/       # 第三方集成
│   │   └── supabase/       # Supabase 客户端
│   ├── lib/                # 工具函数
│   ├── pages/              # 页面组件
│   │   └── admin/          # 管理后台页面
│   ├── App.tsx             # 应用入口
│   ├── index.css           # 全局样式
│   └── main.tsx            # 渲染入口
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── init-admin/     # 管理员初始化
│   │   ├── translate/      # 翻译服务
│   │   ├── professional-assessment/  # 语音评测
│   │   └── ...
│   ├── migrations/         # 数据库迁移
│   └── config.toml         # Supabase 配置
├── .env                    # 环境变量（自动生成）
├── package.json            # 项目依赖
├── tailwind.config.ts      # Tailwind 配置
├── tsconfig.json           # TypeScript 配置
└── vite.config.ts          # Vite 配置
```

## Edge Functions

项目包含以下 Edge Functions：

| 函数名 | 说明 | 需要认证 |
|--------|------|----------|
| `init-admin` | 初始化管理员账号 | 否 |
| `translate` | 翻译服务 | 否 |
| `professional-assessment` | 专业语音评测 | 是 |
| `import-dictionary` | 导入词库 | 是 |
| `redeem-code` | 兑换授权码 | 是 |

## 常见问题

### 1. 登录后显示空白页面

检查是否正确配置了 Supabase 环境变量。

### 2. 无法访问管理后台

确保用户已在 `user_roles` 表中分配了 `admin` 角色。

### 3. Edge Function 调用失败

检查函数是否已部署，可通过 Supabase 控制台查看日志。

### 4. 本地开发连接远程数据库

修改 `.env.local` 中的 `VITE_SUPABASE_URL` 为远程地址。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
