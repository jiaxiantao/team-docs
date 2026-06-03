import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;

function maskUrl(connectionUrl: string): string {
  try {
    const parsed = new URL(connectionUrl);
    if (!parsed.password) {
      return `${parsed.protocol}//${parsed.username}:***未设置密码***@${parsed.host}${parsed.pathname}${parsed.search}`;
    }
    parsed.password = "****";
    return parsed.toString();
  } catch {
    return "(invalid URL)";
  }
}

async function main() {
  if (!url) {
    console.error("❌ 未设置 DATABASE_URL，请检查 .env 文件");
    process.exit(1);
  }

  console.log("连接串:", maskUrl(url));

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    const [row] = await prisma.$queryRaw<[{ db: string; user: string }]>`
      SELECT current_database()::text AS db, current_user::text AS user
    `;
    console.log("✅ 数据库连接成功");
    console.log(`   数据库: ${row.db}`);
    console.log(`   用户:   ${row.user}`);

    const migrations = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations"
    `.catch(() => null);

    if (migrations) {
      console.log(`   已应用迁移: ${migrations[0]?.count ?? 0} 条`);
    } else {
      console.log("   提示: 尚未执行迁移，请运行 pnpm run db:migrate");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ 数据库连接失败");
    console.error(`   ${message}`);
    console.error("\n请确认:");
    console.error("  1. 本地 PostgreSQL 已启动（IDE 中连接状态为绿色）");
    console.error("  2. 已创建数据库 team_docs");
    console.error("  3. .env 中 POSTGRES_USER / POSTGRES_PASSWORD 与 IDE 连接一致");
    console.error("  4. DATABASE_URL 指向 team_docs（不是 teamdocs）");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
