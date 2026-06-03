import { Suspense } from "react";
import { RegisterForm } from "./register-form";

function RegisterFallback() {
  return (
    <div className="flex w-full max-w-md items-center justify-center py-16 text-sm text-muted-foreground">
      加载中…
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
