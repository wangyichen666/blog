---
layout: post
title: "Linux 运维常用命令速查"
date: 2026-06-24
categories: [engineering, linux]
tags: [linux, shell, ops, troubleshooting]
---

## 进程管理

### 查看进程

```bash
# 查看所有进程
ps aux

# 按内存排序 top 10
ps aux --sort=-%mem | head -11

# 按CPU排序 top 10
ps aux --sort=-%cpu | head -11

# 查找特定进程
ps aux | grep nginx

# 树状显示进程关系
pstree -p
```

### 终止进程

```bash
# 优雅终止
kill -15 <PID>

# 强制终止
kill -9 <PID>

# 按名称终止
killall nginx

# 终止占用 8080 端口的进程
lsof -ti:8080 | xargs kill -9
```

## 磁盘与文件

### 磁盘空间

```bash
# 整体磁盘使用
df -h

# 当前目录各文件夹大小
du -sh */ | sort -rh

# 找出大于 100MB 的文件
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null

# 查看 inode 使用率（小文件过多时关注）
df -i
```

### 文件查找

```bash
# 按名称查找
find / -name "nginx.conf" 2>/dev/null

# 按内容查找（在所有 .js 文件中搜关键词）
grep -rn "FIXME" /app/src --include="*.js"

# 最近修改的文件
find /var/log -mtime -1 -type f
```

## 网络排查

### 连接与端口

```bash
# 查看监听端口
ss -tlnp
# 或
netstat -tlnp

# 查看某个端口的连接数
ss -s state established '( sport = :80 )' | wc -l

# 查看连接状态分布
ss -s

# 测试端口连通性
nc -zv target-host 443
```

### DNS 排查

```bash
# 查询域名解析
dig example.com
nslookup example.com

# 追踪 DNS 解析路径
dig +trace example.com

# 查看 /etc/hosts 是否有覆盖
cat /etc/hosts | grep example
```

### 请求调试

```bash
# 发送 HTTP 请求并查看响应头
curl -vI https://example.com

# 测量接口耗时
curl -o /dev/null -s -w "DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" https://example.com

# 抓包分析
tcpdump -i eth0 -nn port 80 -A
```

## 日志分析

```bash
# 实时查看日志
tail -f /var/log/syslog

# 实时查看并过滤关键词
tail -f /var/log/nginx/access.log | grep "500"

# 统计错误码分布
awk '{print $9}' access.log | sort | uniq -c | sort -rn | head

# 按时间段筛选
awk '/24\/Jun\/2026:10:3[0-9]/' access.log

# 统计独立 IP 数量
awk '{print $1}' access.log | sort -u | wc -l

# 查看 JVM GC 日志中的停顿
grep "Pause" gc.log | awk '{print $0}'
```

## 系统资源

### 内存

```bash
# 内存使用概览
free -h

# 进程内存排序
top -o %MEM

# 查看进程内存映射
pmap -x <PID>
```

### CPU

```bash
# CPU 核心数
nproc

# 负载均值（1min / 5min / 15min）
uptime

# 实时监控
htop

# 查看中断
cat /proc/interrupts
```

## 一键排障脚本

```bash
#!/bin/bash
echo "=== 系统信息 ==="
uptime
echo ""

echo "=== 内存 ==="
free -h
echo ""

echo "=== 磁盘 ==="
df -h | grep -v tmpfs
echo ""

echo "=== Top 5 CPU 进程 ==="
ps aux --sort=-%cpu | head -6
echo ""

echo "=== Top 5 内存进程 ==="
ps aux --sort=-%mem | head -6
echo ""

echo "=== 监听端口 ==="
ss -tlnp
echo ""

echo "=== 最近错误 ==="
dmesg --level=err,crit,alert,emerg -T | tail -10
```

## 总结

运维的关键是"快"：快速定位、快速恢复。把常用命令刻在肌肉记忆里，再配合一键排障脚本，能在故障发生时抢回宝贵的时间。