import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <FileQuestion className="mb-4 h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold">页面不存在</h1>
      <p className="mt-2 text-muted-foreground">
        您访问的页面可能已被删除或链接有误
      </p>
      <Button className="mt-8" asChild>
        <Link href="/">返回首页</Link>
      </Button>
    </div>
  );
}
