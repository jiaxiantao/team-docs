import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "技术架构 — Team Docs",
  description: "Team Docs 协同文档系统技术架构说明",
};

const stack = [
  ["前端", "Next.js 16 + React 19", "App Router、API Routes、认证中间件"],
  ["编辑器", "Tiptap 3 + ProseMirror", "富文本编辑与工具栏"],
  ["协同", "Yjs + Hocuspocus", "冲突自由合并，实时同步"],
  ["数据库", "PostgreSQL + Prisma", "用户、文档元数据、Yjs 状态"],
  ["认证", "Auth.js (NextAuth v5)", "JWT 会话 + 协同 HMAC 令牌"],
  ["部署", "Docker Compose", "Web + Collab + Postgres"],
  ["CI/CD", "GitHub Actions", "Lint、迁移、构建、镜像发布"],
] as const;

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            Team Docs
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">技术架构</h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Team Docs 是基于 CRDT 的在线协同文档系统，采用前后端分离 +
            WebSocket 协同服务 + PostgreSQL 持久化的架构。
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">技术栈</h2>
          <div className="overflow-x-auto rounded-xl border">
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
          </div>
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

        <section className="text-sm text-muted-foreground">
          完整开发与部署说明见{" "}
          <a
            href="https://github.com/jiaxiantao/team-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GitHub 仓库 README
          </a>
          。
        </section>
      </main>
    </div>
  );
}
