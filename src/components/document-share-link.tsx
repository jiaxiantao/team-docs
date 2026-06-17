"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/fetch-json";
import { formatShareExpiry } from "@/lib/utils";
import { Check, Copy, Link2, RefreshCw } from "lucide-react";

type ShareInfo = {
  enabled: boolean;
  token: string;
  url: string;
  expiresAt: string | null;
  createdAt: string;
};

type ExpiryOption = "never" | "7" | "30" | "90";

const EXPIRY_OPTIONS: { value: ExpiryOption; label: string }[] = [
  { value: "never", label: "永久有效" },
  { value: "7", label: "7 天" },
  { value: "30", label: "30 天" },
  { value: "90", label: "90 天" },
];

function expiryOptionFromShare(share: ShareInfo | null): ExpiryOption {
  if (!share?.expiresAt) return "never";
  const days = Math.ceil(
    (new Date(share.expiresAt).getTime() - Date.now()) / 86_400_000,
  );
  if (days <= 7) return "7";
  if (days <= 30) return "30";
  return "90";
}

function expiresInDaysFromOption(option: ExpiryOption): number | null {
  if (option === "never") return null;
  return Number(option);
}

type DocumentShareLinkProps = {
  documentId: string;
};

export function DocumentShareLink({ documentId }: DocumentShareLinkProps) {
  const [share, setShare] = useState<ShareInfo | null>(null);
  const [expiryOption, setExpiryOption] = useState<ExpiryOption>("never");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const applyShare = useCallback((data: ShareInfo | null) => {
    setShare(data);
    setExpiryOption(expiryOptionFromShare(data));
    setLoading(false);
  }, []);

  const applyError = useCallback((message: string) => {
    setError(message);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchJson<{ share: ShareInfo | null }>(`/api/documents/${documentId}/share`)
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
      const data = await fetchJson<{ share: ShareInfo }>(
        `/api/documents/${documentId}/share`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled: true,
            expiresInDays: expiresInDaysFromOption(expiryOption),
          }),
        },
      );
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
      await fetchJson(`/api/documents/${documentId}/share`, {
        method: "DELETE",
      });
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
      const data = await fetchJson<{ share: ShareInfo }>(
        `/api/documents/${documentId}/share`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled: true,
            regenerate: true,
            expiresInDays: expiresInDaysFromOption(expiryOption),
          }),
        },
      );
      setShare(data.share);
    } catch (err) {
      setError(err instanceof Error ? err.message : "重置失败");
    } finally {
      setActing(false);
    }
  }

  async function updateExpiry(option: ExpiryOption) {
    setExpiryOption(option);
    if (!share?.enabled) return;

    setActing(true);
    setError(null);
    try {
      const data = await fetchJson<{ share: ShareInfo }>(
        `/api/documents/${documentId}/share`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expiresInDays: expiresInDaysFromOption(option),
          }),
        },
      );
      setShare(data.share);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新有效期失败");
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">链接有效期</span>
              <select
                value={expiryOption}
                onChange={(e) => setExpiryOption(e.target.value as ExpiryOption)}
                className="h-9 rounded-md border bg-background px-3 text-sm"
                disabled={acting}
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" onClick={enableShare} disabled={acting}>
              {acting ? "开启中…" : "开启公开分享"}
            </Button>
          </div>
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

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">有效期</span>
                <select
                  value={expiryOption}
                  onChange={(e) =>
                    void updateExpiry(e.target.value as ExpiryOption)
                  }
                  className="h-8 rounded-md border bg-background px-2 text-sm"
                  disabled={acting}
                >
                  {EXPIRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <span className="text-xs text-muted-foreground">
                {formatShareExpiry(share.expiresAt)}
              </span>
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
