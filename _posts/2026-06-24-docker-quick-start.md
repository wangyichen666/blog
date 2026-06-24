---
layout: post
title: "Docker 容器化入门指南"
date: 2026-06-24
categories: [engineering, devops]
tags: [docker, container, devops]
---

## 为什么需要 Docker

"在我机器上能跑" — 这是开发者最常听到也最头疼的话。Docker 通过容器化技术，让应用在任何环境都能一致运行。

## 核心概念

| 概念 | 说明 | 类比 |
|------|------|------|
| Image（镜像） | 只读的应用模板 | 类似安装包 |
| Container（容器） | 镜像的运行实例 | 类似运行中的程序 |
| Dockerfile | 构建镜像的脚本 | 类似安装说明书 |
| Volume | 持久化数据存储 | 类似外接硬盘 |
| Network | 容器间通信网络 | 类似局域网 |

## 快速上手

### 编写 Dockerfile

```dockerfile
# 基础镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 先复制依赖文件，利用缓存加速构建
COPY package*.json ./
RUN npm ci --only=production

# 再复制源码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"]
```

### 构建与运行

```bash
# 构建镜像
docker build -t my-app:1.0 .

# 运行容器
docker run -d -p 3000:3000 --name my-app my-app:1.0

# 查看运行中的容器
docker ps

# 查看日志
docker logs my-app

# 停止并删除
docker stop my-app && docker rm my-app
```

### 使用 Docker Compose 编排多服务

```yaml
version: "3.9"
services:
  web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
    environment:
      - DB_HOST=db

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=secret

volumes:
  pgdata:
```

```bash
# 一键启动
docker compose up -d

# 一键停止
docker compose down
```

## 最佳实践

1. **使用多阶段构建** — 减小最终镜像体积
2. **善用 .dockerignore** — 排除不需要的文件（node_modules、.git 等）
3. **不要用 latest 标签** — 明确指定版本号，避免不可预测的行为
4. **一个容器一个进程** — 保持职责单一，方便扩展和排查
5. **非 root 用户运行** — 安全第一

```dockerfile
# 多阶段构建示例
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "dist/main.js"]
```

## 总结

Docker 让"环境一致性"不再是问题。从 Dockerfile 写起，用 Compose 编排多服务，再配合 CI/CD 自动化构建部署，这就是现代应用交付的标准路径。