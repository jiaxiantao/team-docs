import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessDocument } from "@/lib/document-access";
import { yjsStateToHtml } from "@/lib/document-export";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; snapshotId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id: documentId, snapshotId } = await params;
    if (!(await canAccessDocument(session.user.id, documentId))) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const snapshot = await prisma.documentSnapshot.findFirst({
      where: { id: snapshotId, documentId },
      select: {
        id: true,
        title: true,
        label: true,
        source: true,
        state: true,
        createdAt: true,
        createdBy: { select: { name: true, email: true } },
      },
    });

    if (!snapshot) {
      return NextResponse.json({ error: "快照不存在" }, { status: 404 });
    }

    const html = yjsStateToHtml(new Uint8Array(snapshot.state));

    return NextResponse.json({
      snapshot: {
        id: snapshot.id,
        title: snapshot.title,
        label: snapshot.label,
        source: snapshot.source,
        createdAt: snapshot.createdAt.toISOString(),
        createdBy: snapshot.createdBy,
        html,
      },
    });
  } catch (error) {
    console.error("[snapshot GET]", error);
    return NextResponse.json({ error: "加载快照预览失败" }, { status: 500 });
  }
}
