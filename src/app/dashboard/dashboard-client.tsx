"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/layout/app-header";
import { SignOutButton } from "@/components/sign-out-button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchJson } from "@/lib/fetch-json";
import type { SerializedDocumentListItem } from "@/lib/documents";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Plus, Trash2, FileText, AlertCircle, Search } from "lucide-react";

type DocumentRole = SerializedDocumentListItem["role"];
type FilterTab = "all" | "owned" | "shared";

const ROLE_LABELS: Record<Exclude<DocumentRole, "OWNER">, string> = {
  EDITOR: "可编辑",
  VIEWER: "仅查看",
};

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "owned", label: "我创建的" },
  { id: "shared", label: "与我共享" },
];

function RoleBadge({ role }: { role: DocumentRole }) {
  if (role === "OWNER") return null;

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
        role === "EDITOR"
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground",
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

type DashboardClientProps = {
  initialDocuments: SerializedDocumentListItem[];
  userId: string;
  userName: string | null;
  userEmail: string | null;
};

export function DashboardClient({
  initialDocuments,
  userId,
  userName,
  userEmail,
}: DashboardClientProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");

  const filteredDocuments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
      if (filter === "owned" && doc.ownerId !== userId) return false;
      if (filter === "shared" && doc.ownerId === userId) return false;
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.owner.email.toLowerCase().includes(q) ||
        (doc.owner.name?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [documents, filter, query, userId]);

  async function createDocument() {
    setCreating(true);
    setError(null);
    try {
      const { document } = await fetchJson<{ document: { id: string } }>(
        "/api/documents",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "无标题文档" }),
        },
      );
      router.push(`/docs/${document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建文档失败");
      setCreating(false);
    }
  }

  async function deleteDocument(id: string) {
    if (!confirm("确定删除该文档？此操作不可恢复。")) return;
    try {
      await fetchJson(`/api/documents/${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden max-w-[140px] truncate text-sm text-muted-foreground sm:inline">
            {userName ?? userEmail}
          </span>
          <SignOutButton />
        </div>
      </AppHeader>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">我的文档</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              创建文档，与团队实时协同编辑
            </p>
          </div>
          <Button onClick={createDocument} disabled={creating} className="shrink-0">
            <Plus className="h-4 w-4" />
            {creating ? "创建中…" : "新建文档"}
          </Button>
        </div>

        {documents.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索文档标题或所有者…"
                className="pl-9"
                aria-label="搜索文档"
              />
            </div>
            <div className="flex flex-wrap gap-1 rounded-lg border p-1">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    filter === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            className="mt-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <div className="mt-8">
          {documents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-14 text-center">
                <FileText className="mb-4 h-10 w-10 text-muted-foreground/60" />
                <p className="font-medium">还没有文档</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  创建第一篇文档，体验实时协同编辑
                </p>
                <Button className="mt-6" onClick={createDocument} disabled={creating}>
                  <Plus className="h-4 w-4" />
                  创建文档
                </Button>
              </CardContent>
            </Card>
          ) : filteredDocuments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                没有匹配的文档，试试其他关键词或筛选条件
              </CardContent>
            </Card>
          ) : (
            <ul className="grid gap-3">
              {filteredDocuments.map((doc) => (
                <li key={doc.id}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center gap-4 p-4">
                      <Link
                        href={`/docs/${doc.id}`}
                        className="flex min-w-0 flex-1 gap-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium">{doc.title}</p>
                            <RoleBadge role={doc.role} />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            更新于 {formatRelativeTime(new Date(doc.updatedAt))}
                            {doc.owner.email !== userEmail &&
                              ` · ${doc.owner.name ?? doc.owner.email}`}
                          </p>
                        </div>
                      </Link>
                      {doc.ownerId === userId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteDocument(doc.id)}
                          aria-label="删除文档"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
