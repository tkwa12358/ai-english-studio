# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 创建上传目录
RUN mkdir -p uploads/videos uploads/thumbnails

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "start"]
