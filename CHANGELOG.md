# Changelog

## [Unreleased]

### Added

- 工作台文档搜索与筛选（全部 / 我创建的 / 与我共享）
- 附件管理面板：列表、下载、删除；删除文档时清理存储文件
- 启动时检测未应用的数据库迁移（`dev:web` 启动脚本 fail-fast；Edge 安全的 `instrumentation.ts` 仅校验环境变量）
- `/api/health` 返回迁移状态；`pnpm db:check` 检测待执行迁移
- 注册页 GitHub 登录；OAuth 账号冲突友好提示
- 协作者/标题保存统一使用 `fetchJson`

- 文档导出 HTML / JSON（`GET /api/documents/[id]/export`）
- 版本快照预览（恢复前可查看历史内容）

### Added (earlier)

- 富文本：代码块、表格、任务列表、引用、分割线、高亮、删除线
- **附件插入**：PDF / Office / TXT / ZIP 等，自定义 `fileAttachment` 节点
- **工具栏升级**：段落样式下拉、表格编辑子栏，更接近飞书文档体验
- **图片上传**：TipTap Image 扩展、本地/S3 存储、`DocumentAttachment` 表、鉴权附件 API
- **Redis 协同扩展**：`REDIS_URL` 启用 `@hocuspocus/extension-redis`，Docker Compose 内置 Redis
- **公开只读分享链接**：所有者开启后生成 `/share/[token]`，访客无需登录即可查看
- 分享管理 API、`DocumentShareLink` 数据表、文档页分享面板
- 分享链接有效期设置（永久 / 7 / 30 / 90 天）及 PATCH 更新接口
- **版本历史**：`DocumentSnapshot` 表、自动/手动快照、恢复 API 与文档页面板
- **GitHub OAuth**（可选）：配置 `GITHUB_ID` / `GITHUB_SECRET` 后启用
- 工作台协作文档角色徽章（可编辑 / 仅查看）
- `fetchJson` 统一客户端请求封装
- 协同令牌到期前自动刷新（12 分钟周期）
- 分享过期、`fetchJson`、快照策略单元测试

### Changed

- 工作台改为 RSC 服务端拉取文档列表，消除首屏 loading 闪烁
- 工作台、分享面板、协同编辑器统一使用 `fetchJson` / `parseJsonResponse`
- `global-error` 改用 Tailwind 样式，与全局设计一致
- 文档列表查询抽取至 `src/lib/documents.ts`
- 移除未使用的 `uuid` 依赖

### Added (earlier)

- 路由级 `loading.tsx` / `docs/[id]/error.tsx` / `global-error.tsx`
- 协同令牌单元测试、编辑器断线重连与重试
- Dependabot（npm、GitHub Actions）
- Docker `web` 服务健康检查
- 登录接口频率限制（middleware）

### Changed

- PR 与 push 均运行 Docker 镜像构建校验
- 编辑器工具栏与链接输入布局优化

### Added (v0.2.0 batch)

- 协作者邀请 API 与管理面板（可编辑 / 仅查看）
- 只读模式：VIEWER 无法编辑标题与正文，协同服务 `readOnly` 鉴权
- 环境变量启动校验（`instrumentation.ts` + `src/lib/env.ts`）
- `/api/health` 健康检查
- 注册与协同令牌接口频率限制
- Vitest 单元测试与 CI `pnpm test`
- 安全响应头（`next.config.ts`）
- `/forbidden` 无权访问页

### Changed

- 协同令牌有效期缩短为 15 分钟，并携带 `access` 角色
- 协同连接时重新校验数据库权限
- 密码最少 8 位
- 工作台仅对所有者显示删除按钮
- CI/CD 合并为单一工作流

### Security

- 协同服务校验令牌角色并在连接时复查权限
- 文档状态持久化上限 5MB

## [0.1.0] - 2026-06-03

- 初始版本：用户认证、文档 CRUD、Yjs 实时协同、Docker 与 GitHub Actions
