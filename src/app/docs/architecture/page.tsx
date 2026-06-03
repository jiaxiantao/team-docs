import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "技术架构 — Team Docs",
  description: "Team Docs 协同文档系统技术架构说明",
};

const stack = [
  ["前端", "Next.js 16 + React 19", "App Router、API Routes、Edge-safe 中间件"],
  ["编辑器", "Tiptap 3 + ProseMirror", "富文本编辑与工具栏"],
  ["协同", "Yjs + Hocuspocus 3", "冲突自由合并，WebSocket 实时同步"],
  ["数据库", "PostgreSQL + Prisma", "用户、文档元数据、Yjs 二进制状态"],
  ["认证", "Auth.js (NextAuth v5)", "JWT 会话 + 协同 HMAC 令牌"],
  ["部署", "Docker Compose", "Web + Collab + Postgres"],
  ["CI/CD", "GitHub Actions", "Lint、Typecheck、构建、Docker 镜像"],
] as const;

export default function ArchitecturePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">返回首页</Link>
        </Button>
      </AppHeader>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">技术架构</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Team Docs 是基于 CRDT 的在线协同文档系统，采用前后端分离 +
            WebSocket 协同服务 + PostgreSQL 持久化。
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">技术栈</h2>
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">层级</th>
                    <th className="px-4 py-3 text-left font-medium">技术</th>
                    <th className="px-4 py-3 text-left font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {stack.map(([layer, tech, desc]) => (
                    <tr key={layer} className="border-t">
                      <td className="px-4 py-3 font-medium">{layer}</td>
                      <td className="px-4 py-3">{tech}</td>
                      <td className="px-4 py-3 text-muted-foreground">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">数据流</h2>
          <pre className="overflow-x-auto rounded-xl border bg-card p-4 text-xs leading-relaxed sm:text-sm">
{`┌─────────────┐     WebSocket      ┌──────────────────┐
│  Next.js    │ ◄────────────────► │ Hocuspocus       │
│  (Tiptap)   │     Yjs updates    │ collab-server    │
└──────┬──────┘                    └────────┬─────────┘
       │ REST API                          │
       ▼                                     ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL (team_docs)                  │
│  User · Document · DocumentState (Yjs binary)       │
└─────────────────────────────────────────────────────┘`}
          </pre>
        </section>

        <p className="text-sm text-muted-foreground">
          完整开发与部署说明见{" "}
          <a
            href="https://github.com/jiaxiantao/team-docs"
            className="font-medium text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub 仓库 README
          </a>
          与{" "}
          <a
            href="https://github.com/jiaxiantao/team-docs/blob/main/CONTRIBUTING.md"
            className="font-medium text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            CONTRIBUTING.md
          </a>
          。
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
