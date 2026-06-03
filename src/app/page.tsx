import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { FileText, Users, Zap, Shield } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <FileText className="h-6 w-6 text-primary" />
            Team Docs
          </Link>
          <nav className="flex items-center gap-3">
            {session ? (
              <Button asChild>
                <Link href="/dashboard">进入工作台</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">登录</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">免费注册</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
          <div className="mb-4 inline-flex items-center rounded-full border bg-card px-4 py-1 text-sm text-muted-foreground">
            Next.js · PostgreSQL · Yjs · Docker
          </div>
          <h1 className="flex flex-col items-center gap-2 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-balance">团队协同文档</span>
            <span className="text-primary whitespace-nowrap">
              实时如同面对面
            </span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            基于 CRDT 的冲突自由合并，多人同时编辑同一文档，光标与选区实时可见。
            支持 Docker 一键部署与 GitHub Actions CI/CD。
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href={session ? "/dashboard" : "/register"}>
                {session ? "我的文档" : "立即开始"}
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/docs/architecture">查看架构说明</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-card/30 py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
            <Feature
              icon={Zap}
              title="毫秒级同步"
              description="Hocuspocus + Yjs 提供飞书级实时协同体验"
            />
            <Feature
              icon={Users}
              title="多人光标"
              description="协作者光标与昵称彩色展示，在线人数实时更新"
            />
            <Feature
              icon={Shield}
              title="生产就绪"
              description="PostgreSQL 持久化、Docker Compose、CI/CD 流水线"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <Icon className="mb-4 h-8 w-8 text-primary" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
