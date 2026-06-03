import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  colorForUserId,
  signCollabToken,
} from "@/lib/collab-token";
import { canAccessDocument } from "@/lib/document-access";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json({ error: "缺少 documentId" }, { status: 400 });
  }

  const allowed = await canAccessDocument(session.user.id, documentId, "VIEWER");
  if (!allowed) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  const token = signCollabToken({
    userId: session.user.id,
    documentId,
    name: session.user.name ?? session.user.email ?? "匿名用户",
    color: colorForUserId(session.user.id),
  });

  return NextResponse.json({
    token,
    wsUrl: process.env.NEXT_PUBLIC_COLLAB_WS_URL ?? "ws://localhost:1234",
  });
}
