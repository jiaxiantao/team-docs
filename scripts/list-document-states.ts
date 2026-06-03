import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const rows = await prisma.documentState.findMany({
    select: {
      documentId: true,
      updatedAt: true,
      state: true,
    },
  });
  console.log(
    rows.map((r) => ({
      documentId: r.documentId,
      bytes: r.state.length,
      updatedAt: r.updatedAt,
    })),
  );
  await prisma.$disconnect();
}

main();
