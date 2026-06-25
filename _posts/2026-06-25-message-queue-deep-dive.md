---
layout: post
title: "消息队列深入解析"
date: 2026-06-25
categories: [engineering, architecture]
tags: [message-queue, kafka, rabbitmq, async, distributed-systems]
---

## 为什么需要消息队列

消息队列是分布式系统的核心基础设施，解决三大问题：

| 问题 | 没有队列 | 有队列 |
|------|---------|--------|
| 解耦 | 下游服务变更要改上游 | 上游只管发消息，下游各取所需 |
| 异步 | 用户等邮件发完才返回 | 用户立即返回，邮件异步发送 |
| 削峰 | 流量突增压垮下游 | 队列缓冲，下游按自己节奏消费 |

## 消息模型

### 点对点（Queue）

一条消息只被一个消费者处理：

```
Producer → [Queue] → Consumer A ✓
                    → Consumer B   (同组竞争)
```

适用场景：任务分发、订单处理

### 发布订阅（Topic）

一条消息被所有订阅者处理：

```
Producer → [Topic] → Consumer Group A ✓
                   → Consumer Group B ✓
                   → Consumer Group C ✓
```

适用场景：事件通知、数据同步

## 主流消息队列对比

| 维度 | Kafka | RabbitMQ | RocketMQ | Pulsar |
|------|-------|----------|----------|--------|
| 定位 | 分布式流平台 | 通用消息代理 | 金融级消息 | 云原生消息 |
| 吞吐量 | 百万级/秒 | 万级/秒 | 十万级/秒 | 百万级/秒 |
| 延迟 | ms 级 | μs 级 | ms 级 | ms 级 |
| 消息顺序 | 分区内有序 | 队列有序 | 队列有序 | 分区内有序 |
| 消息回溯 | ✅ 按 offset | ❌ 消费即删 | ✅ 按时间 | ✅ 按时间 |
| 事务消息 | ✅ | ✅ | ✅ 原生支持 | ✅ |
| 适用场景 | 日志/事件流 | 业务消息/路由 | 电商/金融 | 多租户/SaaS |

## Kafka 核心架构

```
                    ┌─ Partition 0 ── Consumer A
Producer → Topic ───┼─ Partition 1 ── Consumer B
                    └─ Partition 2 ── Consumer C
```

### 关键配置

```properties
# Producer
acks=all                    # 所有副本确认才返回成功
retries=3                   # 发送失败重试次数
enable.idempotence=true     # 幂等生产，防止重复
max.in.flight.requests.per.connection=5

# Consumer
auto.offset.reset=earliest  # 无 offset 时从头消费
enable.auto.commit=false     # 手动提交 offset
max.poll.records=500         # 单次拉取最大消息数
max.poll.interval.ms=300000  # 两次 poll 最大间隔

# Broker
num.partitions=6             # 默认分区数
default.replication.factor=3 # 默认副本数
min.insync.replicas=2        # 最小同步副本数
```

### 消费者组与分区分配

```
Topic (6 partitions) → Consumer Group (3 consumers)
  P0, P3 → Consumer 1
  P1, P4 → Consumer 2
  P2, P5 → Consumer 3
```

**关键规则**：
- 一个分区同一时刻只能被一个消费者消费
- 消费者数 > 分区数时，多余的消费者 idle
- 消费者增减触发 Rebalance

## RabbitMQ 路由模型

```
Producer → Exchange ──routing key──→ Queue → Consumer
              │
              ├── Direct  : 精确匹配
              ├── Topic   : 模式匹配 (order.*.paid)
              ├── Fanout  : 广播
              └── Headers : 头部匹配
```

### 死信队列

消息消费失败或过期后进入死信队列，避免丢失：

```python
# 声明主队列，绑定死信交换
channel.queue_declare(
    queue='orders',
    arguments={
        'x-dead-letter-exchange': 'dlx.exchange',
        'x-dead-letter-routing-key': 'orders.dead',
        'x-message-ttl': 60000  # 60秒未消费则进死信
    }
)

# 声明死信队列，人工处理
channel.queue_declare(queue='orders.dead')
```

## 常见问题与解决方案

### 消息丢失

```
Producer          Broker           Consumer
   │                │                │
   │─── 消息 ───→   │                │     ① Producer 确认
   │   ack=all      │                │     ② Broker 持久化
   │                │─── 消息 ───→   │     ③ Consumer 手动 ack
   │                │   ←── ack ──   │
```

| 环节 | 丢失原因 | 解决方案 |
|------|---------|---------|
| Producer | 发送失败未重试 | acks=all + retries + 幂等 |
| Broker | 未落盘就宕机 | 副本 + min.insync.replicas |
| Consumer | 先提交 offset 再处理 | 手动提交，处理完再 ack |

### 消息重复

**根本方案：消费端幂等**

```python
# 方案一：唯一 ID 去重
def process_message(msg):
    msg_id = msg['id']
    if redis.set(f"processed:{msg_id}", "1", nx=True, ex=86400):
        do_business_logic(msg)

# 方案二：数据库唯一约束
INSERT INTO orders (id, ...)
VALUES (msg['order_id'], ...)
ON CONFLICT (id) DO NOTHING
```

### 消息积压

```bash
# Kafka 查看消费者 Lag
kafka-consumer-groups --describe --group my-group --bootstrap-server localhost:9092

# 应急处理
# 1. 扩容消费者（分区数允许的情况下）
# 2. 临时消费者转发到新 Topic（更多分区）
# 3. 跳过非关键消息，优先处理核心业务
```

### 消息顺序

```python
# Kafka：同一 key 路由到同一分区，保证分区有序
producer.send(
    topic='orders',
    key=str(order_id).encode(),  # 相同 order_id → 同一分区
    value=message_bytes
)

# RocketMQ：顺序消息
# 发送时指定 MessageQueue
# 消费时用 MessageListenerOrderly
```

## 选型建议

```
需要超高吞吐 + 日志/事件流？  → Kafka
需要灵活路由 + 低延迟？       → RabbitMQ
金融场景 + 事务消息？          → RocketMQ
多租户 + 云原生？              → Pulsar
小项目 + 快速上手？            → RabbitMQ / Redis Stream
```

## 总结

消息队列是分布式系统的粘合剂，选型时关注吞吐量、顺序性、可靠性和运维成本。无论用哪种队列，消息丢失、重复、积压、顺序是必须面对的四大问题，掌握其根因和解决方案，才算真正理解消息队列。