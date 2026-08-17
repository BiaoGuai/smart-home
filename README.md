# 全屋智能选品 · Vercel + Supabase 部署指南

把原本「本地 Node 服务 + data.json」的项目，改造成 **Vercel（无服务器）+ Supabase（云数据库）** 架构，一次部署长期在线，任何设备可访问，数据不再丢失。

## 一、架构说明

| 部分 | 原来 | 现在 |
|------|------|------|
| 数据存储 | `data.json` 本地文件 | Supabase Postgres（云数据库） |
| API 后端 | `server.js` 常驻进程 | `api/[...path].js` Vercel 函数 |
| 前端 | `public/` | Vercel 静态托管 |

- **根目录 `index.html` / `admin.html`**：Vercel 部署用（与 `public/` 内容相同）
- **`api/[...path].js`**：全部后端接口（登录/注册/选品/商品/品牌/生态/房间/方案/文章/用户管理）
- **`supabase/schema.sql`**：建表 + 50 款商品 + 6 方案 + 6 文章 + 管理员账号

管理员账号：`admin@admin.com` / `admin123`（密码哈希已内置在 schema.sql）

---

## 二、第一步：注册并配置 Supabase（数据库）

1. 打开 https://supabase.com → 点 **Start your project** → 用 **GitHub 登录**（最快，免注册）
2. 点 **New project**：
   - **Name**：`smart-home`
   - **Database Password**：自己设一个强密码（记下来，后面可能用）
   - **Region**：选 `Southeast Asia (Singapore)`（离国内近）
3. 等 1~2 分钟项目初始化完成
4. 左侧菜单 **SQL Editor** → **New query**
5. **把 `supabase/schema.sql` 文件内容全部粘贴**进去 → 点右下角 **Run**（或 Ctrl+Enter）
   - 看到输出 `schema + seed 已初始化完成` 即成功
6. 左侧菜单 **Project Settings** → **API**，复制下面两个值（后面 Vercel 要用）：
   - **Project URL**：形如 `https://xxxx.supabase.co`
   - **service_role key**：在 `Project API keys` 区块，点 `service_role` 右侧的 **copy** 图标（注意是 `service_role`，不是 `anon`）

> 这两个值先存到记事本，第三步要用。

---

## 三、第二步：把项目推到 GitHub

1. 安装 Git（https://git-scm.com ），打开终端进入项目目录：
   ```bash
   cd smart-home
   git init
   git add .
   git commit -m "全屋智能选品 Vercel+Supabase 版"
   ```
2. 在 GitHub 建一个**新仓库**（公开或私有都行，不要勾选初始化 README）
3. 按 GitHub 提示推送：
   ```bash
   git branch -M main
   git remote add origin https://github.com/你的用户名/smart-home.git
   git push -u origin main
   ```

> 说明：`.gitignore` 已自动忽略 `data.json`、`node_modules`、`client/`、`server/`、`dist/`、`cloudflared.exe` 等不需要部署的文件。

---

## 四、第三步：注册并配置 Vercel（部署）

1. 打开 https://vercel.com → **Sign Up** → 用 **GitHub 登录**
2. 点 **Add New...** → **Project**
3. 在列表里找到刚推的 `smart-home` 仓库 → 点 **Import**
4. 配置页（一般保持默认即可，**Framework Preset 选 Other**）：
   - **Root Directory**：保持默认（`./`）
5. **展开 Environment Variables**，添加两条（Name 区分大小写）：
   - `SUPABASE_URL` → 粘贴刚才的 **Project URL**
   - `SUPABASE_SERVICE_ROLE_KEY` → 粘贴刚才的 **service_role key**
6. 点 **Deploy**，等 1~2 分钟
7. 部署完成后，顶部会给你一个域名，形如 `https://smart-home-xxx.vercel.app`

**完成！** 现在：
- 🏠 用户端：`https://你的域名.vercel.app`
- 🔧 管理后台：`https://你的域名.vercel.app/admin.html`（`admin@admin.com` / `admin123`）

---

## 五、以后如何更新

以后改了代码，只需：
```bash
git add .
git commit -m "更新"
git push
```
Vercel 会**自动重新部署**（GitHub 每次 push 触发），1~2 分钟生效。

---

## 六、注意事项

1. **前端文件有两份**：根目录 `index.html`/`admin.html`（Vercel 用）和 `public/` 下同名文件（本地开发用）。**改前端时请两边同步**（改完执行 `cp public/*.html ./`）。
2. **数据在 Supabase**：注册的用户、选品、商品等都在云端数据库，永久保存。
3. **service_role key 绝不能泄露**：它只在 Vercel 服务端环境变量里，前端拿不到，安全。
4. **免费额度**：Vercel Hobby（个人）+ Supabase 免费层（500MB 数据库）完全够个人/小团队用。
5. **本地开发仍可用**：`server.js` + `data.json` 依然能本地跑（`node server.js`），不影响线上。

---

## 七、常见问题

**Q：部署后首页 404？**
确认环境变量 `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 拼写正确、值完整（没有多余空格）。

**Q：接口报错 `无法连接数据库`？**
去 Supabase 检查项目是否 Running（暂停的项目会无法连接，点 Restore 恢复）。

**Q：管理员登录失败？**
确认 `schema.sql` 在 Supabase SQL Editor 里执行成功（看到"已初始化完成"）。可重新执行一次（脚本有 `on conflict do nothing`，幂等安全）。

<!-- trigger redeploy Mon, Aug 17, 2026  5:42:24 PM -->
