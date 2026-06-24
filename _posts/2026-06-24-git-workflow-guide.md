---
layout: post
title: "Git 工作流指南"
date: 2026-06-24
categories: [engineering, git]
tags: [git, workflow, collaboration]
---

## 常见的 Git 工作流

选择合适的 Git 工作流对团队协作至关重要。以下是三种最常用的工作流：

### 1. Git Flow

适合有明确发布周期的项目，使用 `main`、`develop`、`feature/*`、`release/*`、`hotfix/*` 多个分支。

```
main ──────●────────────────●──────────
            \              /
develop ────●──●──●──●──●──●──────────
            /        \
feature ──●──●──●────
```

**优点**: 结构清晰，适合版本发布管理
**缺点**: 分支较多，日常开发略显繁琐

### 2. GitHub Flow

最简洁的工作流，只有 `main` + feature 分支，通过 PR 合并。

```
main ──●──●──●──●──●──
          \     /
feature ───●──●────
```

**优点**: 简单高效，适合持续部署
**缺点**: 不适合需要维护多版本的项目

### 3. Trunk-Based Development

所有人在 `main`（trunk）上直接开发，配合 Feature Flag 控制未完成功能。

**优点**: 集成问题最少，反馈最快
**缺点**: 需要成熟的 CI/CD 和 Feature Flag 基础设施

## 常用 Git 操作技巧

### 优雅地修改最近一次提交

```bash
# 修改最近一次提交信息
git commit --amend -m "新的提交信息"

# 把遗忘的文件加入最近一次提交
git add forgotten-file.js
git commit --amend --no-edit
```

### 交互式 Rebase 整理提交历史

```bash
# 整理最近 3 次提交
git rebase -i HEAD~3
```

### Cherry-pick 选择性合并

```bash
# 将某次提交应用到当前分支
git cherry-pick abc1234
```

## 总结

没有"最好"的工作流，只有"最适合"的工作流。小团队可以选 GitHub Flow，大型项目用 Git Flow，追求极致部署速度的团队可以尝试 Trunk-Based Development。