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

/** 根据天数计算分享过期时间；null 表示永久有效 */
export function computeShareExpiresAt(
  expiresInDays: number | null,
): Date | null {
  if (expiresInDays === null || expiresInDays <= 0) return null;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  return expiresAt;
}

export function isShareExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return expiresAt < new Date();
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
