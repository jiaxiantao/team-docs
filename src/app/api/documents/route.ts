import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  listDocumentsForUser,
  serializeDocumentListItem,
} from "@/lib/documents";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const documents = await listDocumentsForUser(session.user.id);

  return NextResponse.json({
    documents: documents.map(serializeDocumentListItem),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : "无标题文档";

  const document = await prisma.document.create({
    data: {
      title,
      ownerId: session.user.id,
      collaborators: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ document }, { status: 201 });
}
