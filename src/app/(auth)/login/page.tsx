import { Suspense } from "react";
import { isGitHubAuthEnabled } from "@/lib/github-auth";
import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <div className="flex w-full max-w-md items-center justify-center py-16 text-sm text-muted-foreground">
      加载中…
    </div>
  );
}

export default function LoginPage() {
  const githubEnabled = isGitHubAuthEnabled();

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm githubEnabled={githubEnabled} />
    </Suspense>
  );
}
