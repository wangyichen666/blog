---
layout: post
title: "微服务设计模式与实践"
date: 2026-06-24
categories: [engineering, architecture]
tags: [microservices, design-patterns, distributed-systems]
---

## 微服务 vs 单体

| 维度 | 单体架构 | 微服务架构 |
|------|---------|-----------|
| 部署 | 一次部署全部 | 独立部署各服务 |
| 扩展 | 整体扩展 | 按需独立扩展 |
| 技术栈 | 统一 | 可异构 |
| 故障影响 | 全局 | 隔离 |
| 开发效率 | 小团队快 | 大团队协作好 |
| 运维复杂度 | 低 | 高 |

**核心原则**：不要为了微服务而微服务，从单体开始，按需拆分。

## 服务拆分策略

### 按业务领域拆分（推荐）

```
电商系统：
├── 用户服务（User Service）
├── 商品服务（Product Service）
├── 订单服务（Order Service）
├── 支付服务（Payment Service）
└── 通知服务（Notification Service）
```

### 拆分判断标准

- **独立变化** — 两个功能是否经常同时修改？
- **独立部署** — 是否需要不同的部署节奏？
- **独立扩展** — 是否有不同的性能需求？
- **团队边界** — 是否由不同团队负责？

如果答案都是"否"，就不要拆。

## 核心设计模式

### 1. API 网关

统一入口，处理认证、限流、路由：

```
客户端 → [API 网关] → 用户服务
                    → 订单服务
                    → 商品服务
```

### 2. 服务发现

服务实例动态注册与发现：

```yaml
# Consul 服务注册
{
  "service": {
    "name": "order-service",
    "port": 8080,
    "tags": ["v2"],
    "check": {
      "http": "http://localhost:8080/health",
      "interval": "10s"
    }
  }
}
```

### 3. 熔断器（Circuit Breaker）

防止级联故障，保护系统整体可用性：

```
正常 → [关闭] ──错误率超阈值──→ [打开]
         ↑                        │
         │                      冷却期
         │                        ↓
         └───探测成功──── [半开] ←┘
```

```javascript
// 使用 resilience4j / opossum 等库
const breaker = new CircuitBreaker(orderService.fetch, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

// 降级处理
const order = await breaker.fire(orderId)
  .catch(() => getCachedOrder(orderId));
```

### 4. Saga 模式

分布式事务协调，替代跨服务数据库事务：

**编排式 Saga**：

```
[Order Service] ─create order→ [Payment Service]
                                    │
                              payment success
                                    │
                                    ↓
              [Order Service] ←─────┘ ──notify→ [Notification Service]
```

**补偿事务**：每个步骤都有对应的回滚操作：

```
正向: 创建订单 → 扣款 → 减库存 → 确认订单
补偿: 取消订单 → 退款 → 恢复库存 → 标记失败
```

### 5. 事件驱动通信

服务间通过异步事件解耦：

```javascript
// 订单服务发布事件
await messageBroker.publish('order.created', {
  orderId: order.id,
  userId: order.userId,
  amount: order.amount
});

// 通知服务订阅事件
messageBroker.subscribe('order.created', async (event) => {
  await sendOrderConfirmation(event.userId, event.orderId);
});
```

## 数据管理

### 每服务一库

每个服务拥有自己的数据库，禁止跨服务直接查表：

```
❌ 订单服务直接查用户服务的数据库
✅ 订单服务通过 API 或事件获取用户数据
```

### CQRS（命令查询职责分离）

写操作和读操作使用不同的数据模型：

```
Command (写) → 写数据库 (MySQL)
                    │
              事件同步 │
                    ↓
Query  (读) ← 读数据库 (Elasticsearch)
```

## 反模式警示

| 反模式 | 问题 | 解决方案 |
|--------|------|---------|
| 分布式单体 | 服务间强耦合 | 使用事件驱动解耦 |
| 共享数据库 | 违反服务自治 | 每服务一库 |
| 同步调用链过长 | 延迟叠加、级联故障 | 异步事件 + 熔断 |
| 过早拆分 | 增加复杂度无收益 | 从单体开始按需拆 |

## 总结

微服务不是万能药，它用复杂度换来了独立性和扩展性。在决定采用微服务之前，先确认你是否真的需要它。如果决定上路，服务拆分、通信模式、数据管理和容错设计是四个必须做好的基本功。