import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  listDocumentsForUser,
  serializeDocumentListItem,
} from "@/lib/documents";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const documents = await listDocumentsForUser(session.user.id);

  return (
    <DashboardClient
      initialDocuments={documents.map(serializeDocumentListItem)}
      userId={session.user.id}
      userName={session.user.name ?? null}
      userEmail={session.user.email ?? null}
    />
  );
}
