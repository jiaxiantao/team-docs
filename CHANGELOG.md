# Changelog

## [Unreleased]

### Added

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
