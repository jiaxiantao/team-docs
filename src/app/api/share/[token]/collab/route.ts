import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  colorForUserId,
  signCollabToken,
} from "@/lib/collab-token";
import { findActiveShareByToken } from "@/lib/document-share";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: Params) {
  const ip = clientIp(request);
  if (!rateLimit(`share-collab:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const { token } = await params;
  const link = await findActiveShareByToken(token);

  if (!link) {
    return NextResponse.json({ error: "分享链接无效或已关闭" }, { status: 404 });
  }

  const guestId = `guest-${randomUUID()}`;
  const collabToken = signCollabToken({
    userId: guestId,
    documentId: link.document.id,
    name: "访客",
    color: colorForUserId(guestId),
    access: "viewer",
    shareToken: token,
  });

  return NextResponse.json({
    token: collabToken,
    documentId: link.document.id,
    access: "viewer",
    wsUrl: process.env.NEXT_PUBLIC_COLLAB_WS_URL ?? "ws://localhost:1234",
    user: {
      id: guestId,
      name: "访客",
      color: colorForUserId(guestId),
    },
  });
}
