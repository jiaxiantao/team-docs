"use client";

import "./globals.css";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen items-center justify-center bg-background p-4 font-sans antialiased">
        <div className="max-w-md text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" />
          <h1 className="text-xl font-semibold text-foreground">应用出错</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error.message || "发生意外错误"}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
