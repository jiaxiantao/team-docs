import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Link2Off } from "lucide-react";

export default function ShareNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Link2Off className="mb-4 h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold">分享链接无效</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        链接可能已关闭、已过期或已被重置。请联系文档所有者获取新链接。
      </p>
      <Button className="mt-8" asChild>
        <Link href="/">返回首页</Link>
      </Button>
    </div>
  );
}
