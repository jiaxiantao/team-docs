import { AppHeader } from "@/components/layout/app-header";

export default function ShareLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader sticky className="border-b" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 h-8 w-2/3 max-w-md animate-pulse rounded-lg bg-muted" />
        <div className="h-[52px] animate-pulse rounded-xl border bg-muted/40" />
        <div className="mt-4 min-h-[50vh] animate-pulse rounded-xl border bg-muted/30" />
      </main>
    </div>
  );
}
