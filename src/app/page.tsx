import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/app-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Zap, Shield } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader className="bg-card/50">
        <nav className="flex items-center gap-2">
          {session ? (
            <Button asChild size="sm">
              <Link href="/dashboard">进入工作台</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">登录</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">免费注册</Link>
              </Button>
            </>
          )}
        </nav>
      </AppHeader>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6 sm:py-28">
          <div className="mb-6 inline-flex items-center rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
            Next.js · PostgreSQL · Yjs · Docker
          </div>
          <h1 className="flex flex-col items-center gap-2 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            <span className="text-balance">团队协同文档</span>
            <span className="text-primary whitespace-nowrap">
              实时如同面对面
            </span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            基于 CRDT 的冲突自由合并，多人同时编辑同一文档，光标与选区实时可见。
            支持 Docker 一键部署与 GitHub Actions CI/CD。
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
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

        <section className="border-t bg-muted/30 py-16 sm:py-20">
          <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 sm:grid-cols-3 sm:px-6">
            <Feature
              icon={Zap}
              title="毫秒级同步"
              description="Hocuspocus + Yjs 提供实时协同体验"
            />
            <Feature
              icon={Users}
              title="多人光标"
              description="协作者光标与昵称彩色展示，在线人数实时更新"
            />
            <Feature
              icon={Shield}
              title="生产就绪"
              description="PostgreSQL 持久化、Docker Compose、CI/CD"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-border/80 bg-card/80">
      <CardContent className="p-6">
        <Icon className="mb-4 h-8 w-8 text-primary" aria-hidden />
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
