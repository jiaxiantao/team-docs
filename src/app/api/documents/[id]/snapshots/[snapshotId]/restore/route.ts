import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canEditDocument } from "@/lib/document-access";
import { restoreDocumentSnapshot } from "@/lib/document-snapshot";

type Params = { params: Promise<{ id: string; snapshotId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id: documentId, snapshotId } = await params;
    if (!(await canEditDocument(session.user.id, documentId))) {
      return NextResponse.json({ error: "仅可编辑用户可恢复快照" }, { status: 403 });
    }

    const snapshot = await restoreDocumentSnapshot(documentId, snapshotId);
    if (!snapshot) {
      return NextResponse.json({ error: "快照不存在" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      title: snapshot.title,
      restoredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[snapshot restore]", error);
    return NextResponse.json({ error: "恢复快照失败" }, { status: 500 });
  }
}
