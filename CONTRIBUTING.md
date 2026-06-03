# 贡献指南

感谢你对 Team Docs 的关注！欢迎通过 Issue 与 Pull Request 参与贡献。

## 开发环境

- Node.js 22+
- pnpm 9+
- PostgreSQL 16（本地或 Docker）

```bash
corepack enable
cp .env.example .env
pnpm install
pnpm run db:migrate
pnpm run db:seed
pnpm dev
```

## 提交规范

- 使用清晰的中文或英文 commit message
- 一个 PR 聚焦一类改动
- 确保通过：`pnpm run lint`、`pnpm run typecheck`、`pnpm run build`

## Pull Request 流程

1. Fork 仓库并创建分支
2. 完成改动并自测（注册、登录、创建文档、协同编辑、退出登录）
3. 提交 PR，说明改动动机与测试方式

## 报告问题

请使用 [GitHub Issues](https://github.com/jiaxiantao/team-docs/issues)，并附上：

- 复现步骤
- 期望与实际行为
- 环境信息（OS、Node 版本、浏览器）
