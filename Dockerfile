# AI English Studio - 单容器部署
# 包含: Node.js + SQLite + 前端静态文件 + 词库数据

# 构建前端
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# 构建后端
FROM node:20-alpine AS backend-builder

WORKDIR /backend

# 安装编译依赖 (better-sqlite3 需要)
RUN apk add --no-cache python3 make g++

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .
RUN npm run build

# 最终镜像
FROM node:20-alpine

WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache python3 make g++

# 复制后端
COPY --from=backend-builder /backend/dist ./dist
COPY --from=backend-builder /backend/node_modules ./node_modules
COPY --from=backend-builder /backend/package.json ./

# 复制前端到 public 目录
COPY --from=frontend-builder /frontend/dist ./public

# 创建数据和上传目录
RUN mkdir -p /app/data /app/uploads /app/data/dictionary/merged

# 复制词库文件（生产部署时自动包含）
COPY data/dictionary/merged/*.json /app/data/dictionary/merged/

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data
ENV UPLOAD_DIR=/app/uploads
ENV FRONTEND_DIR=/app/public

# 持久化卷
VOLUME ["/app/data", "/app/uploads"]

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动
CMD ["node", "dist/app.js"]
