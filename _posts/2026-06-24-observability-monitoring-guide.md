---
layout: post
title: "可观测性与监控体系建设"
date: 2026-06-24
categories: [engineering, observability]
tags: [monitoring, observability, logging, metrics, tracing]
---

## 可观测性三支柱

可观测性（Observability）是理解系统内部状态的能力，由三大支柱构成：

| 支柱 | 回答的问题 | 工具举例 |
|------|-----------|---------|
| **Metrics（指标）** | 系统现在怎么样？ | Prometheus、Grafana |
| **Logs（日志）** | 发生了什么？ | ELK、Loki |
| **Traces（链路追踪）** | 请求经过了哪里？ | Jaeger、Zipkin |

## Metrics — 量化系统状态

### 四种指标类型

```
Counter    → 只增不减（如：请求总数、错误总数）
Gauge      → 可增可减（如：CPU 使用率、在线用户数）
Histogram  → 分布统计（如：请求延迟 P50/P95/P99）
Summary    → 客户端计算分位数（类似 Histogram）
```

### 关键指标（RED 方法）

针对每个服务，关注三个核心指标：

- **Rate** — 请求速率（QPS）
- **Errors** — 错误率
- **Duration** — 延迟分布

### 告警设计原则

```yaml
# ✅ 好的告警：基于症状，可操作
- alert: HighErrorRate
  expr: rate(http_errors_total[5m]) / rate(http_requests_total[5m]) > 0.05
  for: 5m
  annotations:
    summary: "API 错误率超过 5%，请检查服务日志"

# ❌ 差的告警：基于原因，不知所措
- alert: CPUHigh
  expr: cpu_usage > 80
  annotations:
    summary: "CPU 高"
```

**告警黄金法则**：每条告警都应该是可操作的，收到后你知道该做什么。

## Logs — 记录系统事件

### 结构化日志

```json
{
  "timestamp": "2026-06-24T10:30:00Z",
  "level": "ERROR",
  "service": "user-api",
  "trace_id": "abc123",
  "span_id": "def456",
  "message": "数据库查询超时",
  "query": "SELECT * FROM users WHERE...",
  "duration_ms": 5000
}
```

### 日志级别使用规范

| 级别 | 用途 | 示例 |
|------|------|------|
| ERROR | 需要立即处理 | 数据库连接失败 |
| WARN | 潜在问题 | 请求慢但未超时 |
| INFO | 关键业务事件 | 用户注册成功 |
| DEBUG | 调试信息 | 函数入参出参 |

### 关联 Trace ID

在日志中嵌入 `trace_id`，可以在 Grafana/Jaeger 中从日志直接跳转到链路追踪：

```javascript
logger.info({
  trace_id: ctx.traceId,
  message: 'Order created',
  order_id: order.id
});
```

## Traces — 追踪请求链路

### 一个请求的追踪示例

```
[Gateway] ─── 5ms ──→ [User Service] ─── 12ms ──→ [DB]
                               │
                               └── 8ms ──→ [Cache] → miss
                               │
                               └── 30ms ──→ [Order Service] ─── 25ms ──→ [DB]

总耗时: 55ms    瓶颈: Order Service → DB (25ms)
```

### 采样策略

| 策略 | 说明 | 适用场景 |
|------|------|---------|
| 全量采集 | 记录每个请求 | 低流量服务 |
| 概率采样 | 按比例采集 | 一般服务 |
| 自适应采样 | 错误请求优先采集 | 生产环境推荐 |
| 尾部采样 | 延迟高的请求才采集 | 高流量服务 |

## 三者联动

最佳实践是 **Metrics → Traces → Logs** 的逐层下钻：

```
1. Grafana 发现错误率飙升（Metrics）
   ↓ 点击跳转
2. Jaeger 找到慢请求的链路（Traces）
   ↓ 点击跳转
3. Loki 查看该请求的详细日志（Logs）
   ↓
4. 定位根因，修复上线
```

## 总结

可观测性不是可选的，它是生产环境的基本要求。从 Metrics 开始搭建大盘，补上结构化日志，再加链路追踪，逐步构建完整的可观测体系。