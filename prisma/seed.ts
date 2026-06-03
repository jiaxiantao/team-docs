import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword("demo123456");

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

  let welcomeDoc = existing;
  if (!welcomeDoc) {
    welcomeDoc = await prisma.document.create({
      data: {
        title: "欢迎使用 Team Docs",
        ownerId: demo.id,
        collaborators: {
          create: { userId: demo.id, role: "OWNER" },
        },
      },
    });
  }

  const viewerHash = await hashPassword("viewer123456");
  const viewer = await prisma.user.upsert({
    where: { email: "viewer@teamdocs.local" },
    update: {},
    create: {
      email: "viewer@teamdocs.local",
      name: "只读协作者",
      passwordHash: viewerHash,
    },
  });

  await prisma.documentCollaborator.upsert({
    where: {
      documentId_userId: {
        documentId: welcomeDoc.id,
        userId: viewer.id,
      },
    },
    create: {
      documentId: welcomeDoc.id,
      userId: viewer.id,
      role: "VIEWER",
    },
    update: { role: "VIEWER" },
  });

  console.log("Seed complete:");
  console.log("  Owner:  demo@teamdocs.local / demo123456");
  console.log("  Viewer: viewer@teamdocs.local / viewer123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
