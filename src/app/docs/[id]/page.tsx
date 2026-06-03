import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { colorForUserId } from "@/lib/collab-token";
import {
  canEditDocument,
  getDocumentRole,
  isDocumentOwner,
} from "@/lib/document-access";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/app-header";
import { DocumentTitle } from "@/components/document-title";
import { DocumentCollaborators } from "@/components/document-collaborators";
import { CollaborativeEditor } from "@/components/editor/collaborative-editor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      owner: { select: { id: true, name: true, email: true } },
      collaborators: {
        select: {
          role: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!document) notFound();

  const role = await getDocumentRole(session.user.id, id);
  if (!role) redirect("/forbidden");

  const canEdit = await canEditDocument(session.user.id, id);
  const canManage = await isDocumentOwner(session.user.id, id);

  const user = {
    id: session.user.id,
    name: session.user.name ?? session.user.email ?? "用户",
    color: colorForUserId(session.user.id),
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader sticky className="border-b">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href="/dashboard" aria-label="返回文档列表">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <DocumentTitle
            key={`${document.id}-${document.title}`}
            documentId={document.id}
            initialTitle={document.title}
            readOnly={!canEdit}
            className="min-w-0 flex-1"
          />
        </div>
      </AppHeader>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {!canEdit && (
          <div
            className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-100"
            role="status"
          >
            <Eye className="h-4 w-4 shrink-0" />
            你正在以只读模式查看此文档
          </div>
        )}

        <CollaborativeEditor
          documentId={document.id}
          user={user}
          readOnly={!canEdit}
        />

        <DocumentCollaborators
          documentId={document.id}
          owner={document.owner}
          collaborators={document.collaborators}
          canManage={canManage}
        />
      </main>
    </div>
  );
}
