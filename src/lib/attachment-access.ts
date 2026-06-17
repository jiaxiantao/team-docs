import { auth } from "@/auth";
import { canAccessDocument } from "@/lib/document-access";
import { findActiveShareByDocumentId } from "@/lib/document-share";
import { prisma } from "@/lib/prisma";

export async function canViewAttachment(
  attachmentId: string,
): Promise<{
  allowed: boolean;
  attachment: {
    id: string;
    documentId: string;
    storageKey: string;
    mimeType: string;
    filename: string;
  } | null;
}> {
  const attachment = await prisma.documentAttachment.findUnique({
    where: { id: attachmentId },
    select: {
      id: true,
      documentId: true,
      storageKey: true,
      mimeType: true,
      filename: true,
    },
  });

  if (!attachment) {
    return { allowed: false, attachment: null };
  }

  const session = await auth();
  if (session?.user?.id) {
    const allowed = await canAccessDocument(
      session.user.id,
      attachment.documentId,
    );
    if (allowed) {
      return { allowed: true, attachment };
    }
  }

  const share = await findActiveShareByDocumentId(attachment.documentId);
  if (share) {
    return { allowed: true, attachment };
  }

  return { allowed: false, attachment };
}
