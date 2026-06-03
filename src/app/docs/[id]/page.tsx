import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { colorForUserId } from "@/lib/collab-token";
import { canAccessDocument } from "@/lib/document-access";
import { prisma } from "@/lib/prisma";
import { DocumentTitle } from "@/components/document-title";
import { CollaborativeEditor } from "@/components/editor/collaborative-editor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <DocumentTitle
            key={document.id + document.title}
            documentId={document.id}
            initialTitle={document.title}
            className="flex-1"
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <CollaborativeEditor
          documentId={document.id}
          user={user}
        />
      </main>
    </div>
  );
}
