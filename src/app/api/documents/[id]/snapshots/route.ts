import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { canAccessDocument, canEditDocument } from "@/lib/document-access";
import {
  createDocumentSnapshot,
  listDocumentSnapshots,
} from "@/lib/document-snapshot";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const createSchema = z.object({
  label: z.string().trim().max(100).optional(),
});

function snapshotErrorMessage(error: unknown, action: string): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: string }).code)
      : "";

  if (code === "P2021") {
    return "版本历史数据表未初始化，请在项目根目录运行 pnpm run db:migrate";
  }

  console.error(`[snapshots ${action}]`, error);
  return action === "GET"
    ? "加载版本历史失败，请重启开发服务后重试"
    : "创建快照失败，请重启开发服务后重试";
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id: documentId } = await params;
    if (!(await canAccessDocument(session.user.id, documentId))) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const snapshots = await listDocumentSnapshots(documentId);

    return NextResponse.json({
      snapshots: snapshots.map((snapshot) => ({
        ...snapshot,
        createdAt: snapshot.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: snapshotErrorMessage(error, "GET") },
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
    if (!(await canEditDocument(session.user.id, documentId))) {
      return NextResponse.json({ error: "仅可编辑用户可创建快照" }, { status: 403 });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        title: true,
        state: { select: { state: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "文档不存在" }, { status: 404 });
    }

    if (!document.state?.state) {
      return NextResponse.json(
        { error: "文档尚无内容，请先编辑后再创建快照" },
        { status: 400 },
      );
    }

    let body: unknown = {};
    try {
      const text = await request.text();
      if (text) body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "无效的 JSON" }, { status: 400 });
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "参数无效" }, { status: 400 });
    }

    const snapshot = await createDocumentSnapshot({
      documentId,
      state: new Uint8Array(document.state.state),
      title: document.title,
      label: parsed.data.label ?? "手动快照",
      source: "MANUAL",
      createdById: session.user.id,
    });

    return NextResponse.json(
      {
        snapshot: {
          ...snapshot,
          createdAt: snapshot.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: snapshotErrorMessage(error, "POST") },
      { status: 500 },
    );
  }
}
