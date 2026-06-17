import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessDocument } from "@/lib/document-access";
import { buildContentDisposition, sanitizeFilename } from "@/lib/content-disposition";
import {
  wrapExportHtml,
  yjsStateToHtml,
  yjsStateToProsemirrorJSON,
} from "@/lib/document-export";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id: documentId } = await params;
  if (!(await canAccessDocument(session.user.id, documentId))) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "html";
  if (format !== "html" && format !== "json") {
    return NextResponse.json({ error: "format 须为 html 或 json" }, { status: 400 });
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
    return NextResponse.json({ error: "文档尚无内容" }, { status: 400 });
  }

  const state = new Uint8Array(document.state.state);
  const filename = sanitizeFilename(document.title);

  if (format === "json") {
    const json = yjsStateToProsemirrorJSON(state);
    return new NextResponse(JSON.stringify({ title: document.title, content: json }), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": buildContentDisposition(`${filename}.json`),
      },
    });
  }

  const bodyHtml = yjsStateToHtml(state);
  const html = wrapExportHtml(document.title, bodyHtml);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": buildContentDisposition(`${filename}.html`),
    },
  });
}
