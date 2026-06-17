import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canEditDocument } from "@/lib/document-access";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  attachmentPublicUrl,
  buildAttachmentStorageKey,
  getStorage,
} from "@/lib/storage";
import {
  resolveUploadExtension,
  resolveUploadMimeType,
  validateFileUpload,
} from "@/lib/upload-policy";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const ip = clientIp(request);
    if (!rateLimit(`upload:${session.user.id}:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: "上传过于频繁" }, { status: 429 });
    }

    const { id: documentId } = await params;
    if (!(await canEditDocument(session.user.id, documentId))) {
      return NextResponse.json({ error: "仅可编辑用户可上传文件" }, { status: 403 });
    }

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true },
    });
    if (!doc) {
      return NextResponse.json({ error: "文档不存在" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    const validationError = validateFileUpload({
      size: file.size,
      type: file.type,
      name: file.name,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const mimeType = resolveUploadMimeType(file);
    const extension = resolveUploadExtension(file, mimeType);
    const attachmentId = randomUUID();
    const storageKey = buildAttachmentStorageKey(
      documentId,
      attachmentId,
      extension,
    );
    const buffer = Buffer.from(await file.arrayBuffer());

    const storage = getStorage();
    await storage.put(storageKey, buffer, mimeType);

    const attachment = await prisma.documentAttachment.create({
      data: {
        id: attachmentId,
        documentId,
        storageKey,
        filename: file.name || `file.${extension}`,
        mimeType,
        size: file.size,
        uploadedById: session.user.id,
      },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        size: true,
      },
    });

    return NextResponse.json(
      {
        attachment: {
          id: attachment.id,
          url: attachmentPublicUrl(attachment.id),
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size: attachment.size,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[upload POST]", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
