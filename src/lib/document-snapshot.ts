import type { SnapshotSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const MAX_SNAPSHOTS_PER_DOCUMENT = 20;
export const AUTO_SNAPSHOT_INTERVAL_MS = 30 * 60 * 1000;

export type SnapshotListItem = {
  id: string;
  title: string;
  label: string | null;
  source: SnapshotSource;
  createdAt: Date;
  createdBy: { name: string | null; email: string } | null;
};

export async function pruneDocumentSnapshots(documentId: string) {
  const count = await prisma.documentSnapshot.count({
    where: { documentId },
  });
  if (count <= MAX_SNAPSHOTS_PER_DOCUMENT) return;

  const excess = count - MAX_SNAPSHOTS_PER_DOCUMENT;
  const oldest = await prisma.documentSnapshot.findMany({
    where: { documentId },
    orderBy: { createdAt: "asc" },
    take: excess,
    select: { id: true },
  });

  await prisma.documentSnapshot.deleteMany({
    where: { id: { in: oldest.map((row) => row.id) } },
  });
}

export async function createDocumentSnapshot(params: {
  documentId: string;
  state: Uint8Array;
  title: string;
  label?: string | null;
  source: SnapshotSource;
  createdById?: string | null;
}) {
  const snapshot = await prisma.documentSnapshot.create({
    data: {
      documentId: params.documentId,
      state: Buffer.from(params.state),
      title: params.title,
      label: params.label ?? null,
      source: params.source,
      createdById: params.createdById ?? null,
    },
    select: {
      id: true,
      title: true,
      label: true,
      source: true,
      createdAt: true,
      createdBy: { select: { name: true, email: true } },
    },
  });

  await pruneDocumentSnapshots(params.documentId);
  return snapshot;
}

export async function listDocumentSnapshots(
  documentId: string,
): Promise<SnapshotListItem[]> {
  return prisma.documentSnapshot.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    take: MAX_SNAPSHOTS_PER_DOCUMENT,
    select: {
      id: true,
      title: true,
      label: true,
      source: true,
      createdAt: true,
      createdBy: { select: { name: true, email: true } },
    },
  });
}

export function isAutoSnapshotDue(
  lastCreatedAt: Date | null,
  now = Date.now(),
): boolean {
  if (!lastCreatedAt) return true;
  return now - lastCreatedAt.getTime() >= AUTO_SNAPSHOT_INTERVAL_MS;
}

export async function shouldCreateAutoSnapshot(
  documentId: string,
  now = Date.now(),
): Promise<boolean> {
  const last = await prisma.documentSnapshot.findFirst({
    where: { documentId, source: "AUTO" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  return isAutoSnapshotDue(last?.createdAt ?? null, now);
}

export async function restoreDocumentSnapshot(
  documentId: string,
  snapshotId: string,
) {
  const snapshot = await prisma.documentSnapshot.findFirst({
    where: { id: snapshotId, documentId },
  });
  if (!snapshot) return null;

  await prisma.$transaction([
    prisma.documentState.upsert({
      where: { documentId },
      create: {
        documentId,
        state: snapshot.state,
      },
      update: {
        state: snapshot.state,
        updatedAt: new Date(),
      },
    }),
    prisma.document.update({
      where: { id: documentId },
      data: {
        title: snapshot.title,
        updatedAt: new Date(),
      },
    }),
  ]);

  return snapshot;
}
