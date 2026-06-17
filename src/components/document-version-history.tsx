"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/fetch-json";
import { formatRelativeTime } from "@/lib/utils";
import { Eye, History, RotateCcw, Save, X } from "lucide-react";

type SnapshotItem = {
  id: string;
  title: string;
  label: string | null;
  source: "AUTO" | "MANUAL";
  createdAt: string;
  createdBy: { name: string | null; email: string } | null;
};

type DocumentVersionHistoryProps = {
  documentId: string;
  canEdit: boolean;
};

const SOURCE_LABELS: Record<SnapshotItem["source"], string> = {
  AUTO: "自动",
  MANUAL: "手动",
};

export function DocumentVersionHistory({
  documentId,
  canEdit,
}: DocumentVersionHistoryProps) {
  const router = useRouter();
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const reloadSnapshots = useCallback(async () => {
    const data = await fetchJson<{ snapshots: SnapshotItem[] }>(
      `/api/documents/${documentId}/snapshots`,
    );
    return data.snapshots;
  }, [documentId]);

  useEffect(() => {
    let cancelled = false;

    void reloadSnapshots()
      .then((items) => {
        if (!cancelled) {
          setSnapshots(items);
          setLoading(false);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载版本历史失败");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadSnapshots]);

  async function createSnapshot() {
    setActing(true);
    setError(null);
    try {
      const data = await fetchJson<{ snapshot: SnapshotItem }>(
        `/api/documents/${documentId}/snapshots`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: label.trim() || undefined,
          }),
        },
      );
      setSnapshots((prev) => [data.snapshot, ...prev].slice(0, 20));
      setLabel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建快照失败");
    } finally {
      setActing(false);
    }
  }

  async function previewSnapshot(snapshotId: string, snapshotLabel: string) {
    if (previewId === snapshotId) {
      setPreviewId(null);
      setPreviewHtml(null);
      setPreviewTitle(null);
      return;
    }

    setPreviewLoading(true);
    setPreviewId(snapshotId);
    setPreviewTitle(snapshotLabel);
    setPreviewHtml(null);
    setError(null);

    try {
      const data = await fetchJson<{
        snapshot: { html: string };
      }>(`/api/documents/${documentId}/snapshots/${snapshotId}`);
      setPreviewHtml(data.snapshot.html);
    } catch (err) {
      setPreviewId(null);
      setPreviewTitle(null);
      setError(err instanceof Error ? err.message : "加载预览失败");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function restoreSnapshot(snapshotId: string, snapshotLabel: string) {
    if (
      !confirm(
        `确定恢复到「${snapshotLabel}」？当前内容将被覆盖，页面将自动刷新。`,
      )
    ) {
      return;
    }

    setActing(true);
    setError(null);
    try {
      await fetchJson(
        `/api/documents/${documentId}/snapshots/${snapshotId}/restore`,
        { method: "POST" },
      );
      router.refresh();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "恢复快照失败");
      setActing(false);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          版本历史
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          编辑时每 30 分钟自动保存快照；也可手动创建快照并恢复到历史版本。
        </p>

        {canEdit && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="快照备注（可选）"
              className="h-9 max-w-xs text-sm"
              disabled={acting}
              maxLength={100}
            />
            <Button
              type="button"
              size="sm"
              onClick={createSnapshot}
              disabled={acting}
            >
              <Save className="h-4 w-4" />
              {acting ? "保存中…" : "创建快照"}
            </Button>
          </div>
        )}

        {loading ? (
          <div className="h-16 animate-pulse rounded-lg bg-muted/50" />
        ) : snapshots.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无历史版本</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {snapshots.map((snapshot) => (
              <li
                key={snapshot.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {snapshot.label ?? snapshot.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {SOURCE_LABELS[snapshot.source]} ·{" "}
                    {formatRelativeTime(new Date(snapshot.createdAt))}
                    {snapshot.createdBy &&
                      ` · ${snapshot.createdBy.name ?? snapshot.createdBy.email}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={acting || previewLoading}
                    onClick={() =>
                      previewSnapshot(
                        snapshot.id,
                        snapshot.label ?? snapshot.title,
                      )
                    }
                  >
                    {previewId === snapshot.id ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {previewId === snapshot.id ? "关闭" : "预览"}
                  </Button>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={acting}
                      onClick={() =>
                        restoreSnapshot(
                          snapshot.id,
                          snapshot.label ?? snapshot.title,
                        )
                      }
                    >
                      <RotateCcw className="h-4 w-4" />
                      恢复
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {previewId && (
          <div className="rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <p className="text-sm font-medium">
                预览：{previewTitle}
              </p>
              {previewLoading && (
                <span className="text-xs text-muted-foreground">加载中…</span>
              )}
            </div>
            {previewHtml && (
              <div
                className="prose prose-sm max-w-none px-4 py-3 dark:prose-invert [&_img]:max-w-full [&_table]:w-full"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            )}
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
