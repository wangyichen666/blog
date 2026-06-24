---
layout: post
title: "PostgreSQL 性能调优指南"
date: 2026-06-24
categories: [engineering, database]
tags: [postgresql, performance, sql, tuning]
---

## 慢查询定位

### 开启慢查询日志

```sql
-- 记录执行时间超过 200ms 的语句
ALTER SYSTEM SET log_min_duration_statement = 200;
SELECT pg_reload_conf();

-- 查看当前慢查询
SELECT pid, now() - pg_stat_activity.query_start AS duration,
       query, state
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '200 ms'
ORDER BY duration DESC;
```

### EXPLAIN ANALYZE

```sql
-- 查看真实执行计划
EXPLAIN ANALYZE
SELECT u.name, COUNT(o.id)
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.created_at > '2026-01-01'
GROUP BY u.name;

-- 关键关注：
-- Seq Scan → 全表扫描，考虑加索引
-- Nested Loop → 大表关联可能慢
-- Sort → 考虑加索引避免排序
-- actual time → 真实耗时
-- rows → 预估行数 vs 实际行数差异大说明统计信息过时
```

## 索引优化

### 什么时候该加索引

```sql
-- ✅ WHERE 条件列
SELECT * FROM orders WHERE user_id = 123;
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- ✅ JOIN 关联列
SELECT * FROM orders o JOIN users u ON o.user_id = u.id;
-- user_id 上已有索引

-- ✅ ORDER BY 排序列
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20;
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ✅ 组合条件（注意列顺序）
SELECT * FROM orders WHERE user_id = 123 AND status = 'paid';
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
```

### 索引类型选择

| 类型 | 适用场景 | 示例 |
|------|---------|------|
| B-Tree | 等值、范围、排序 | 默认类型，最常用 |
| Hash | 纯等值查询 | `WHERE key = 'abc'` |
| GIN | 数组、JSONB、全文搜索 | `WHERE tags @> '{python}'` |
| GiST | 地理空间、范围 | `WHERE point <@ area` |
| BRIN | 大表有序列 | 时间序列数据 |

### 避免索引失效

```sql
-- ❌ 函数导致索引失效
SELECT * FROM users WHERE LOWER(email) = 'alice@mail.com';
-- ✅ 使用表达式索引
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- ❌ 隐式类型转换
SELECT * FROM users WHERE phone = 13800138000;  -- phone 是 varchar
-- ✅ 类型匹配
SELECT * FROM users WHERE phone = '13800138000';

-- ❌ OR 导致全表扫描
SELECT * FROM orders WHERE status = 'paid' OR amount > 10000;
-- ✅ UNION ALL
SELECT * FROM orders WHERE status = 'paid'
UNION ALL
SELECT * FROM orders WHERE amount > 10000 AND status != 'paid';
```

## 查询优化

### 避免 SELECT *

```sql
-- ❌ 传输不必要的数据
SELECT * FROM users WHERE id = 1;

-- ✅ 只查需要的列
SELECT name, email FROM users WHERE id = 1;
```

### 分页优化

```sql
-- ❌ OFFSET 在大偏移量时很慢
SELECT * FROM orders ORDER BY id OFFSET 100000 LIMIT 20;

-- ✅ 游标分页（keyset pagination）
SELECT * FROM orders WHERE id > 100000 ORDER BY id LIMIT 20;
```

### 批量操作

```sql
-- ❌ 逐条插入
INSERT INTO logs (message) VALUES ('msg1');
INSERT INTO logs (message) VALUES ('msg2');

-- ✅ 批量插入
INSERT INTO logs (message) VALUES ('msg1'), ('msg2'), ('msg3');

-- ✅ 批量更新用 CTE
UPDATE users SET last_login = NOW()
WHERE id IN (
  SELECT user_id FROM recent_logins
);
```

## 连接池与配置

### 关键参数调优

```sql
-- 共享缓冲区：设为物理内存的 25%
ALTER SYSTEM SET shared_buffers = '2GB';

-- 有效缓存大小：设为物理内存的 75%
ALTER SYSTEM SET effective_cache_size = '6GB';

-- 工作内存：每个排序操作的内存
ALTER SYSTEM SET work_mem = '64MB';

-- 维护工作内存：VACUUM/CREATE INDEX 用
ALTER SYSTEM SET maintenance_work_mem = '512MB';

-- 连接数：配合连接池使用，不要设太高
ALTER SYSTEM SET max_connections = 100;
```

### 连接池（PgBouncer）

```ini
; pgbouncer.ini
[databases]
mydb = host=127.0.0.1 port=5432 dbname=mydb

[pgbouncer]
pool_mode = transaction    ; 事务级复用，充分利用连接
max_client_conn = 1000
default_pool_size = 20
reserve_pool_size = 5
```

## 监控与维护

```sql
-- 表统计信息（用于查询优化器）
ANALYZE users;

-- 清理死元组
VACUUM orders;

-- 自动清理配置
ALTER TABLE orders SET (autovacuum_vacuum_scale_factor = 0.05);

-- 索引使用率（找出未使用的索引）
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- 表膨胀率
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
       n_dead_tup
FROM pg_stat_user_tables
WHERE n_dead_tup > 10000
ORDER BY n_dead_tup DESC;
```

## 总结

数据库调优三板斧：**索引 → 查询 → 配置**。先用 EXPLAIN ANALYZE 定位瓶颈，加合适的索引解决 80% 的问题，再优化 SQL 写法，最后调整 PostgreSQL 参数和连接池。同时别忘了定期 VACUUM 和 ANALYZE，保持统计信息准确。