---
layout: post
title: "API 设计原则与最佳实践"
date: 2026-06-24
categories: [engineering, api]
tags: [api, design, rest, best-practices]
---

## 好的 API 长什么样

一个好的 API 应该让人**看一眼就知道怎么用**，而不是需要翻遍文档。以下是 API 设计中最重要的几条原则。

## 核心设计原则

### 1. 一致性大于一切

命名风格、错误格式、分页方式 — 全局保持一致，不要让调用者猜。

```json
// ✅ 好的一致性
GET /api/v1/users          → 返回用户列表
GET /api/v1/users/123      → 返回单个用户
GET /api/v1/users/123/posts → 返回该用户的文章

// ❌ 不一致
GET /api/v1/user/list
GET /api/v1/getUser?id=123
GET /api/v1/posts?userId=123
```

### 2. 语义化的 URL

用名词复数表示资源，用 HTTP 方法表达动作：

| 方法 | 路径 | 含义 |
|------|------|------|
| GET | /users | 获取用户列表 |
| POST | /users | 创建用户 |
| GET | /users/123 | 获取指定用户 |
| PUT | /users/123 | 全量更新用户 |
| PATCH | /users/123 | 部分更新用户 |
| DELETE | /users/123 | 删除用户 |

### 3. 合理的状态码

不要所有请求都返回 `200`：

- `200` — 成功
- `201` — 创建成功
- `204` — 成功但无返回内容（删除操作）
- `400` — 请求参数错误
- `401` — 未认证
- `403` — 无权限
- `404` — 资源不存在
- `422` — 业务逻辑校验失败
- `429` — 请求过于频繁
- `500` — 服务端内部错误

### 4. 统一的错误响应

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "邮箱格式不正确",
    "field": "email"
  }
}
```

### 5. 分页、过滤与排序

列表接口必须支持分页，避免返回全量数据：

```
GET /api/v1/users?page=2&per_page=20&sort=created_at&order=desc
```

响应中包含分页元信息：

```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "per_page": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

### 6. 版本控制

API 必须有版本号，推荐 URL 路径版本号：

```
/api/v1/users
/api/v2/users
```

## API 设计检查清单

- [ ] URL 使用名词复数，HTTP 方法表达动作
- [ ] 响应使用正确的 HTTP 状态码
- [ ] 错误格式统一且包含足够信息
- [ ] 列表接口支持分页
- [ ] 接口有版本号
- [ ] 敏感操作有权限校验
- [ ] 有频率限制（Rate Limiting）
- [ ] 有接口文档（OpenAPI / Swagger）

## 总结

API 是团队间沟通的契约，设计得好，前后端协作事半功倍；设计得差，每天都在对参数。投入时间把 API 设计好，是最值得的技术投资之一。