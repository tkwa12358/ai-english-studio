# AI English Studio 部署指南

## 📋 系统要求

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **内存**: 最低 4GB，推荐 8GB+
- **存储**: 最低 20GB 可用空间

## 🚀 快速部署（一键安装）

### 1. 克隆项目

```bash
git clone https://github.com/tkwa12358/ai-english-studio.git
cd ai-english-studio
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的参数（生产环境务必修改密码和密钥）。

### 3. 一键部署

```bash
chmod +x deploy.sh
./deploy.sh install
```

部署完成后，访问：
- **前端应用**: http://localhost:3000
- **API 接口**: http://localhost:8000

### 4. 默认管理员账户

```
手机号: 13717753455
密码: 13717753455
```

## 📁 项目结构

```
ai-english-studio/
├── docker-compose.yml      # Docker Compose 配置
├── deploy.sh               # 一键部署脚本
├── .env.example            # 环境变量模板
├── docker/
│   ├── db/
│   │   └── init/           # 数据库初始化脚本
│   │       ├── 01_schema.sql    # 表结构
│   │       └── 02_dictionary.sql # 单词库（自动导入）
│   ├── kong/
│   │   └── kong.yml        # API 网关配置
│   └── frontend/
│       ├── Dockerfile      # 前端构建
│       └── nginx.conf      # Nginx 配置
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # 数据库迁移
├── src/                    # 前端源码
└── data/
    └── dictionary/         # 单词库数据
        ├── json/           # JSON 格式单词库
        └── sql/            # SQL 导入脚本
```

## 🔧 常用命令

```bash
# 启动服务
./deploy.sh start

# 停止服务
./deploy.sh stop

# 重启服务
./deploy.sh restart

# 查看日志
./deploy.sh logs

# 查看状态
./deploy.sh status

# 重置数据库（警告：删除所有数据）
./deploy.sh reset
```

## ⚙️ 配置说明

### 核心配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `POSTGRES_PASSWORD` | 数据库密码 | 需修改 |
| `JWT_SECRET` | JWT 密钥 | 需修改 |
| `FRONTEND_PORT` | 前端端口 | 3000 |
| `KONG_HTTP_PORT` | API 端口 | 8000 |

### 第三方 API 配置

#### Azure 语音评测（推荐）

```env
AZURE_SPEECH_KEY=your-azure-speech-key
AZURE_SPEECH_REGION=eastasia
```

#### 腾讯 SOE 评测

```env
TENCENT_SOE_SECRET_ID=your-secret-id
TENCENT_SOE_SECRET_KEY=your-secret-key
```

#### DeepSeek 翻译 API

```env
DEEPSEEK_API_KEY=your-api-key
```

## 🌐 生产环境部署

### 1. 修改安全配置

```bash
# 生成安全密钥
./deploy.sh install
# 选择 "y" 自动生成安全密钥
```

### 2. 配置域名和 HTTPS

编辑 `docker/frontend/nginx.conf`，配置 SSL 证书。

### 3. 配置反向代理

推荐使用 Nginx 或 Traefik 作为前端反向代理。

示例 Nginx 配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 数据库说明

### 单词库

安装时自动导入完整单词库，包含：
- CET4/CET6 词汇
- 高中/初中词汇
- BEC 商务英语词汇
- 考研词汇
- 托福/雅思词汇

共计 **15万+** 词条，包含：
- 音标
- 中文释义
- 词性分类
- 例句

### 备份数据

```bash
# 备份数据库
docker compose exec db pg_dump -U postgres postgres > backup.sql

# 恢复数据库
docker compose exec -T db psql -U postgres postgres < backup.sql
```

## 🔍 故障排查

### 服务无法启动

```bash
# 查看详细日志
docker compose logs -f

# 检查端口占用
lsof -i :3000
lsof -i :8000
lsof -i :5432
```

### 数据库连接失败

```bash
# 检查数据库状态
docker compose exec db pg_isready -U postgres

# 查看数据库日志
docker compose logs db
```

### 前端构建失败

```bash
# 清理缓存重建
docker compose build --no-cache frontend
```

## 📞 技术支持

- **GitHub Issues**: https://github.com/tkwa12358/ai-english-studio/issues
- **文档**: 项目根目录 README.md

## 📄 许可证

MIT License
