# AI English Studio 安装部署文档

## 1. 项目简介
AI English Studio 是一个基于 React + Vite + Express + SQLite 的英语学习平台，支持视频学习、单词本、发音评测等功能。

## 2. 环境要求
- Node.js (建议 v18+)
- npm 或 yarn
- Docker（可选，用于生产部署）

## 3. 快速安装

### 3.1 克隆项目
```bash
git clone git@github.com:tkwa12358/ai-english-studio.git
cd ai-english-studio
```

### 3.2 安装依赖
```bash
# 前端依赖
npm install

# 后端依赖
cd backend && npm install && cd ..
```

### 3.3 配置环境变量
复制 `.env.example` 文件为 `.env`：
```bash
cp .env.example .env
```

编辑 `.env` 文件，根据需要修改配置。

## 4. 运行项目

### 4.1 开发模式

启动后端：
```bash
cd backend
npm run dev
```

启动前端（新终端）：
```bash
npm run dev
```

### 4.2 Docker 部署（推荐）

一键启动所有服务：
```bash
docker-compose up -d --build
```

访问 http://localhost:3000

## 5. 数据库

项目使用 SQLite 数据库，数据文件存储在 `data/ai_english.db`。

### 5.1 数据库初始化

首次启动后端时会自动创建数据库结构。

### 5.2 导入单词词库

词库文件位于 `data/dictionary` 目录下。使用以下命令导入：

```bash
cd backend
npm run import:dict
```

或手动执行 SQL：
```bash
sqlite3 ../data/ai_english.db < sql/init.sql
```

## 6. 管理员账号

默认管理员账号：
- **邮箱**: `admin@163.com`
- **密码**: `admin@163.com`

初始化管理员（如不存在）：
```bash
curl -X POST http://localhost:3000/api/admin/init
```

## 7. 开发建议

- 评测功能依赖于外部 API（如腾讯 SOE），请在后端配置相应的 API Key
- 离线字典缓存通过 `indexedDB` 实现，初次加载词库记录后会自动缓存
- 开发时后端运行在 3001 端口，前端运行在 3000 端口
- 生产环境使用 Docker Compose 统一部署

## 8. 常见问题

### Q: 后端启动失败
A: 确保 `data` 目录存在且有写入权限。

### Q: 登录失败
A: 检查后端服务是否正常运行，确认 API 地址配置正确。

### Q: 视频上传失败
A: 检查 `uploads` 目录权限，确保有足够的磁盘空间。
