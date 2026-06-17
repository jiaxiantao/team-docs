import { readdirSync } from "fs";
import path from "path";

/** 读取 prisma/migrations 目录（仅 Node.js 运行时） */
export function listLocalMigrationNames(): string[] {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  try {
    return readdirSync(migrationsDir)
      .filter((name) => /^\d{14}_/.test(name))
      .sort();
  } catch {
    return [];
  }
}
