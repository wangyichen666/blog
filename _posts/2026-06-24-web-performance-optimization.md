---
layout: post
title: "前端性能优化实战"
date: 2026-06-24
categories: [engineering, frontend]
tags: [performance, optimization, web-vitals, rendering]
---

## 性能指标：Core Web Vitals

Google 定义的三大核心指标，直接影响搜索排名：

| 指标 | 含义 | 目标值 |
|------|------|--------|
| **LCP** | 最大内容绘制 | < 2.5s |
| **INP** | 交互到下一次绘制 | < 200ms |
| **CLS** | 累积布局偏移 | < 0.1 |

## 加载性能

### 资源优化

```html
<!-- 图片：使用现代格式 + 懒加载 -->
<img src="hero.avif" loading="eager" alt="...">
<img src="photo.webp" loading="lazy" alt="...">

<!-- 响应式图片 -->
<picture>
  <source srcset="hero-mobile.webp" media="(max-width: 768px)">
  <source srcset="hero-desktop.webp" media="(min-width: 769px)">
  <img src="hero-desktop.jpg" alt="...">
</picture>

<!-- 预加载关键资源 -->
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/css/critical.css" as="style">
```

### 代码拆分

```javascript
// ❌ 全量引入
import { debounce, throttle, chunk } from 'lodash'

// ✅ 按需引入
import debounce from 'lodash/debounce'

// ✅ 路由级懒加载
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Settings = React.lazy(() => import('./pages/Settings'))

// ✅ Vite/Webpack 自动代码拆分
export default [
  { path: '/', component: () => import('./pages/Home.vue') },
  { path: '/about', component: () => import('./pages/About.vue') }
]
```

### 缓存策略

```
静态资源（JS/CSS/图片）:
  Cache-Control: public, max-age=31536000, immutable
  → 文件名含 hash，长期缓存

HTML 页面:
  Cache-Control: no-cache
  → 每次协商缓存

API 响应:
  Cache-Control: private, max-age=0, must-revalidate
  → 私有，必须验证
```

## 渲染性能

### 减少 DOM 操作

```javascript
// ❌ 频繁操作 DOM
items.forEach(item => {
  const li = document.createElement('li')
  li.textContent = item.name
  list.appendChild(li)  // 每次触发重排
})

// ✅ DocumentFragment 批量操作
const fragment = document.createDocumentFragment()
items.forEach(item => {
  const li = document.createElement('li')
  li.textContent = item.name
  fragment.appendChild(li)
})
list.appendChild(fragment)  // 只触发一次重排
```

### 防抖与节流

```javascript
// 防抖：搜索输入
const search = debounce(query => fetchResults(query), 300)

// 节流：滚动事件
const onScroll = throttle(() => updatePosition(), 100)

// requestAnimationFrame：动画
function animate() {
  updateAnimation()
  requestAnimationFrame(animate)
}
```

### 虚拟列表

```javascript
// 大列表只渲染可视区域，万级数据也不卡
import { VirtualList } from 'vue-virtual-scroller'

// 10万条数据，只渲染可视的 ~20 条
<VirtualList :items="hugeList" :item-size="50">
  <template #default="{ item }">
    <UserRow :user="item" />
  </template>
</VirtualList>
```

## 网络性能

### 请求优化

```
✅ 合并小请求（GraphQL / BFF 聚合）
✅ 预连接：rel="preconnect"
✅ DNS 预解析：rel="dns-prefetch"
✅ 减少 Cookie 大小（静态资源用独立域名）
✅ 开启 Brotli/Gzip 压缩
✅ HTTP/2 多路复用
```

### Service Worker 离线缓存

```javascript
// 注册 Service Worker
navigator.serviceWorker.register('/sw.js')

// sw.js — 缓存优先策略
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  )
})
```

## 性能优化检查清单

- [ ] 关键资源预加载（preload / preconnect）
- [ ] 图片使用 WebP/AVIF + 懒加载
- [ ] 路由级代码拆分
- [ ] 静态资源长缓存 + hash 文件名
- [ ] 第三方库按需引入
- [ ] 防抖/节流高频事件
- [ ] 大列表使用虚拟滚动
- [ ] 开启 Brotli 压缩
- [ ] CLS：为图片/广告预留占位空间
- [ ] Lighthouse 评分 > 90

## 总结

性能优化不是一次性工程，而是需要持续关注的常态工作。先用 Lighthouse 建立基线，找出最大的瓶颈对症下药，然后在 CI 中集成性能回归检测，防止优化成果被稀释。