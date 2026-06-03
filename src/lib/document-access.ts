import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { roleMeetsMinimum } from "@/lib/role";

export async function getDocumentRole(
  userId: string,
  documentId: string,
): Promise<Role | null> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      collaborators: { where: { userId } },
    },
  });

  if (!doc) return null;
  if (doc.ownerId === userId) return Role.OWNER;

  const collab = doc.collaborators[0];
  return collab?.role ?? null;
}

export async function canAccessDocument(
  userId: string,
  documentId: string,
  minRole: Role = Role.VIEWER,
): Promise<boolean> {
  const role = await getDocumentRole(userId, documentId);
  if (!role) return false;
  return roleMeetsMinimum(role, minRole);
}

export async function canEditDocument(
  userId: string,
  documentId: string,
): Promise<boolean> {
  return canAccessDocument(userId, documentId, Role.EDITOR);
}

export async function isDocumentOwner(
  userId: string,
  documentId: string,
): Promise<boolean> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });
  return doc?.ownerId === userId;
}
