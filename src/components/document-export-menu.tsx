"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { parseContentDispositionFilename } from "@/lib/content-disposition";
import { Download } from "lucide-react";

type DocumentExportMenuProps = {
  documentId: string;
};

async function downloadExport(documentId: string, format: "html" | "json") {
  const response = await fetch(
    `/api/documents/${documentId}/export?format=${format}`,
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? "导出失败");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filename =
    parseContentDispositionFilename(disposition) ?? `document.${format}`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DocumentExportMenu({ documentId }: DocumentExportMenuProps) {
  const [loading, setLoading] = useState<"html" | "json" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(format: "html" | "json") {
    setLoading(format);
    setError(null);
    try {
      await downloadExport(documentId, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : "导出失败");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => void handleExport("html")}
        >
          <Download className="h-4 w-4" />
          {loading === "html" ? "导出中…" : "HTML"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => void handleExport("json")}
        >
          <Download className="h-4 w-4" />
          {loading === "json" ? "导出中…" : "JSON"}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
