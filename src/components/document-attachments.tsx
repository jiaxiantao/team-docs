"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJson } from "@/lib/fetch-json";
import { formatFileSize, formatRelativeTime } from "@/lib/utils";
import { Download, Paperclip, Trash2 } from "lucide-react";

type AttachmentItem = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  uploadedBy: { name: string | null; email: string };
};

type DocumentAttachmentsProps = {
  documentId: string;
  canEdit: boolean;
};

export function DocumentAttachments({
  documentId,
  canEdit,
}: DocumentAttachmentsProps) {
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttachments = useCallback(async () => {
    const data = await fetchJson<{ attachments: AttachmentItem[] }>(
      `/api/documents/${documentId}/attachments`,
    );
    return data.attachments;
  }, [documentId]);

  useEffect(() => {
    let cancelled = false;

    void loadAttachments()
      .then((items) => {
        if (!cancelled) {
          setAttachments(items);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载附件失败");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadAttachments]);

  async function removeAttachment(id: string, filename: string) {
    if (!confirm(`确定删除附件「${filename}」？`)) return;
    setActing(true);
    setError(null);
    try {
      await fetchJson(`/api/attachments/${id}`, { method: "DELETE" });
      setAttachments((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setActing(false);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Paperclip className="h-4 w-4" />
          附件
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          文档内插入的图片与附件文件；删除后编辑器中的引用将失效。
        </p>

        {loading ? (
          <div className="h-12 animate-pulse rounded-lg bg-muted/50" />
        ) : attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无附件</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {attachments.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.filename}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatFileSize(item.size)} ·{" "}
                    {formatRelativeTime(new Date(item.createdAt))} ·{" "}
                    {item.uploadedBy.name ?? item.uploadedBy.email}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      下载
                    </a>
                  </Button>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={acting}
                      onClick={() => removeAttachment(item.id, item.filename)}
                    >
                      <Trash2 className="h-4 w-4" />
                      删除
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
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
