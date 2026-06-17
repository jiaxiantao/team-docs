import { prisma } from "@/lib/prisma";

export async function listAppliedMigrationNames(): Promise<string[]> {
  try {
    const rows = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL
    `;
    return rows.map((row) => row.migration_name);
  } catch {
    return [];
  }
}

export async function getPendingMigrationNames(): Promise<string[]> {
  const { listLocalMigrationNames } = await import("./db-migrations-local");
  const local = listLocalMigrationNames();
  const applied = new Set(await listAppliedMigrationNames());
  return local.filter((name) => !applied.has(name));
}

export async function checkPendingMigrations(): Promise<{
  pending: string[];
  ok: boolean;
}> {
  const pending = await getPendingMigrationNames();
  return { pending, ok: pending.length === 0 };
}
