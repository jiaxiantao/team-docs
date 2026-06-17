import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DocumentListItem = {
  id: string;
  title: string;
  updatedAt: Date;
  createdAt: Date;
  ownerId: string;
  role: Role;
  owner: { name: string | null; email: string };
};

export type SerializedDocumentListItem = Omit<
  DocumentListItem,
  "updatedAt" | "createdAt"
> & {
  updatedAt: string;
  createdAt: string;
};

export function serializeDocumentListItem(
  doc: DocumentListItem,
): SerializedDocumentListItem {
  return {
    ...doc,
    updatedAt: doc.updatedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function listDocumentsForUser(
  userId: string,
): Promise<DocumentListItem[]> {
  const rows = await prisma.document.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { collaborators: { some: { userId } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true,
      ownerId: true,
      owner: { select: { name: true, email: true } },
      collaborators: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  return rows.map(({ collaborators, ...doc }) => ({
    ...doc,
    role:
      doc.ownerId === userId
        ? ("OWNER" as const)
        : (collaborators[0]?.role ?? "VIEWER"),
  }));
}
