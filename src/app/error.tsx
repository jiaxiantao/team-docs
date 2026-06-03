"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
      <h1 className="text-2xl font-bold">出错了</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        应用遇到意外错误，请重试或返回首页
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>重试</Button>
        <Button variant="outline" asChild>
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    </div>
  );
}
