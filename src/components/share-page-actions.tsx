import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

type SharePageActionsProps = {
  shareToken: string;
};

export async function SharePageActions({ shareToken }: SharePageActionsProps) {
  const session = await auth();
  const callbackUrl = encodeURIComponent(`/share/${shareToken}`);

  if (session?.user) {
    return (
      <Button variant="outline" size="sm" asChild className="shrink-0">
        <Link href="/dashboard">进入工作台</Link>
      </Button>
    );
  }

  return (
    <div className="flex shrink-0 gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/login?callbackUrl=${callbackUrl}`}>登录</Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/register?callbackUrl=${callbackUrl}`}>注册协作</Link>
      </Button>
    </div>
  );
}
