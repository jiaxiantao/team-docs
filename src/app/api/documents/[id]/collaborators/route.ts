import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { isDocumentOwner } from "@/lib/document-access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const addSchema = z.object({
  email: z.email(),
  role: z.enum([Role.EDITOR, Role.VIEWER]),
});

const patchSchema = z.object({
  userId: z.string().min(1),
  role: z.enum([Role.EDITOR, Role.VIEWER]),
});

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id: documentId } = await params;
  if (!(await isDocumentOwner(session.user.id, documentId))) {
    return NextResponse.json({ error: "仅所有者可邀请协作者" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }

  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "请提供有效邮箱与角色" }, { status: 400 });
  }

  const invitee = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!invitee) {
    return NextResponse.json({ error: "该邮箱尚未注册" }, { status: 404 });
  }

  if (invitee.id === session.user.id) {
    return NextResponse.json({ error: "不能邀请自己" }, { status: 400 });
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });
  if (invitee.id === doc?.ownerId) {
    return NextResponse.json({ error: "所有者已是文档成员" }, { status: 400 });
  }

  const collaborator = await prisma.documentCollaborator.upsert({
    where: {
      documentId_userId: { documentId, userId: invitee.id },
    },
    create: {
      documentId,
      userId: invitee.id,
      role: parsed.data.role,
    },
    update: { role: parsed.data.role },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ collaborator }, { status: 201 });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id: documentId } = await params;
  if (!(await isDocumentOwner(session.user.id, documentId))) {
    return NextResponse.json({ error: "仅所有者可修改协作者" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 });
  }

  if (parsed.data.userId === session.user.id) {
    return NextResponse.json({ error: "不能修改自己的协作者角色" }, { status: 400 });
  }

  const existing = await prisma.documentCollaborator.findUnique({
    where: {
      documentId_userId: {
        documentId,
        userId: parsed.data.userId,
      },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "协作者不存在" }, { status: 404 });
  }

  const collaborator = await prisma.documentCollaborator.update({
    where: {
      documentId_userId: {
        documentId,
        userId: parsed.data.userId,
      },
    },
    data: { role: parsed.data.role },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ collaborator });
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id: documentId } = await params;
  if (!(await isDocumentOwner(session.user.id, documentId))) {
    return NextResponse.json({ error: "仅所有者可移除协作者" }, { status: 403 });
  }

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
  }

  if (userId === session.user.id) {
    return NextResponse.json({ error: "不能移除自己" }, { status: 400 });
  }

  const result = await prisma.documentCollaborator.deleteMany({
    where: { documentId, userId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "协作者不存在" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
