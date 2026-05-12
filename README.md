# Jekyll + Netlify CMS 博客

带 Web 管理界面的静态博客，部署到 GitHub + Netlify。

## 目录结构

```
jekyll-blog/
├── _config.yml          # Jekyll 配置
├── index.html            # 首页
├── posts.html            # 文章列表页
├── login.html            # 管理员登录页
├── _posts/               # 文章目录
│   └── *.md
├── _layouts/             # 布局模板
│   ├── default.html
│   └── post.html
├── admin/                # Netlify CMS (Decap CMS)
│   ├── index.html
│   └── config.yml
└── assets/               # 静态资源
    └── images/
```

## 快速部署

### 1. 推送到 GitHub

```bash
cd jekyll-blog
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### 2. 在 Netlify 部署

1. 登录 [Netlify](https://netlify.com)
2. 点击 "Add new site" → "Import an existing project"
3. 选择你的 GitHub 仓库
4. 设置：
   - **Build command:** `jekyll build`
   - **Publish directory:** `_site`
5. 点击 "Deploy site"

### 3. 启用身份认证

1. 进入 Site Settings → Identity → Enable Identity
2. 在 Identity 设置中启用 Git Gateway
3. 添加你的管理员邮箱

### 4. 修改配置

1. 编辑 `admin/config.yml`，修改 `site_url` 和 `display_url` 为你的 Netlify 域名
2. 编辑 `login.html`，修改 `CORRECT_PASSWORD` 为你的密码

## 使用方法

1. 访问 `https://your-site.netlify.app/login.html` 登录
2. 点击"管理"进入 CMS 后台
3. 使用 Markdown 编辑器写文章
4. 点击"发布"自动部署到 GitHub

## 本地预览

```bash
bundle install
bundle exec jekyll serve
```

访问 `http://localhost:4000`

## 注意事项

- 默认密码：`admin123`（请修改 `login.html` 中的 `CORRECT_PASSWORD`）
- 登录状态有效期：24小时
- 每次发布文章，Netlify 会自动重新构建网站