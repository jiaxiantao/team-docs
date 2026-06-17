/**
 * dev 启动前检查待执行迁移（Node 进程，不经过 Edge instrumentation）
 */
import "dotenv/config";
import { checkPendingMigrations } from "../src/lib/db-migrations";

async function main() {
  if (process.env.SKIP_ENV_VALIDATION === "1") return;

  try {
    const { pending, ok } = await checkPendingMigrations();
    if (!ok) {
      console.error(`\n⚠️  有 ${pending.length} 条数据库迁移未应用:`);
      for (const name of pending) {
        console.error(`   - ${name}`);
      }
      console.error("\n请运行: pnpm run db:migrate\n");
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[team-docs] 无法检查数据库迁移状态:", message);
  }
}

void main();
