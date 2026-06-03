"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type DocumentTitleProps = {
  documentId: string;
  initialTitle: string;
  className?: string;
};

export function DocumentTitle({
  documentId,
  initialTitle,
  className,
}: DocumentTitleProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);

  const saveTitle = useCallback(
    async (value: string) => {
      const trimmed = value.trim() || "无标题文档";
      setSaving(true);
      try {
        await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed }),
        });
      } finally {
        setSaving(false);
      }
    },
    [documentId],
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => saveTitle(title)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground"
        placeholder="无标题文档"
      />
      {saving && (
        <span className="text-xs text-muted-foreground shrink-0">保存中…</span>
      )}
    </div>
  );
}
