# AI English Studio - Rocky Linux 9 部署手册

> 本手册详细介绍如何在 Rocky Linux 9.x 系统上一键部署 AI English Studio 英语口语学习平台。
> 同样适用于 AlmaLinux 9、RHEL 9、CentOS Stream 9。

---

## 目录

1. [系统要求](#1-系统要求)
2. [一键部署（推荐）](#2-一键部署推荐)
3. [手动部署步骤](#3-手动部署步骤)
4. [数据库迁移](#4-数据库迁移)
5. [生产环境配置](#5-生产环境配置)
6. [常用运维命令](#6-常用运维命令)
7. [故障排除](#7-故障排除)
8. [备份与恢复](#8-备份与恢复)

---

## 1. 系统要求

### 硬件要求

| 配置项 | 最低配置 | 推荐配置 |
|--------|---------|---------|
| CPU | 2 核 | 4 核+ |
| 内存 | 4 GB | 8 GB+ |
| 硬盘 | 40 GB | 100 GB+ SSD |
| 带宽 | 5 Mbps | 10 Mbps+ |

### 软件要求

- Rocky Linux 9.x / AlmaLinux 9.x / RHEL 9.x
- Docker 24.0+
- Docker Compose 2.0+
- Git 2.x

### 端口要求

| 端口 | 服务 | 说明 |
|------|-----|------|
| 3000 | Frontend | 前端应用 |
| 8000 | Kong API | API 网关 |
| 5432 | PostgreSQL | 数据库（可选外部访问）|

---

## 2. 一键部署（推荐）

### 2.1 创建一键部署脚本

在服务器上创建 `install.sh` 文件：

```bash
cat > /root/install.sh << 'SCRIPT_EOF'
#!/bin/bash
# =====================================================
# AI English Studio - Rocky Linux 9 一键部署脚本
# 支持: Rocky Linux 9.x, AlmaLinux 9.x, RHEL 9.x
# =====================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 安装目录
INSTALL_DIR="/opt/ai-english-studio"

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "请使用 root 用户运行此脚本: sudo bash install.sh"
    fi
}

# 检测系统版本
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    else
        error "无法检测系统版本"
    fi
    info "检测到系统: $PRETTY_NAME"
}

# 安装基础依赖
install_dependencies() {
    info "安装基础依赖..."
    dnf install -y curl wget git tar
    success "基础依赖安装完成"
}

# 安装 Docker
install_docker() {
    if command -v docker &> /dev/null; then
        success "Docker 已安装: $(docker --version)"
        return
    fi

    info "正在安装 Docker..."

    # 移除旧版本
    dnf remove -y docker docker-client docker-client-latest docker-common \
        docker-latest docker-latest-logrotate docker-logrotate docker-engine podman runc 2>/dev/null || true

    # 安装依赖
    dnf install -y dnf-plugins-core

    # 添加 Docker 仓库
    dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo

    # 安装 Docker
    dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # 启动 Docker
    systemctl start docker
    systemctl enable docker

    # 验证
    docker --version
    docker compose version

    success "Docker 安装完成"
}

# 配置防火墙
configure_firewall() {
    info "配置防火墙..."

    if systemctl is-active --quiet firewalld; then
        firewall-cmd --permanent --add-port=3000/tcp
        firewall-cmd --permanent --add-port=8000/tcp
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --reload
        success "防火墙配置完成"
    else
        warn "firewalld 未运行，跳过防火墙配置"
    fi
}

# 配置 SELinux
configure_selinux() {
    info "配置 SELinux..."

    if command -v getenforce &> /dev/null; then
        current_mode=$(getenforce)
        if [ "$current_mode" = "Enforcing" ]; then
            warn "SELinux 当前为 Enforcing 模式，设置为 Permissive..."
            setenforce 0
            sed -i 's/^SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config
            success "SELinux 已设置为 Permissive"
        else
            info "SELinux 当前模式: $current_mode"
        fi
    fi
}

# 克隆项目
clone_project() {
    if [ -d "$INSTALL_DIR" ]; then
        warn "目录 $INSTALL_DIR 已存在"
        read -p "是否删除并重新克隆? [y/N]: " confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            rm -rf "$INSTALL_DIR"
        else
            info "更新现有代码..."
            cd "$INSTALL_DIR"
            git pull origin main || true
            return
        fi
    fi

    info "正在克隆项目..."
    git clone https://github.com/tkwa12358/ai-english-studio.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    chmod +x deploy.sh

    success "项目克隆完成"
}

# 配置环境变量
configure_env() {
    cd "$INSTALL_DIR"

    if [ -f ".env" ]; then
        warn ".env 文件已存在"
        read -p "是否重新生成? [y/N]: " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            return
        fi
    fi

    info "正在配置环境变量..."

    # 复制模板
    cp .env.example .env

    # 生成安全密钥
    JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '\n' | tr -d '/' | tr -d '+')

    # 获取服务器 IP
    SERVER_IP=$(hostname -I | awk '{print $1}')

    # 更新配置
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
    sed -i "s|^API_EXTERNAL_URL=.*|API_EXTERNAL_URL=http://$SERVER_IP:8000|" .env
    sed -i "s|^SITE_URL=.*|SITE_URL=http://$SERVER_IP:3000|" .env

    # 同步密码到数据库初始化脚本
    sed -i "s|your-super-secret-password|$POSTGRES_PASSWORD|g" docker/db/init/01_schema.sql 2>/dev/null || true

    success "环境变量配置完成"
    info "服务器 IP: $SERVER_IP"
}

# 创建数据目录
create_directories() {
    cd "$INSTALL_DIR"

    info "创建数据目录..."
    mkdir -p volumes/db/data
    mkdir -p volumes/storage
    chmod -R 755 volumes

    success "数据目录创建完成"
}

# 启动服务
start_services() {
    cd "$INSTALL_DIR"

    info "正在构建并启动服务（首次可能需要 5-10 分钟）..."
    info "请耐心等待..."

    docker compose up -d --build

    success "服务启动命令已执行"
}

# 等待服务就绪
wait_for_services() {
    info "等待服务就绪（最长等待 5 分钟）..."

    local max_attempts=60
    local attempt=1

    # 等待数据库
    while [ $attempt -le $max_attempts ]; do
        if docker compose exec -T db pg_isready -U postgres &> /dev/null; then
            success "数据库已就绪"
            break
        fi
        echo -n "."
        sleep 5
        attempt=$((attempt + 1))
    done

    # 等待前端
    attempt=1
    while [ $attempt -le 30 ]; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            success "前端服务已就绪"
            return 0
        fi
        echo -n "."
        sleep 5
        attempt=$((attempt + 1))
    done

    warn "部分服务可能仍在启动中，请稍后检查"
}

# 执行数据库迁移
run_migrations() {
    cd "$INSTALL_DIR"

    info "执行数据库迁移..."

    # 等待数据库完全就绪
    sleep 10

    # 执行所有迁移文件
    for migration in supabase/migrations/*.sql; do
        if [ -f "$migration" ]; then
            filename=$(basename "$migration")
            info "执行迁移: $filename"
            docker compose exec -T db psql -U postgres -d postgres < "$migration" 2>/dev/null || true
        fi
    done

    success "数据库迁移完成"
}

# 创建系统服务
create_systemd_service() {
    info "创建系统服务..."

    cat > /etc/systemd/system/ai-english-studio.service << EOF
[Unit]
Description=AI English Studio
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable ai-english-studio

    success "系统服务创建完成（开机自启动已启用）"
}

# 显示完成信息
show_completion_info() {
    local SERVER_IP=$(hostname -I | awk '{print $1}')

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           AI English Studio 部署完成！                      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "访问地址："
    echo -e "  前端应用: ${BLUE}http://$SERVER_IP:3000${NC}"
    echo -e "  API 接口: ${BLUE}http://$SERVER_IP:8000${NC}"
    echo ""
    echo -e "默认管理员账号："
    echo -e "  手机号: ${YELLOW}13717753455${NC}"
    echo -e "  密码:   ${YELLOW}13717753455${NC}"
    echo ""
    echo -e "常用命令："
    echo -e "  查看状态: ${BLUE}cd $INSTALL_DIR && docker compose ps${NC}"
    echo -e "  查看日志: ${BLUE}cd $INSTALL_DIR && docker compose logs -f${NC}"
    echo -e "  重启服务: ${BLUE}cd $INSTALL_DIR && docker compose restart${NC}"
    echo -e "  停止服务: ${BLUE}cd $INSTALL_DIR && docker compose down${NC}"
    echo ""
    echo -e "使用部署脚本："
    echo -e "  ${BLUE}cd $INSTALL_DIR && ./deploy.sh status${NC}"
    echo ""
    echo -e "配置文件: ${BLUE}$INSTALL_DIR/.env${NC}"
    echo ""
}

# 主函数
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║       AI English Studio - Rocky Linux 9 一键部署           ║${NC}"
    echo -e "${BLUE}║       AI 英语口语学习平台                                   ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    check_root
    detect_os
    install_dependencies
    install_docker
    configure_firewall
    configure_selinux
    clone_project
    configure_env
    create_directories
    start_services
    wait_for_services
    run_migrations
    create_systemd_service
    show_completion_info
}

main "$@"
SCRIPT_EOF

chmod +x /root/install.sh
```

### 2.2 执行一键部署

```bash
# 执行安装脚本
bash /root/install.sh
```

---

## 3. 手动部署步骤

如果一键脚本无法使用，可以按以下步骤手动部署：

### 3.1 更新系统

```bash
dnf update -y
```

### 3.2 安装 Docker

```bash
# 移除旧版本和 Podman
dnf remove -y docker docker-client docker-client-latest docker-common \
    docker-latest docker-latest-logrotate docker-logrotate docker-engine podman runc

# 安装依赖
dnf install -y dnf-plugins-core

# 添加 Docker 仓库（Rocky Linux 9 使用 RHEL 仓库）
dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo

# 安装 Docker
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker
systemctl start docker
systemctl enable docker

# 验证安装
docker --version
docker compose version
```

### 3.3 安装 Git

```bash
dnf install -y git
git --version
```

### 3.4 配置防火墙

```bash
# 开放端口
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=8000/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload

# 查看已开放端口
firewall-cmd --list-ports
```

### 3.5 配置 SELinux（可选）

```bash
# 查看当前状态
getenforce

# 临时设置为 Permissive
setenforce 0

# 永久设置为 Permissive
sed -i 's/^SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config
```

### 3.6 克隆项目

```bash
cd /opt
git clone https://github.com/tkwa12358/ai-english-studio.git
cd ai-english-studio
chmod +x deploy.sh
```

### 3.7 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 生成安全密钥
JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '\n' | tr -d '/' | tr -d '+')
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "JWT_SECRET: $JWT_SECRET"
echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "SERVER_IP: $SERVER_IP"

# 编辑配置文件
vi .env
```

修改以下配置：

```bash
JWT_SECRET=<上面生成的JWT密钥>
POSTGRES_PASSWORD=<上面生成的数据库密码>
API_EXTERNAL_URL=http://<服务器IP>:8000
SITE_URL=http://<服务器IP>:3000
```

### 3.8 创建数据目录

```bash
mkdir -p volumes/db/data
mkdir -p volumes/storage
chmod -R 755 volumes
```

### 3.9 构建并启动服务

```bash
# 构建并启动（首次需要 5-10 分钟）
docker compose up -d --build

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

---

## 4. 数据库迁移

### 4.1 首次部署执行迁移

```bash
cd /opt/ai-english-studio

# 等待数据库就绪
sleep 30

# 执行所有迁移文件
for f in supabase/migrations/*.sql; do
    echo "执行: $f"
    docker compose exec -T db psql -U postgres -d postgres < "$f" 2>/dev/null || true
done
```

### 4.2 更新代码后执行新迁移

```bash
cd /opt/ai-english-studio

# 拉取最新代码
git pull origin main

# 执行新的迁移文件
for f in supabase/migrations/*.sql; do
    if [ -f "$f" ]; then
        echo "执行: $f"
        docker compose exec -T db psql -U postgres -d postgres < "$f" 2>/dev/null || true
    fi
done

# 重新构建前端
docker compose up -d --build frontend
```

### 4.3 手动执行单个迁移

```bash
# 进入数据库
docker compose exec db psql -U postgres -d postgres

# 或直接执行 SQL 文件
docker compose exec -T db psql -U postgres -d postgres < supabase/migrations/20260105100000_user_statistics.sql
```

---

## 5. 生产环境配置

### 5.1 配置 Nginx 反向代理

```bash
# 安装 Nginx
dnf install -y nginx

# 创建配置文件
cat > /etc/nginx/conf.d/ai-english-studio.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /rest/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /auth/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /storage/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        client_max_body_size 100M;
    }

    location /functions/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
}
EOF

# 测试并启动
nginx -t
systemctl start nginx
systemctl enable nginx
```

### 5.2 配置 SSL 证书

```bash
# 安装 certbot
dnf install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your-domain.com

# 自动续期测试
certbot renew --dry-run
```

### 5.3 配置第三方 API

编辑 `.env` 文件：

```bash
# Azure 语音服务（专业语音评测）
AZURE_SPEECH_KEY=your-azure-speech-key
AZURE_SPEECH_REGION=eastasia

# DeepSeek API（翻译功能）
DEEPSEEK_API_KEY=your-deepseek-api-key
```

---

## 6. 常用运维命令

### 6.1 服务管理

```bash
cd /opt/ai-english-studio

# 查看服务状态
docker compose ps

# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 重启所有服务
docker compose restart

# 重启单个服务
docker compose restart frontend
docker compose restart db

# 查看日志
docker compose logs -f                    # 所有服务
docker compose logs -f frontend           # 前端日志
docker compose logs -f db                 # 数据库日志
docker compose logs -f --tail=100         # 最近100行
```

### 6.2 使用部署脚本

```bash
cd /opt/ai-english-studio

./deploy.sh status    # 查看状态
./deploy.sh start     # 启动服务
./deploy.sh stop      # 停止服务
./deploy.sh restart   # 重启服务
./deploy.sh logs      # 查看日志
./deploy.sh reset     # 重置数据库（危险！）
```

### 6.3 更新部署

```bash
cd /opt/ai-english-studio

# 拉取最新代码
git pull origin main

# 重新构建并启动
docker compose up -d --build

# 执行数据库迁移
for f in supabase/migrations/*.sql; do
    docker compose exec -T db psql -U postgres -d postgres < "$f" 2>/dev/null || true
done
```

### 6.4 数据库操作

```bash
# 进入数据库
docker compose exec db psql -U postgres -d postgres

# 常用 SQL 命令
\dt                          -- 查看所有表
\d+ table_name               -- 查看表结构
SELECT * FROM profiles;      -- 查询用户
SELECT * FROM videos;        -- 查询视频

# 退出
\q
```

---

## 7. 故障排除

### 7.1 服务无法启动

```bash
# 查看详细日志
docker compose logs --tail=200

# 检查端口占用
ss -tlnp | grep -E '3000|8000|5432'

# 检查 Docker 状态
systemctl status docker

# 重启 Docker
systemctl restart docker
```

### 7.2 数据库连接失败

```bash
# 检查数据库容器
docker compose ps db

# 查看数据库日志
docker compose logs db

# 手动测试连接
docker compose exec db pg_isready -U postgres

# 重启数据库
docker compose restart db
```

### 7.3 前端无法访问

```bash
# 检查前端容器
docker compose ps frontend

# 查看前端日志
docker compose logs frontend

# 重新构建前端
docker compose up -d --build frontend
```

### 7.4 SELinux 问题

```bash
# 检查 SELinux 状态
getenforce

# 查看拒绝日志
ausearch -m avc -ts recent

# 临时禁用
setenforce 0
```

### 7.5 磁盘空间不足

```bash
# 查看磁盘使用
df -h

# 清理 Docker 缓存
docker system prune -a

# 清理未使用的镜像
docker image prune -a
```

---

## 8. 备份与恢复

### 8.1 备份数据库

```bash
cd /opt/ai-english-studio
mkdir -p backups

# 备份
docker compose exec -T db pg_dump -U postgres -d postgres | gzip > backups/db_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 8.2 备份存储文件

```bash
tar -czvf backups/storage_$(date +%Y%m%d).tar.gz volumes/storage/
```

### 8.3 恢复数据库

```bash
# 解压并恢复
gunzip -c backups/db_20260105.sql.gz | docker compose exec -T db psql -U postgres -d postgres
```

### 8.4 自动备份脚本

```bash
cat > /opt/ai-english-studio/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/ai-english-studio/backups"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7

cd /opt/ai-english-studio
mkdir -p $BACKUP_DIR

# 备份数据库
docker compose exec -T db pg_dump -U postgres -d postgres | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 备份存储
tar -czvf $BACKUP_DIR/storage_$DATE.tar.gz volumes/storage/ 2>/dev/null

# 删除旧备份
find $BACKUP_DIR -name "*.gz" -mtime +$KEEP_DAYS -delete

echo "备份完成: $DATE"
EOF

chmod +x /opt/ai-english-studio/backup.sh

# 添加定时任务（每天凌晨 3 点）
echo "0 3 * * * /opt/ai-english-studio/backup.sh >> /var/log/ai-english-backup.log 2>&1" | crontab -
```

---

## 附录：快速参考

### 服务地址

| 服务 | 地址 |
|------|------|
| 前端应用 | http://服务器IP:3000 |
| API 网关 | http://服务器IP:8000 |

### 默认账号

| 类型 | 账号 | 密码 |
|------|------|------|
| 管理员 | 13717753455 | 13717753455 |

### 目录结构

```
/opt/ai-english-studio/
├── docker-compose.yml      # Docker 编排文件
├── .env                    # 环境变量配置
├── deploy.sh               # 部署脚本
├── volumes/
│   ├── db/data/           # 数据库数据
│   └── storage/           # 上传文件
├── supabase/
│   ├── functions/         # Edge Functions
│   └── migrations/        # 数据库迁移
└── backups/               # 备份文件
```

---

*文档版本: 1.1.0 | 适用系统: Rocky Linux 9.x | 更新时间: 2026-01-05*
