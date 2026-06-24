---
layout: post
title: "Redis 实战设计模式"
date: 2026-06-24
categories: [engineering, redis]
tags: [redis, cache, distributed-lock, message-queue]
---

## Redis 数据结构与应用场景

| 数据结构 | 典型场景 | 命令示例 |
|---------|---------|---------|
| String | 缓存、计数器、分布式锁 | SET / GET / INCR |
| Hash | 对象存储 | HSET / HGET / HMGET |
| List | 消息队列、最新列表 | LPUSH / RPOP / LRANGE |
| Set | 去重、交集/并集 | SADD / SINTER / SUNION |
| ZSet | 排行榜、延迟队列 | ZADD / ZRANGEBYSCORE |
| Stream | 消息流（Kafka 替代） | XADD / XREAD |

## 缓存模式

### 缓存穿透

查询一个数据库中不存在的数据，每次都打到数据库。

```python
# ✅ 布隆过滤器：拦截不存在的 key
# 写入时添加到布隆过滤器
bf.add("user_ids", user_id)

# 查询前先检查
if not bf.exists("user_ids", user_id):
    return None  # 一定不存在，直接返回

# ✅ 空值缓存：短时间缓存空结果
redis.setex(f"user:{user_id}", 300, "NULL")
```

### 缓存击穿

热点 key 过期瞬间，大量请求同时打到数据库。

```python
# ✅ 互斥锁：只让一个请求回源
def get_with_lock(key, ttl=3600):
    value = redis.get(key)
    if value:
        return value

    # 获取互斥锁
    lock_key = f"lock:{key}"
    if redis.set(lock_key, "1", nx=True, ex=10):
        try:
            # 回源查数据库
            value = db.query(key)
            redis.setex(key, ttl, value)
            return value
        finally:
            redis.delete(lock_key)
    else:
        # 等待后重试
        time.sleep(0.1)
        return get_with_lock(key, ttl)

# ✅ 逻辑过期：不设 TTL，数据中嵌入过期时间
# 适合对一致性要求不高的场景
```

### 缓存雪崩

大量 key 同时过期，数据库压力骤增。

```python
# ✅ 随机过期时间，打散过期点
base_ttl = 3600
random_ttl = base_ttl + random.randint(0, 600)
redis.setex(key, random_ttl, value)

# ✅ 永不过期 + 异步刷新
# 数据不设 TTL，由后台任务定期刷新
```

## 分布式锁

### 基础实现

```python
def acquire_lock(lock_name, expire=10):
    """获取分布式锁"""
    identifier = str(uuid.uuid4())
    acquired = redis.set(
        f"lock:{lock_name}", identifier,
        nx=True, ex=expire
    )
    return identifier if acquired else None

def release_lock(lock_name, identifier):
    """释放锁（Lua 脚本保证原子性）"""
    script = """
   if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
    else
        return 0
    end
    """
    redis.eval(script, 1, f"lock:{lock_name}", identifier)
```

### Redlock（多节点锁）

单节点锁在主从切换时可能丢失，Redlock 在多个独立节点上获取锁，过半成功才算获取：

```python
# 5 个独立 Redis 实例，至少 3 个成功获取才算持有锁
# 适用于强一致性要求的场景
# 简单场景用单节点 + Lua 脚本即可
```

## 排行榜

```python
# 写入分数
redis.zadd("leaderboard:weekly", {user_id: score})

# 获取 Top 10（降序）
top10 = redis.zrevrange("leaderboard:weekly", 0, 9, withscores=True)

# 获取用户排名
rank = redis.zrevrank("leaderboard:weekly", user_id)

# 获取相邻排名（用户附近 5 人）
nearby = redis.zrevrange(
    "leaderboard:weekly",
    max(0, rank - 2), rank + 2,
    withscores=True
)
```

## 限流

### 固定窗口

```python
# 每分钟最多 60 次请求
key = f"ratelimit:{user_id}:{minute}"
count = redis.incr(key)
if count == 1:
    redis.expire(key, 60)
if count > 60:
    raise RateLimitError()
```

### 滑动窗口

```python
# 滑动窗口限流：最近 60 秒不超过 60 次
now = time.time()
window_start = now - 60
key = f"ratelimit:{user_id}"

pipe = redis.pipeline()
pipe.zremrangebyscore(key, 0, window_start)  # 清除过期记录
pipe.zadd(key, {str(now): now})               # 添加当前请求
pipe.zcard(key)                                # 统计窗口内请求数
pipe.expire(key, 60)
_, _, count, _ = pipe.execute()

if count > 60:
    raise RateLimitError()
```

## 消息队列

### 简单队列（List）

```python
# 生产者
redis.lpush("queue:email", json.dumps(task))

# 消费者（阻塞式）
while True:
    _, task = redis.brpop("queue:email", timeout=30)
    process(task)
```

### 延迟队列（ZSet）

```python
# 投递延迟任务（5 秒后执行）
execute_at = time.time() + 5
redis.zadd("delayed:queue", {json.dumps(task): execute_at})

# 消费者轮询到期任务
while True:
    now = time.time()
    tasks = redis.zrangebyscore("delayed:queue", 0, now)
    for task in tasks:
        # 原子性地取出任务
        if redis.zrem("delayed:queue", task):
            process(task)
    time.sleep(0.1)
```

### Stream（可靠消息流）

```python
# 生产者
msg_id = redis.xadd("stream:orders", {"order_id": "123", "action": "created"})

# 消费者组
redis.xgroup_create("stream:orders", "order-processors", id="0")

# 消费
messages = redis.xreadgroup(
    "order-processors", "consumer-1",
    {"stream:orders": ">"}, count=10, block=5000
)

# 确认处理完成
redis.xack("stream:orders", "order-processors", msg_id)
```

## 最佳实践

- **键命名规范**：`业务:实体:id`，如 `shop:order:123`
- **避免大 key**：单个 String < 10KB，Hash < 5000 字段
- **禁用 KEYS 命令**：全表扫描会阻塞，用 SCAN 替代
- **设置最大内存策略**：`maxmemory-policy allkeys-lru`
- **开启持久化按需选择**：RDB（快照）+ AOF（实时）组合使用
- **Pipeline 批量执行**：减少网络往返

## 总结

Redis 不仅是缓存，更是分布式系统的瑞士军刀。缓存三大问题（穿透/击穿/雪崩）、分布式锁、排行榜、限流、消息队列 — 掌握这些模式，就能应对大部分 Redis 应用场景。