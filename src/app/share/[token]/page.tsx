import { notFound } from "next/navigation";
import { findActiveShareByToken } from "@/lib/document-share";
import { CollaborativeEditor } from "@/components/editor/collaborative-editor";
import { AppHeader } from "@/components/layout/app-header";
import { SharePageActions } from "@/components/share-page-actions";
import { Eye } from "lucide-react";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const link = await findActiveShareByToken(token);
  return {
    title: link
      ? `${link.document.title} — 公开分享`
      : "分享链接无效 — Team Docs",
  };
}

export default async function PublicSharePage({ params }: PageProps) {
  const { token } = await params;
  const link = await findActiveShareByToken(token);

  if (!link) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader sticky className="border-b">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <h1 className="truncate text-lg font-semibold sm:text-xl">
            {link.document.title}
          </h1>
          <SharePageActions shareToken={token} />
        </div>
      </AppHeader>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div
          className="mb-4 flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-950 dark:text-blue-100"
          role="status"
        >
          <Eye className="h-4 w-4 shrink-0" />
          公开只读分享 — 无需登录，内容不可编辑
        </div>

        <CollaborativeEditor
          documentId={link.document.id}
          readOnly
          shareToken={token}
        />
      </main>
    </div>
  );
}
