"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type DocumentTitleProps = {
  documentId: string;
  initialTitle: string;
  readOnly?: boolean;
  className?: string;
};

export function DocumentTitle({
  documentId,
  initialTitle,
  readOnly = false,
  className,
}: DocumentTitleProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTitle = useCallback(
    async (value: string) => {
      if (readOnly) return;
      const trimmed = value.trim() || "无标题文档";
      setSaving(true);
      setError(null);
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "保存失败");
        }
        setTitle(trimmed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "保存失败");
      } finally {
        setSaving(false);
      }
    },
    [documentId, readOnly],
  );

  if (readOnly) {
    return (
      <div className={cn("min-w-0", className)}>
        <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h1>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => saveTitle(title)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="w-full bg-transparent text-lg font-semibold tracking-tight outline-none placeholder:text-muted-foreground sm:text-xl"
        placeholder="无标题文档"
        aria-label="文档标题"
      />
      {(saving || error) && (
        <p
          className={cn(
            "mt-0.5 text-xs",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {error ?? "保存中…"}
        </p>
      )}
    </div>
  );
}
