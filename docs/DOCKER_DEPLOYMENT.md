# AI English Studio - Docker 部署指南

本文档描述如何使用 Docker 部署 AI English Studio 应用。

---

## 系统要求

- Docker 20.10+
- Docker Compose 2.0+ (可选)
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

---

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd ai-english-studio
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，设置必要的配置
```

重要的环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `JWT_SECRET` | JWT 签名密钥 | `your-secret-key-here` |
| `JWT_EXPIRES_IN` | Token 过期时间 | `7d` |
| `PORT` | 服务端口 | `3000` |

### 3. 构建并启动

```bash
# 使用 Docker 直接构建运行
docker build -t ai-english-studio-app .
docker run -d \
  --name ai-english-studio \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  --env-file .env \
  ai-english-studio-app

# 或使用 Docker Compose
docker-compose up -d
```

### 4. 验证部署

```bash
# 检查容器状态
docker ps | grep ai-english-studio

# 检查健康状态
curl http://localhost:3000/health
# 应返回: {"status":"ok","timestamp":"..."}

# 查看日志
docker logs ai-english-studio
```

---

## 详细配置

### Dockerfile 结构

项目使用单容器架构，Dockerfile 位于项目根目录：

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder
# ... 前端和后端构建

# 运行阶段
FROM node:20-alpine
# ... 只包含运行时依赖
```

### 数据持久化

以下目录需要挂载到宿主机以实现数据持久化：

| 容器路径 | 说明 |
|----------|------|
| `/app/data` | SQLite 数据库文件 |
| `/app/uploads` | 用户上传的视频/文件 |

```bash
# 创建数据目录
mkdir -p data uploads

# 运行时挂载
docker run -d \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  ...
```

### 端口映射

| 端口 | 说明 |
|------|------|
| 3000 | HTTP 服务 (前端 + API) |

---

## Docker Compose 部署

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ai-english-studio
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 进入容器
docker-compose exec app sh
```

---

## 生产环境部署

### 1. 使用反向代理 (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. SSL/HTTPS 配置

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
# 安装 certbot
apt install certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your-domain.com
```

### 3. 安全建议

- 修改默认管理员密码
- 设置强 JWT_SECRET
- 限制数据库文件权限
- 启用防火墙
- 定期备份数据

---

## 数据备份与恢复

### 备份

```bash
# 备份数据库
docker cp ai-english-studio:/app/data/ai_english.db ./backup/

# 备份上传文件
docker cp ai-english-studio:/app/uploads ./backup/

# 或使用脚本
tar -czf backup-$(date +%Y%m%d).tar.gz data/ uploads/
```

### 恢复

```bash
# 停止容器
docker stop ai-english-studio

# 恢复数据
cp backup/ai_english.db data/
cp -r backup/uploads/* uploads/

# 重启容器
docker start ai-english-studio
```

---

## 故障排除

### 1. 容器无法启动

```bash
# 查看详细日志
docker logs ai-english-studio

# 检查磁盘空间
df -h

# 检查端口占用
lsof -i :3000
```

### 2. 健康检查失败

```bash
# 进入容器检查
docker exec -it ai-english-studio sh

# 检查服务状态
wget -O- http://localhost:3000/health

# 检查数据库
ls -la /app/data/
```

### 3. 数据库锁定

```bash
# 重启容器
docker restart ai-english-studio

# 如果问题持续，检查是否有多个进程访问数据库
```

### 4. 上传文件权限问题

```bash
# 修复权限
docker exec ai-english-studio chmod -R 755 /app/uploads
```

---

## 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建镜像
docker-compose build --no-cache

# 重新部署 (保留数据)
docker-compose up -d

# 或使用 Docker 命令
docker stop ai-english-studio
docker rm ai-english-studio
docker build -t ai-english-studio-app .
docker run -d \
  --name ai-english-studio \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  --env-file .env \
  ai-english-studio-app
```

---

## 开发环境

### 本地开发 (不使用 Docker)

```bash
# 安装依赖
npm install
cd backend && npm install && cd ..

# 启动后端
cd backend && npm run dev

# 启动前端 (新终端)
npm run dev
```

### 本地 Docker 测试

```bash
# 构建并运行
docker build -t ai-english-studio-test .
docker run --rm -p 3000:3000 ai-english-studio-test

# 运行测试
npm test
```

---

## 资源限制

### 设置内存和 CPU 限制

```bash
docker run -d \
  --name ai-english-studio \
  --memory="1g" \
  --cpus="1.0" \
  -p 3000:3000 \
  ...
```

### Docker Compose 资源限制

```yaml
services:
  app:
    ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## 监控

### 查看资源使用

```bash
docker stats ai-english-studio
```

### 日志管理

```bash
# 配置日志轮转
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  ...
```

---

## 联系支持

如有问题，请提交 Issue 或联系开发团队。
