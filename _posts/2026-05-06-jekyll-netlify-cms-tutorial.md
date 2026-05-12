---
layout: post
title: "使用 Jekyll 和 Netlify CMS 搭建静态博客"
date: 2026-05-06
description: "详细教程：如何用 Jekyll + Netlify CMS 搭建带 Web 管理界面的静态博客，并部署到 GitHub Pages"
tags: [jekyll, netlify-cms, tutorial]
categories: [教程]
---

# 使用 Jekyll 和 Netlify CMS 搭建静态博客

本文介绍如何快速搭建一个带 Web 管理界面的静态博客。

## 准备工作

1. GitHub 账号
2. Netlify 账号（免费）
3. 本地安装 Ruby 和 Jekyll

## 部署步骤

### 1. 创建 GitHub 仓库

在 GitHub 上创建一个新仓库，将代码推送到 main 分支。

### 2. 在 Netlify 部署

1. 登录 [Netlify](https://netlify.com)
2. 点击 "Add new site" → "Import an existing project"
3. 选择 GitHub 仓库
4. 构建设置：
   - **Build command:** `jekyll build`
   - **Publish directory:** `_site`
5. 点击 "Deploy site"

### 3. 启用 Netlify Identity

1. 在 Netlify Dashboard 开启 Identity 服务
2. 添加用户（你自己）
3. 在 Identity 设置中启用 Git Gateway

### 4. 配置域名（可选）

可以在 Netlify 中设置自定义域名。

## 使用方法

1. 访问 `your-site.netlify.app/login.html` 登录
2. 点击"管理"进入 CMS 后台
3. 使用 Markdown 编辑器写文章
4. 点击"发布"自动部署

## 常见问题

**Q: 为什么需要 Netlify Identity？**
A: Netlify Identity 提供用户认证，Git Gateway 需要它来允许 CMS 提交代码。

**Q: 可以用 GitHub Pages 吗？**
A: 可以，但 GitHub Pages 不支持 Netlify Identity，需要改用其他认证方案（如 Netlify 的外部 OAuth 提供商）。

---

有问题欢迎留言！