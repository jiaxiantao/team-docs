import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("demo123456", 12);

  const demo = await prisma.user.upsert({
    where: { email: "demo@teamdocs.local" },
    update: {},
    create: {
      email: "demo@teamdocs.local",
      name: "演示用户",
      passwordHash,
    },
  });

  const existing = await prisma.document.findFirst({
    where: { ownerId: demo.id },
  });

  if (!existing) {
    await prisma.document.create({
      data: {
        title: "欢迎使用 Team Docs",
        ownerId: demo.id,
        collaborators: {
          create: { userId: demo.id, role: "OWNER" },
        },
      },
    });
  }

  console.log("Seed complete:");
  console.log("  Email:    demo@teamdocs.local");
  console.log("  Password: demo123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
