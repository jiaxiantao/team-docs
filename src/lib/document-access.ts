import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function canAccessDocument(
  userId: string,
  documentId: string,
  minRole: Role = Role.VIEWER,
): Promise<boolean> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      collaborators: { where: { userId } },
    },
  });

  if (!doc) return false;
  if (doc.ownerId === userId) return true;

  const collab = doc.collaborators[0];
  if (!collab) return false;

  const rank: Record<Role, number> = {
    VIEWER: 1,
    EDITOR: 2,
    OWNER: 3,
  };

  return rank[collab.role] >= rank[minRole];
}

export async function canEditDocument(
  userId: string,
  documentId: string,
): Promise<boolean> {
  return canAccessDocument(userId, documentId, Role.EDITOR);
}
