import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteDocumentAttachments } from "@/lib/attachment-cleanup";
import { canAccessDocument } from "@/lib/document-access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const allowed = await canAccessDocument(session.user.id, id);
  if (!allowed) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true,
      owner: { select: { id: true, name: true, email: true } },
      collaborators: {
        select: {
          role: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "文档不存在" }, { status: 404 });
  }

  return NextResponse.json({ document });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const allowed = await canAccessDocument(session.user.id, id, "EDITOR");
  if (!allowed) {
    return NextResponse.json({ error: "无权编辑" }, { status: 403 });
  }

  let body: { title?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim() : undefined;

  if (!title) {
    return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
  }

  const document = await prisma.document.update({
    where: { id },
    data: { title },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ document });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: "文档不存在" }, { status: 404 });
  }

  if (doc.ownerId !== session.user.id) {
    return NextResponse.json({ error: "仅所有者可删除" }, { status: 403 });
  }

  await deleteDocumentAttachments(id);
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
