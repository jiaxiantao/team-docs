import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { isDocumentOwner } from "@/lib/document-access";
import {
  buildPublicShareUrl,
  computeShareExpiresAt,
  generateShareToken,
} from "@/lib/document-share";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const shareBodySchema = z.object({
  enabled: z.boolean().optional(),
  regenerate: z.boolean().optional(),
  /** 有效天数；null 表示永久有效 */
  expiresInDays: z.number().int().min(1).max(365).nullable().optional(),
});

function serializeShare(
  link: {
    enabled: boolean;
    token: string;
    expiresAt: Date | null;
    createdAt: Date;
  },
  origin: string,
) {
  return {
    enabled: link.enabled,
    token: link.token,
    url: buildPublicShareUrl(link.token, origin),
    expiresAt: link.expiresAt,
    createdAt: link.createdAt,
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
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
      share: serializeShare(link, origin),
    });
  } catch (error) {
    console.error("[share GET]", error);
    return NextResponse.json(
      { error: "加载分享设置失败，请重启开发服务后重试" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
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

    const parsed = shareBodySchema.safeParse(body);
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

    const expiresAt =
      parsed.data.expiresInDays !== undefined
        ? computeShareExpiresAt(parsed.data.expiresInDays)
        : existing?.expiresAt ?? null;

    const link = await prisma.documentShareLink.upsert({
      where: { documentId },
      create: {
        documentId,
        token,
        enabled: parsed.data.enabled ?? true,
        expiresAt,
      },
      update: {
        token,
        enabled: parsed.data.enabled ?? true,
        ...(parsed.data.expiresInDays !== undefined ? { expiresAt } : {}),
      },
    });

    const origin = new URL(request.url).origin;
    return NextResponse.json({
      share: serializeShare(link, origin),
    });
  } catch (error) {
    console.error("[share POST]", error);
    return NextResponse.json(
      { error: "开启分享失败，请重启开发服务后重试" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id: documentId } = await params;
    if (!(await isDocumentOwner(session.user.id, documentId))) {
      return NextResponse.json({ error: "仅所有者可更新分享设置" }, { status: 403 });
    }

    let body: unknown = {};
    try {
      const text = await request.text();
      if (text) body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
    }

    const parsed = shareBodySchema.safeParse(body);
    if (!parsed.success || parsed.data.expiresInDays === undefined) {
      return NextResponse.json({ error: "请提供 expiresInDays" }, { status: 400 });
    }

    const existing = await prisma.documentShareLink.findUnique({
      where: { documentId },
    });
    if (!existing || !existing.enabled) {
      return NextResponse.json({ error: "请先开启公开分享" }, { status: 400 });
    }

    const expiresAt = computeShareExpiresAt(parsed.data.expiresInDays);
    const link = await prisma.documentShareLink.update({
      where: { documentId },
      data: { expiresAt },
    });

    const origin = new URL(request.url).origin;
    return NextResponse.json({
      share: serializeShare(link, origin),
    });
  } catch (error) {
    console.error("[share PATCH]", error);
    return NextResponse.json(
      { error: "更新分享设置失败，请重启开发服务后重试" },
      { status: 500 },
    );
  }
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
