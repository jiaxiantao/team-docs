import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  colorForUserId,
  signCollabToken,
} from "@/lib/collab-token";
import { getDocumentRole } from "@/lib/document-access";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { collabAccessModeForRole } from "@/lib/role";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const ip = clientIp(request);
  if (!rateLimit(`collab-token:${session.user.id}:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json({ error: "缺少 documentId" }, { status: 400 });
  }

  const role = await getDocumentRole(session.user.id, documentId);
  if (!role) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  const token = signCollabToken({
    userId: session.user.id,
    documentId,
    name: session.user.name ?? session.user.email ?? "匿名用户",
    color: colorForUserId(session.user.id),
    access: collabAccessModeForRole(role),
  });

  return NextResponse.json({
    token,
    access: collabAccessModeForRole(role),
    wsUrl: process.env.NEXT_PUBLIC_COLLAB_WS_URL ?? "ws://localhost:1234",
  });
}
