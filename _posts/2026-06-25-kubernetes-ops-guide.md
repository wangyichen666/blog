---
layout: post
title: "Kubernetes 运维实战手册"
date: 2026-06-25
categories: [engineering, kubernetes]
tags: [kubernetes, k8s, devops, container-orchestration]
---

## 核心概念速查

| 资源 | 作用 | 缩写 |
|------|------|------|
| Pod | 最小调度单元 | po |
| Deployment | 无状态应用管理 | deploy |
| Service | 服务发现与负载均衡 | svc |
| ConfigMap | 配置管理 | cm |
| Secret | 敏感配置 | — |
| Ingress | 外部流量入口 | ing |
| PVC | 持久化存储声明 | pvc |
| Namespace | 资源隔离 | ns |

## 常用操作

### 资源查看

```bash
# 查看所有资源状态
kubectl get all -n production

# 查看 Pod 详情
kubectl describe pod <pod-name> -n production

# 查看 Pod 日志
kubectl logs <pod-name> -n production --tail=100

# 实时跟踪日志
kubectl logs <pod-name> -n production -f

# 查看多个容器的日志（指定容器）
kubectl logs <pod-name> -c <container-name> -n production

# 进入容器调试
kubectl exec -it <pod-name> -n production -- /bin/sh

# 端口转发到本地
kubectl port-forward svc/my-service 8080:80 -n production
```

### 资源扩缩

```bash
# 手动扩缩
kubectl scale deployment/api --replicas=5 -n production

# 自动扩缩（HPA）
kubectl autoscale deployment/api \
  --min=2 --max=10 --cpu-percent=70 \
  -n production

# 查看 HPA 状态
kubectl get hpa -n production
```

### 配置更新

```bash
# 滚动更新镜像
kubectl set image deployment/api \
  api=my-registry/api:v2.0.0 -n production

# 查看滚动更新状态
kubectl rollout status deployment/api -n production

# 查看更新历史
kubectl rollout history deployment/api -n production

# 回滚到上一版本
kubectl rollout undo deployment/api -n production

# 回滚到指定版本
kubectl rollout undo deployment/api --to-revision=3 -n production
```

## 排障流程

### Pod 不是 Running？

```bash
# 第一步：查看 Pod 状态
kubectl get pods -n production

# 第二步：查看事件
kubectl describe pod <pod-name> -n production
```

常见状态与原因：

| 状态 | 常见原因 | 排查方向 |
|------|---------|---------|
| ImagePullBackOff | 镜像拉取失败 | 检查镜像名/tag、registry 凭证 |
| CrashLoopBackOff | 容器启动后崩溃 | 查看日志，检查启动命令/环境变量 |
| Pending | 调度失败 | 检查资源请求、节点亲和性、PVC |
| OOMKilled | 内存不足 | 增大 resources.limits.memory |
| Evicted | 节点资源不足 | 检查节点压力，清理或扩容 |

### 服务不通？

```bash
# 检查 Service Endpoints
kubectl get endpoints <svc-name> -n production

# 如果 Endpoints 为空 → 标签选择器不匹配
kubectl get pods -l app=my-app -n production

# 检查 Service 能否解析
kubectl run test --rm -it --image=busybox -- \
  nslookup my-service.production.svc.cluster.local

# 检查 Ingress
kubectl describe ingress <ingress-name> -n production
```

### 节点异常？

```bash
# 查看节点状态
kubectl get nodes -o wide

# 查看节点详情和事件
kubectl describe node <node-name>

# 查看节点资源使用
kubectl top nodes

# 标记节点不可调度
kubectl cordon <node-name>

# 驱逐节点上的 Pod
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# 恢复节点调度
kubectl uncordon <node-name>
```

## Deployment 最佳实践

### 资源配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 滚动更新时最多多出 1 个 Pod
      maxUnavailable: 0   # 滚动更新时不允许不可用
  template:
    spec:
      containers:
      - name: api
        image: my-registry/api:v1.0.0
        resources:
          requests:        # 调度依据
            cpu: 100m
            memory: 128Mi
          limits:          # 硬限
            cpu: 500m
            memory: 512Mi
        livenessProbe:     # 存活探针：失败则重启
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 20
        readinessProbe:    # 就绪探针：失败则从 Service 摘除
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
```

### 多环境管理

```bash
# 用 Kustomize 管理环境差异
# base/deployment.yaml — 公共配置
# overlays/production/kustomization.yaml — 生产覆盖

# 渲染最终配置
kubectl kustomize overlays/production

# 直接应用
kubectl apply -k overlays/production
```

## 安全要点

```bash
# 不要用 default namespace
kubectl create namespace production

# 最小权限 RBAC
kubectl create role pod-reader --verb=get,list,watch --resource=pods -n production

# 禁止特权容器（Pod Security Standards）
# 在 namespace 上添加 label：
# pod-security.kubernetes.io/enforce=restricted

# Secret 加密
kubectl create secret tls my-tls \
  --cert=tls.crt --key=tls.key -n production

# 定期轮换 Service Account Token
```

## 总结

K8s 运维的核心是"观察 → 定位 → 修复"。熟练掌握 kubectl 排障命令、理解 Pod 生命周期和状态含义、配置好探针和资源限额，就能从容应对大部分生产问题。