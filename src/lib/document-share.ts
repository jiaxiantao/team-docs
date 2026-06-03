import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export function generateShareToken(): string {
  return randomBytes(24).toString("base64url");
}

export function buildPublicSharePath(token: string): string {
  return `/share/${token}`;
}

export function buildPublicShareUrl(token: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}${buildPublicSharePath(token)}`;
}

export async function findActiveShareByToken(token: string) {
  const link = await prisma.documentShareLink.findUnique({
    where: { token },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!link || !link.enabled) return null;
  if (link.expiresAt && link.expiresAt < new Date()) return null;

  return link;
}

export async function findActiveShareByDocumentId(documentId: string) {
  const link = await prisma.documentShareLink.findUnique({
    where: { documentId },
  });

  if (!link || !link.enabled) return null;
  if (link.expiresAt && link.expiresAt < new Date()) return null;

  return link;
}
