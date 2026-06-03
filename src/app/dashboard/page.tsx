"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/app-header";
import { SignOutButton } from "@/components/sign-out-button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, FileText, AlertCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

type DocumentItem = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  owner: { name: string | null; email: string };
};

async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch("/api/documents");
  if (res.status === 401) {
    throw new Error("__UNAUTHORIZED__");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "加载失败"
    );
  }
  const data = await res.json();
  return data.documents as DocumentItem[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const applyDocuments = useCallback((docs: DocumentItem[]) => {
    setDocuments(docs);
    setError(null);
    setLoading(false);
  }, []);

  const applyError = useCallback((message: string) => {
    setError(message);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchDocuments()
      .then((docs) => {
        if (!cancelled) applyDocuments(docs);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof Error && err.message === "__UNAUTHORIZED__") {
          router.push("/login?callbackUrl=/dashboard");
          return;
        }
        applyError(
          err instanceof Error ? err.message : "无法加载文档列表"
        );
      });

    return () => {
      cancelled = true;
    };
  }, [router, applyDocuments, applyError]);

  const retryLoad = useCallback(() => {
    setLoading(true);
    fetchDocuments()
      .then(applyDocuments)
      .catch((err: unknown) => {
        if (err instanceof Error && err.message === "__UNAUTHORIZED__") {
          router.push("/login?callbackUrl=/dashboard");
          return;
        }
        applyError(
          err instanceof Error ? err.message : "无法加载文档列表"
        );
      });
  }, [router, applyDocuments, applyError]);

  async function createDocument() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "无标题文档" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "创建失败");
      }
      const { document } = await res.json();
      router.push(`/docs/${document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建文档失败");
      setCreating(false);
    }
  }

  async function deleteDocument(id: string) {
    if (!confirm("确定删除该文档？此操作不可恢复。")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "删除失败");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden max-w-[140px] truncate text-sm text-muted-foreground sm:inline">
            {session?.user?.name ?? session?.user?.email}
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

        {error && (
          <div
            className="mt-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button variant="ghost" size="sm" onClick={retryLoad}>
              重试
            </Button>
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[72px] animate-pulse rounded-xl border bg-muted/40"
                />
              ))}
            </div>
          ) : documents.length === 0 ? (
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
          ) : (
            <ul className="grid gap-3">
              {documents.map((doc) => (
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
                          <p className="truncate font-medium">{doc.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            更新于 {formatRelativeTime(new Date(doc.updatedAt))}
                            {doc.owner.email !== session?.user?.email &&
                              ` · ${doc.owner.name ?? doc.owner.email}`}
                          </p>
                        </div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteDocument(doc.id)}
                        aria-label="删除文档"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
