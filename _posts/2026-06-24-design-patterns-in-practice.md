---
layout: post
title: "设计模式实战精讲"
date: 2026-06-24
categories: [engineering, design-patterns]
tags: [design-patterns, oop, architecture, clean-code]
---

## 为什么要学设计模式

设计模式不是教条，而是前人对反复出现问题的经验总结。掌握设计模式，能让你写出更灵活、更易维护的代码。

## 创建型模式

### 单例模式（Singleton）

确保一个类只有一个实例，适用于全局配置、连接池等场景。

```javascript
// ✅ 线程安全的懒加载单例
class Database {
  static #instance = null

  static getInstance() {
    if (!Database.#instance) {
      Database.#instance = new Database()
    }
    return Database.#instance
  }

  // 私有化构造函数
  constructor() {
    if (Database.#instance) {
      throw new Error('Use Database.getInstance()')
    }
  }
}
```

### 工厂模式（Factory）

将对象创建逻辑封装起来，调用方无需知道具体类。

```javascript
// ✅ 根据类型创建不同的通知器
class NotificationFactory {
  static create(type) {
    switch (type) {
      case 'email':    return new EmailNotifier()
      case 'sms':      return new SMSNotifier()
      case 'slack':    return new SlackNotifier()
      default:         throw new Error(`Unknown type: ${type}`)
    }
  }
}

// 调用方不关心具体实现
const notifier = NotificationFactory.create(config.type)
await notifier.send(message)
```

### 建造者模式（Builder）

一步步构造复杂对象，比构造函数更清晰。

```javascript
const query = new QueryBuilder()
  .select('users.id', 'users.name', 'orders.total')
  .from('users')
  .join('orders', 'users.id', 'orders.user_id')
  .where('orders.total', '>', 100)
  .orderBy('orders.total', 'DESC')
  .limit(10)
  .build()

// SELECT users.id, users.name, orders.total
// FROM users JOIN orders ON users.id = orders.user_id
// WHERE orders.total > 100 ORDER BY orders.total DESC LIMIT 10
```

## 结构型模式

### 适配器模式（Adapter）

让不兼容的接口协同工作。

```javascript
// 旧系统返回 XML，新系统需要 JSON
class XmlToJsonAdapter {
  constructor(xmlService) {
    this.xmlService = xmlService
  }

  async getUser(id) {
    const xml = await this.xmlService.getUser(id)
    return this.#parseXmlToJson(xml)
  }

  #parseXmlToJson(xml) { /* ... */ }
}
```

### 装饰器模式（Decorator）

动态添加功能，不修改原始类。

```javascript
// 基础日志器
class Logger {
  log(msg) { console.log(msg) }
}

// 装饰器：添加时间戳
class TimestampLogger {
  constructor(logger) { this.logger = logger }

  log(msg) {
    this.logger.log(`[${new Date().toISOString()}] ${msg}`)
  }
}

// 装饰器：添加日志级别
class LevelLogger {
  constructor(logger, level) {
    this.logger = logger
    this.level = level
  }

  log(msg) {
    this.logger.log(`[${this.level}] ${msg}`)
  }
}

// 灵活组合
const logger = new LevelLogger(
  new TimestampLogger(new Logger()), 'INFO'
)
logger.log('Server started')
// [INFO] [2026-06-24T10:00:00Z] Server started
```

## 行为型模式

### 策略模式（Strategy）

将算法封装为可互换的策略，避免大量 if-else。

```javascript
// ❌ 大量条件分支
function calculatePrice(order) {
  if (order.type === 'regular') return order.amount
  if (order.type === 'vip') return order.amount * 0.8
  if (order.type === 'svip') return order.amount * 0.7
}

// ✅ 策略模式
const pricingStrategies = {
  regular: (amount) => amount,
  vip:     (amount) => amount * 0.8,
  svip:    (amount) => amount * 0.7,
}

function calculatePrice(order) {
  const strategy = pricingStrategies[order.type]
  return strategy(order.amount)
}
```

### 观察者模式（Observer）

一对多依赖，状态变化自动通知所有订阅者。

```javascript
class EventBus {
  #listeners = new Map()

  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, [])
    }
    this.#listeners.get(event).push(callback)
  }

  emit(event, data) {
    const callbacks = this.#listeners.get(event) || []
    callbacks.forEach(cb => cb(data))
  }

  off(event, callback) {
    const callbacks = this.#listeners.get(event) || []
    this.#listeners.set(event, callbacks.filter(cb => cb !== callback))
  }
}

// 使用
const bus = new EventBus()
bus.on('user:created', (user) => sendWelcomeEmail(user))
bus.on('user:created', (user) => syncToCRM(user))
bus.emit('user:created', { id: 1, name: 'Alice' })
```

### 责任链模式（Chain of Responsibility）

请求沿链传递，每个节点决定处理还是传给下一个。

```javascript
// 中间件就是责任链的经典应用
const auth = (ctx, next) => {
  if (!ctx.user) throw new Error('Unauthorized')
  return next()
}

const rateLimit = (ctx, next) => {
  if (isRateLimited(ctx.ip)) throw new Error('Too many requests')
  return next()
}

const log = (ctx, next) => {
  console.log(`${ctx.method} ${ctx.path}`)
  return next()
}

// 组合链
app.use(auth, rateLimit, log, handler)
```

## 模式选择指南

| 需求 | 推荐模式 |
|------|---------|
| 创建复杂对象 | Builder |
| 统一不同接口 | Adapter |
| 动态添加功能 | Decorator |
| 消除条件分支 | Strategy |
| 事件通知 | Observer |
| 请求逐步处理 | Chain of Responsibility |
| 全局唯一实例 | Singleton |

## 总结

设计模式是工具，不是目的。不要为了用模式而用模式，而是在遇到真实问题时，想起"这个问题可以用 XX 模式解决"。模式要结合实际场景灵活运用，生搬硬套只会增加复杂度。