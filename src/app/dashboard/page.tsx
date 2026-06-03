"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, LogOut, Plus, Trash2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

type DocumentItem = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  owner: { name: string | null; email: string };
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/documents");
      if (!cancelled && res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function createDocument() {
    setCreating(true);
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "无标题文档" }),
    });
    setCreating(false);

    if (res.ok) {
      const { document } = await res.json();
      router.push(`/docs/${document.id}`);
    }
  }

  async function deleteDocument(id: string) {
    if (!confirm("确定删除该文档？此操作不可恢复。")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            Team Docs
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {session?.user?.name ?? session?.user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">我的文档</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              创建文档并邀请团队成员实时协作编辑
            </p>
          </div>
          <Button onClick={createDocument} disabled={creating}>
            <Plus className="h-4 w-4" />
            {creating ? "创建中…" : "新建文档"}
          </Button>
        </div>

        <div className="mt-8">
          {loading ? (
            <p className="text-muted-foreground">加载中…</p>
          ) : documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center">
              <p className="text-muted-foreground">还没有文档，点击上方按钮创建</p>
              <Button className="mt-4" onClick={createDocument}>
                <Plus className="h-4 w-4" />
                创建第一篇文档
              </Button>
            </div>
          ) : (
            <ul className="grid gap-3">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="group flex items-center justify-between rounded-xl border bg-card px-5 py-4 transition-shadow hover:shadow-md"
                >
                  <Link href={`/docs/${doc.id}`} className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      更新于 {formatRelativeTime(new Date(doc.updatedAt))}
                      {doc.owner.email !== session?.user?.email &&
                        ` · ${doc.owner.name ?? doc.owner.email}`}
                    </p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
