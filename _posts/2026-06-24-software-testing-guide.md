---
layout: post
title: "软件测试策略与实践"
date: 2026-06-24
categories: [engineering, testing]
tags: [testing, tdd, unit-test, integration-test]
---

## 测试金字塔

测试金字塔是指导测试策略的经典模型：

```
        /  E2E  \          ← 少量：慢、贵、脆
       /集成测试  \
      /            \
     /   单元测试    \      ← 大量：快、便宜、稳定
    /________________\
```

| 层级 | 数量 | 速度 | 覆盖范围 |
|------|------|------|---------|
| 单元测试 | 多 | <1ms | 单个函数/模块 |
| 集成测试 | 中 | ~100ms | 模块间交互 |
| E2E 测试 | 少 | ~1s+ | 完整用户流程 |

## 单元测试

单元测试是金字塔的基石，应该占测试总量的 70% 以上。

### 好的单元测试长什么样

```javascript
// ❌ 测了太多东西，不好定位问题
function testUser() {
  const user = createUser('alice', 'alice@mail.com');
  expect(user.name).toBe('alice');
  expect(user.email).toBe('alice@mail.com');
  expect(user.id).toBeDefined();
  expect(user.createdAt).toBeDefined();
  expect(sendWelcomeEmail).toHaveBeenCalled();
}

// ✅ 每个测试只验证一件事
function testUserName() {
  const user = createUser('alice', 'alice@mail.com');
  expect(user.name).toBe('alice');
}

function testUserEmail() {
  const user = createUser('alice', 'alice@mail.com');
  expect(user.email).toBe('alice@mail.com');
}
```

### AAA 模式

```javascript
test('计算折扣价格', () => {
  // Arrange — 准备数据
  const price = 100;
  const discount = 0.2;

  // Act — 执行操作
  const result = calculateDiscount(price, discount);

  // Assert — 验证结果
  expect(result).toBe(80);
});
```

## 集成测试

验证模块之间的交互是否正确，重点检查数据流转和接口契约。

```javascript
// 测试 API 端到端流程
test('POST /api/users 创建用户并返回 201', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({ name: 'alice', email: 'alice@mail.com' });

  expect(response.status).toBe(201);
  expect(response.body.data.name).toBe('alice');

  // 验证数据库中也写入了
  const user = await db.users.findOne({ email: 'alice@mail.com' });
  expect(user).not.toBeNull();
});
```

## Mock 的正确使用

```javascript
// Mock 外部依赖，而非内部逻辑
const mockEmailService = {
  send: jest.fn().mockResolvedValue(true)
};

test('注册后发送欢迎邮件', async () => {
  await registerUser({ name: 'alice', email: 'alice@mail.com' }, mockEmailService);

  expect(mockEmailService.send).toHaveBeenCalledWith(
    'alice@mail.com',
    expect.stringContaining('Welcome')
  );
});
```

> ⚠️ **注意**：不要过度 Mock。Mock 太多意味着测试与实现细节耦合过深，重构时测试容易大面积失败。

## 什么时候该写测试

| 场景 | 建议 |
|------|------|
| 新功能 | 先写测试（TDD）或写完补测试 |
| Bug 修复 | 先写复现测试，再修复 |
| 重构 | 先确保有测试覆盖，再动手 |
| 一次性脚本 | 可以不写 |
| 核心业务逻辑 | 必须有高强度测试 |

## 总结

测试不是负担，而是信心保障。从单元测试做起，逐步补充集成测试和 E2E 测试，让自动化测试成为代码质量的守护者。