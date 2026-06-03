# Team Docs

[![CI](https://github.com/jiaxiantao/team-docs/actions/workflows/ci.yml/badge.svg)](https://github.com/jiaxiantao/team-docs/actions/workflows/ci.yml)

类飞书文档的**在线实时协同编辑**开源项目，基于现代 Web 技术栈构建，支持 Docker 部署与 GitHub Actions CI/CD。

## 技术架构

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Next.js 16 (App Router) + React 19 | SSR、API Routes、认证中间件 |
| 编辑器 | Tiptap 3 + ProseMirror | 富文本编辑、工具栏 |
| 协同 | **Yjs (CRDT)** + **Hocuspocus** | 冲突自由合并，毫秒级同步 |
| 数据库 | PostgreSQL 16 + Prisma 6 | 用户、文档元数据、Yjs 状态持久化 |
| 认证 | Auth.js (NextAuth v5) | JWT 会话 + 协同令牌 HMAC |
| 部署 | Docker Compose | Web + Collab + Postgres 一键启动 |
| CI/CD | GitHub Actions | Lint、迁移、构建、Docker 镜像 |

```
┌─────────────┐     WebSocket      ┌──────────────────┐
│  Next.js    │ ◄────────────────► │ Hocuspocus       │
│  (Tiptap)   │     Yjs updates    │ collab-server    │
└──────┬──────┘                    └────────┬─────────┘
       │ REST API                          │
       ▼                                     ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL                              │
│  User · Document · DocumentState (Yjs binary)       │
└─────────────────────────────────────────────────────┘
```

## 快速开始（本地开发）

### 1. 环境要求

- Node.js 22+
- pnpm 9+（`corepack enable` 后自动使用项目锁定版本）
- PostgreSQL 16（或使用 Docker 仅启动数据库）

### 2. 安装与配置

```bash
cp .env.example .env
# 编辑 .env：POSTGRES_PASSWORD、AUTH_SECRET、COLLAB_SECRET

pnpm install
```

### 3. 数据库（本地 PostgreSQL）

本地开发默认连接 **`team_docs`** 库（不是 Docker 用的 `teamdocs`）。

1. 在 IDE / pgAdmin 中确认 PostgreSQL 已启动，并创建数据库（若尚未创建）：

```sql
CREATE DATABASE team_docs;
```

2. 在 `.env` 中填写与 IDE 连接一致的账号密码，例如：

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=你的本地密码
POSTGRES_DB=team_docs
```

3. 验证连接并迁移：

```bash
pnpm run db:check    # 应显示「数据库连接成功」且数据库为 team_docs
pnpm run db:migrate
pnpm run db:seed
```

> 若使用 Docker 跑数据库而非本机 Postgres，见下方「Docker 一键部署」；勿与本地 `.env` 混用。

**可选**：仅用 Docker 起一个临时库时：

```bash
docker run -d --name teamdocs-pg \
  -e POSTGRES_USER=teamdocs \
  -e POSTGRES_PASSWORD=teamdocs \
  -e POSTGRES_DB=teamdocs \
  -p 5432:5432 \
  postgres:16-alpine
# 此时需把 .env 的 DATABASE_URL 改为 teamdocs 用户/库
```

演示账号：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 所有者 | `demo@teamdocs.local` | `demo123456` |
| 仅查看协作者 | `viewer@teamdocs.local` | `viewer123456` |

### 4. 启动服务

```bash
pnpm run dev
```

- Web：http://localhost:3000
- 协同 WebSocket：ws://localhost:1234

`pnpm run dev` 会同时启动 Next.js 与 Hocuspocus 协同服务。

## Docker 一键部署

```bash
cp .env.example .env
# 生产环境务必修改 AUTH_SECRET、COLLAB_SECRET

docker compose up -d --build
```

服务：

| 服务 | 端口 | 说明 |
|------|------|------|
| web | 3000 | Next.js 应用 |
| collab | 1234 | 协同 WebSocket |
| postgres | 5432 | 数据库 |

首次启动会自动执行 `prisma migrate deploy`。

## CI/CD

单一工作流 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)，每次 Push/PR 只触发**一次**运行：

| Job | 触发条件 | 说明 |
|-----|----------|------|
| `quality` | Push / PR | Lint、Typecheck、单元测试、迁移、Next.js 构建 |
| `docker-verify` | Push | 本地构建 Docker 镜像做校验（不推送） |
| `release` | Push 到 `main` 或 `v*` 标签 | 构建并推送镜像到 `ghcr.io/<owner>/<repo>/web` 与 `collab` |

## 核心功能

- ✅ 用户注册 / 登录
- ✅ 文档创建、列表、重命名、删除
- ✅ 多人实时协同编辑（CRDT，无冲突）
- ✅ 协作者光标与昵称展示
- ✅ 在线人数显示
- ✅ Yjs 文档状态持久化到 PostgreSQL
- ✅ 协同连接 HMAC 令牌鉴权（含角色：可编辑 / 仅查看）
- ✅ 协作者邀请与角色管理
- ✅ 环境变量校验、`/api/health`、安全响应头
- ✅ Vitest 单元测试（`pnpm test`）

## 项目结构

```
team-docs/
├── src/
│   ├── app/              # Next.js 页面与 API
│   ├── components/       # UI 与协同编辑器
│   ├── lib/              # Prisma、鉴权、工具
│   └── auth.ts           # Auth.js 配置
├── collab-server/        # Hocuspocus WebSocket 服务
├── prisma/               # Schema 与迁移
├── docker-compose.yml
├── Dockerfile
└── .github/workflows/
```

## 环境变量

见 [`.env.example`](.env.example)。

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 |
| `AUTH_SECRET` | Auth.js 密钥（`openssl rand -base64 32`） |
| `AUTH_URL` | 应用公网地址 |
| `COLLAB_SECRET` | 协同令牌签名密钥（Web 与 collab-server 必须一致） |
| `NEXT_PUBLIC_COLLAB_WS_URL` | 浏览器连接的 WebSocket 地址 |

## 扩展建议

- 公开分享链接（无需登录的只读链接）
- 版本历史 / 快照回滚
- Redis 扩展 Hocuspocus 多实例
- S3 附件与图片上传
- OAuth（GitHub / 企业 SSO）

## 参与贡献

欢迎提交 Issue 与 Pull Request，请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。安全问题请见 [SECURITY.md](SECURITY.md)。

## License

[MIT](LICENSE)
