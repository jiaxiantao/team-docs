import Link from "next/link";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  children?: React.ReactNode;
  className?: string;
  sticky?: boolean;
};

export function AppHeader({ children, className, sticky }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60",
        sticky && "sticky top-0 z-20",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
        >
          <FileText className="h-5 w-5 text-primary" />
          <span>Team Docs</span>
        </Link>
        {children}
      </div>
    </header>
  );
}
