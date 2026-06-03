import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { colorForUserId } from "@/lib/collab-token";
import { canAccessDocument } from "@/lib/document-access";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/app-header";
import { DocumentTitle } from "@/components/document-title";
import { CollaborativeEditor } from "@/components/editor/collaborative-editor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const allowed = await canAccessDocument(session.user.id, id);
  if (!allowed) notFound();

  const document = await prisma.document.findUnique({
    where: { id },
    select: { id: true, title: true },
  });

  if (!document) notFound();

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
            className="min-w-0 flex-1"
          />
        </div>
      </AppHeader>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <CollaborativeEditor documentId={document.id} user={user} />
      </main>
    </div>
  );
}
