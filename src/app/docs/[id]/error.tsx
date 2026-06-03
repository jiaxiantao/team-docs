"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DocumentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="mb-4 h-10 w-10 text-destructive" />
      <h2 className="text-lg font-semibold">文档加载失败</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        无法打开该文档，请重试或返回工作台
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>重试</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">返回工作台</Link>
        </Button>
      </div>
    </div>
  );
}
