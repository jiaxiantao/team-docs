import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { isDocumentOwner } from "@/lib/document-access";
import {
  buildPublicShareUrl,
  generateShareToken,
} from "@/lib/document-share";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  regenerate: z.boolean().optional(),
});

export async function GET(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id: documentId } = await params;
  if (!(await isDocumentOwner(session.user.id, documentId))) {
    return NextResponse.json({ error: "仅所有者可管理分享链接" }, { status: 403 });
  }

  const link = await prisma.documentShareLink.findUnique({
    where: { documentId },
  });

  if (!link) {
    return NextResponse.json({ share: null });
  }

  const origin = new URL(request.url).origin;
  return NextResponse.json({
    share: {
      enabled: link.enabled,
      token: link.token,
      url: buildPublicShareUrl(link.token, origin),
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
    },
  });
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id: documentId } = await params;
  if (!(await isDocumentOwner(session.user.id, documentId))) {
    return NextResponse.json({ error: "仅所有者可创建分享链接" }, { status: 403 });
  }

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) {
    return NextResponse.json({ error: "文档不存在" }, { status: 404 });
  }

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 });
  }

  const existing = await prisma.documentShareLink.findUnique({
    where: { documentId },
  });

  const token =
    parsed.data.regenerate || !existing
      ? generateShareToken()
      : existing.token;

  const link = await prisma.documentShareLink.upsert({
    where: { documentId },
    create: {
      documentId,
      token,
      enabled: parsed.data.enabled ?? true,
    },
    update: {
      token,
      enabled: parsed.data.enabled ?? true,
    },
  });

  const origin = new URL(request.url).origin;
  return NextResponse.json({
    share: {
      enabled: link.enabled,
      token: link.token,
      url: buildPublicShareUrl(link.token, origin),
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
    },
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id: documentId } = await params;
  if (!(await isDocumentOwner(session.user.id, documentId))) {
    return NextResponse.json({ error: "仅所有者可关闭分享" }, { status: 403 });
  }

  await prisma.documentShareLink.updateMany({
    where: { documentId },
    data: { enabled: false },
  });

  return NextResponse.json({ ok: true });
}
