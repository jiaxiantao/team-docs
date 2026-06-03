import { AppHeader } from "@/components/layout/app-header";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded bg-muted/70" />
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-xl border bg-muted/40"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
