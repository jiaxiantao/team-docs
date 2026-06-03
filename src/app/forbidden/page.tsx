import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "无权访问 — Team Docs",
};

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <ShieldAlert className="mb-4 h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold">无权访问</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        你没有查看该文档的权限。请联系文档所有者邀请你协作。
      </p>
      <Button className="mt-8" asChild>
        <Link href="/dashboard">返回工作台</Link>
      </Button>
    </div>
  );
}
