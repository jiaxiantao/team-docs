import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canViewAttachment } from "@/lib/attachment-access";
import { deleteAttachmentById } from "@/lib/attachment-cleanup";
import { canEditDocument } from "@/lib/document-access";
import { prisma } from "@/lib/prisma";
import { buildContentDisposition } from "@/lib/content-disposition";
import { getStorage } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const { allowed, attachment } = await canViewAttachment(id);

  if (!attachment) {
    return NextResponse.json({ error: "附件不存在" }, { status: 404 });
  }
  if (!allowed) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  const stored = await getStorage().get(attachment.storageKey);
  if (!stored) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(stored.body), {
    status: 200,
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": buildContentDisposition(
        attachment.filename,
        "inline",
      ),
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id } = await params;
    const record = await prisma.documentAttachment.findUnique({
      where: { id },
      select: { documentId: true },
    });
    if (!record) {
      return NextResponse.json({ error: "附件不存在" }, { status: 404 });
    }

    if (!(await canEditDocument(session.user.id, record.documentId))) {
      return NextResponse.json({ error: "仅可编辑用户可删除附件" }, { status: 403 });
    }

    const deleted = await deleteAttachmentById(id);
    if (!deleted) {
      return NextResponse.json({ error: "附件不存在" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[attachment DELETE]", error);
    return NextResponse.json({ error: "删除附件失败" }, { status: 500 });
  }
}
