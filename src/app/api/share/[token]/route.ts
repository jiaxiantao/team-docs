import { NextResponse } from "next/server";
import { findActiveShareByToken } from "@/lib/document-share";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: Params) {
  const ip = clientIp(request);
  if (!rateLimit(`share-meta:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const { token } = await params;
  const link = await findActiveShareByToken(token);

  if (!link) {
    return NextResponse.json({ error: "分享链接无效或已关闭" }, { status: 404 });
  }

  return NextResponse.json({
    document: {
      id: link.document.id,
      title: link.document.title,
      updatedAt: link.document.updatedAt,
    },
    readOnly: true,
  });
}
