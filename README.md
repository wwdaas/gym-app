# 健身房预约系统 (Gym Booking App)

会员端 + 管理端一体的健身房课程预约系统，内置千问（Qwen）驱动的 AI 预约助手。

- **会员端**：浏览课程表、预约/取消课程、到场签到、上传头像、AI 助手对话式预约
- **管理端**：课程类型管理、教练管理（含照片）、排课管理、预约总览、签到花名册、会员列表

技术栈：Next.js 16 (App Router + Server Actions) · TypeScript · Tailwind CSS · Prisma 7 + SQLite · NextAuth v5 · 千问 qwen-plus（阿里云百炼 DashScope）

## 本地启动

需要 Node.js 18.18+（推荐 20+）。

```bash
# 1. 克隆代码
git clone https://github.com/wwdaas/gym-app.git
cd gym-app

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
```

编辑 `.env`，填两个值：

| 变量 | 说明 |
|---|---|
| `AUTH_SECRET` | 登录会话密钥，运行 `openssl rand -base64 32` 生成一个填入 |
| `DASHSCOPE_API_KEY` | 千问 API Key，在 [阿里云百炼控制台](https://bailian.console.aliyun.com) 领取。不填的话除 AI 助手外其他功能都正常 |

```bash
# 4. 初始化数据库
npx prisma migrate dev   # 建表
npx prisma generate      # 生成 Prisma client
npx prisma db seed       # 写入演示数据（账号、课程、排课）

# 5. 启动
npm run dev
```

打开 http://localhost:3000 即可使用。

## 演示账号

| 角色 | 账号 | 密码 |
|---|---|---|
| 管理员 | `admin@gym.local` | `Passw0rd!` |
| 会员一号 | `member1@gym.local` | `Passw0rd!` |
| 会员二号 | `member2@gym.local` | `Passw0rd!` |

管理员登录后进入 `/admin` 管理端，会员进入 `/member` 会员端（AI 预约助手在会员端导航栏「预约助手」）。

## 常用命令

```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm start            # 运行生产构建
npx prisma studio    # 图形界面查看/编辑数据库
npx prisma db seed   # 重新写入演示数据
```

## 部署到线上（可选）

GitHub 仓库只托管代码，不运行程序。想要一个公开可访问的网址，推荐部署到 [Vercel](https://vercel.com)（Next.js 官方平台，个人项目免费）。注意两点：

1. **数据库**：SQLite 是本地文件，Vercel 的无服务器环境不能持久化它。需要把 `prisma/schema.prisma` 里的 `provider` 改成 `postgresql`，并使用云端 Postgres（如 [Neon](https://neon.tech) 免费档），`DATABASE_URL` 指向它。
2. **上传的照片**：目前存在 `public/uploads/` 本地目录，线上环境同样不持久，需要换成对象存储（如阿里云 OSS / Vercel Blob）。

本地或自有服务器（如一台常开的电脑 / 云主机）上用 `npm run build && npm start` 跑则无需任何改动。
