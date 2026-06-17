import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessDocument } from "@/lib/document-access";
import { prisma } from "@/lib/prisma";
import { attachmentPublicUrl } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id: documentId } = await params;
    if (!(await canAccessDocument(session.user.id, documentId))) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const attachments = await prisma.documentAttachment.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        size: true,
        createdAt: true,
        uploadedBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      attachments: attachments.map((item) => ({
        ...item,
        url: attachmentPublicUrl(item.id),
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[attachments GET]", error);
    return NextResponse.json({ error: "加载附件失败" }, { status: 500 });
  }
}
