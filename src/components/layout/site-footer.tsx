import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/40 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>Team Docs — 开源协同文档</p>
        <nav className="flex flex-wrap justify-center gap-4">
          <Link href="/docs/architecture" className="hover:text-foreground">
            架构
          </Link>
          <a
            href="https://github.com/jiaxiantao/team-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
