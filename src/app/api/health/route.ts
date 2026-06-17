import { NextResponse } from "next/server";
import { checkPendingMigrations } from "@/lib/db-migrations";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const { pending, ok } = await checkPendingMigrations();
    return NextResponse.json({
      status: ok ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      migrations: { ok, pending },
    });
  } catch {
    return NextResponse.json(
      { status: "error", error: "database_unreachable" },
      { status: 503 },
    );
  }
}
