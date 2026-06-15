---
layout: post
title: "Git 分支与 Pull Request 工作流"
date: 2026-06-15
description: "介绍如何用分支 + Pull Request 的方式协作开发，让每一次改动都有清晰的评审记录"
tags: [git, github, workflow]
categories: [教程]
---

# Git 分支与 Pull Request 工作流

直接往 `main` 提交虽然方便，但缺少评审记录。使用分支 + Pull Request 能让每次改动都可追溯、可讨论。

## 1. 从 main 创建分支

```bash
git checkout -b feature/my-change
```

分支名建议带上类型前缀，如 `feature/`、`fix/`、`post/`，一眼就能看出用途。

## 2. 提交改动

```bash
git add .
git commit -m "feat: 描述这次改动"
```

## 3. 推送分支

```bash
git push origin feature/my-change
```

## 4. 创建 Pull Request

在 GitHub 仓库页面点击 **Compare & pull request**，或通过 API / CLI 创建。PR 会出现在 **Pull requests** 标签页，方便他人评审。

## 5. 合并

评审通过后点击 **Merge pull request**，改动即进入 `main`，整个过程都有完整记录。

## 小结

| 方式 | 适用场景 |
| :--- | :--- |
| 直接 push main | 个人项目、快速记录 |
| 分支 + PR | 协作开发、需要评审 |

养成用 PR 的习惯，团队协作会顺畅很多。
