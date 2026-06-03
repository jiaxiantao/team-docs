# 安全策略

## 报告漏洞

请勿在公开 Issue 中披露安全漏洞。请通过 GitHub Security Advisories 私下报告：

https://github.com/jiaxiantao/team-docs/security/advisories/new

我们会在合理时间内确认并修复。

## 范围

- 认证与会话管理
- 未授权访问文档或 API
- 协同服务令牌伪造
- SQL 注入与敏感信息泄露

## 最佳实践（部署方）

- 修改默认 `AUTH_SECRET` 与 `COLLAB_SECRET`
- 生产环境使用 HTTPS / WSS
- 限制数据库与协同端口的网络访问
