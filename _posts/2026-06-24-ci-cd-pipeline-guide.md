---
layout: post
title: "CI/CD 流水线实践指南"
date: 2026-06-24
categories: [engineering, devops]
tags: [ci-cd, pipeline, automation, devops]
---

## 什么是 CI/CD

CI/CD 是持续集成（Continuous Integration）和持续部署（Continuous Deployment）的缩写，是现代软件交付的核心实践。

- **CI（持续集成）**：代码提交后自动运行构建和测试，尽早发现问题
- **CD（持续交付/部署）**：通过自动化流水线将代码安全地发布到生产环境

## GitHub Actions 实战

GitHub Actions 是最易上手的 CI/CD 工具之一，直接在仓库中配置即可使用。

### 基础 CI 配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

### 自动部署到生产环境

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: npm run build

      - name: Deploy
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          rsync -avz --delete ./dist/ deploy@server:/var/www/app/
```

## 流水线设计原则

### 1. 快速反馈

| 阶段 | 目标耗时 | 包含内容 |
|------|---------|---------|
| Lint | < 30s | 代码风格检查 |
| Unit Test | < 3min | 单元测试 |
| Integration Test | < 10min | 集成测试 |
| Build | < 3min | 构建产物 |
| Deploy | < 5min | 部署到环境 |

### 2. 失败即停止

流水线任一阶段失败，应立即停止并通知开发者，不要继续执行后续步骤。

### 3. 缓存加速

```yaml
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

### 4. 环境隔离

- 每个 PR 在独立环境中构建和测试
- 使用 Feature Branch + Preview Deployment 预览变更
- 生产部署需要人工审批（manual approval）

## 常见 CI/CD 平台对比

| 平台 | 优势 | 适合场景 |
|------|------|---------|
| GitHub Actions | 与 GitHub 深度集成 | 开源项目、GitHub 托管 |
| GitLab CI | 内置丰富模板 | 企业私有化 |
| Jenkins | 插件生态强大 | 复杂定制需求 |
| CircleCI | 速度优化好 | 对构建速度敏感 |

## 安全注意事项

- **不要在代码中硬编码密钥** — 使用平台的 Secrets 管理
- **限制权限** — CI 使用的 Token 只授予最小必要权限
- **扫描依赖漏洞** — 在流水线中加入 `npm audit` 或 Snyk 扫描
- **保护主分支** — 要求 PR 必须通过 CI 才能合并

## 总结

CI/CD 不是银弹，但它能让你每次提交代码都有信心：自动测试过了、构建成功了、部署没问题。从最简单的 lint + test 流水线开始，逐步加入部署和安全扫描，就能享受自动化带来的效率提升。