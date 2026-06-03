"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, Link2, RefreshCw } from "lucide-react";

type ShareInfo = {
  enabled: boolean;
  token: string;
  url: string;
  expiresAt: string | null;
  createdAt: string;
};

type DocumentShareLinkProps = {
  documentId: string;
};

export function DocumentShareLink({ documentId }: DocumentShareLinkProps) {
  const [share, setShare] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const applyShare = useCallback((data: ShareInfo | null) => {
    setShare(data);
    setLoading(false);
  }, []);

  const applyError = useCallback((message: string) => {
    setError(message);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/documents/${documentId}/share`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            typeof data.error === "string" ? data.error : "加载失败",
          );
        }
        return res.json() as Promise<{ share: ShareInfo | null }>;
      })
      .then((data) => {
        if (!cancelled) applyShare(data.share);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          applyError(
            err instanceof Error ? err.message : "加载分享设置失败",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [documentId, applyShare, applyError]);

  async function enableShare() {
    setActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "开启失败");
      setShare(data.share);
    } catch (err) {
      setError(err instanceof Error ? err.message : "开启失败");
    } finally {
      setActing(false);
    }
  }

  async function disableShare() {
    setActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "关闭失败");
      setShare((prev) => (prev ? { ...prev, enabled: false } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "关闭失败");
    } finally {
      setActing(false);
    }
  }

  async function regenerate() {
    setActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true, regenerate: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "重置失败");
      setShare(data.share);
    } catch (err) {
      setError(err instanceof Error ? err.message : "重置失败");
    } finally {
      setActing(false);
    }
  }

  async function copyUrl() {
    if (!share?.url) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("无法复制到剪贴板");
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4" />
          公开分享（只读）
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          生成链接后，任何人无需登录即可只读查看文档内容。
        </p>

        {loading ? (
          <div className="h-10 animate-pulse rounded-lg bg-muted/50" />
        ) : !share || !share.enabled ? (
          <Button type="button" onClick={enableShare} disabled={acting}>
            {acting ? "开启中…" : "开启公开分享"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 truncate rounded-lg border bg-muted/40 px-3 py-2 text-xs">
                {share.url}
              </code>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={copyUrl}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "已复制" : "复制"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={regenerate}
                  disabled={acting}
                  title="重置后旧链接将失效"
                >
                  <RefreshCw className="h-4 w-4" />
                  重置
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={disableShare}
              disabled={acting}
            >
              关闭公开分享
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
