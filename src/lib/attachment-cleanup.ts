import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";

export async function deleteDocumentAttachments(documentId: string) {
  const attachments = await prisma.documentAttachment.findMany({
    where: { documentId },
    select: { storageKey: true },
  });

  const storage = getStorage();
  await Promise.all(
    attachments.map((item) =>
      storage.delete(item.storageKey).catch(() => {
        /* 文件可能已不存在 */
      }),
    ),
  );
}

export async function deleteAttachmentById(attachmentId: string) {
  const attachment = await prisma.documentAttachment.findUnique({
    where: { id: attachmentId },
    select: { storageKey: true },
  });
  if (!attachment) return false;

  await getStorage().delete(attachment.storageKey).catch(() => {});
  await prisma.documentAttachment.delete({ where: { id: attachmentId } });
  return true;
}
