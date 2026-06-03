import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { createHmac, timingSafeEqual } from "crypto";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();
const port = Number(process.env.COLLAB_PORT ?? 1234);
const secret = process.env.COLLAB_SECRET;

if (!secret) {
  console.error("COLLAB_SECRET is required");
  process.exit(1);
}

function verifyCollabToken(token) {
  const [bodyEncoded, signature] = token.split(".");
  if (!bodyEncoded || !signature) return null;

  try {
    const body = Buffer.from(bodyEncoded, "base64url").toString("utf8");
    const expected = createHmac("sha256", secret)
      .update(body)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(body);
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

const server = new Server({
  port,
  debounce: 800,
  maxDebounce: 3000,
  unloadImmediately: true,

  async onRequest({ request, response }) {
    if (request.url === "/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ status: "ok" }));
      return;
    }
    response.writeHead(404);
    response.end();
  },

  async onAuthenticate({ token, documentName }) {
    if (!token) {
      throw new Error("Missing token");
    }

    const payload = verifyCollabToken(token);
    if (!payload) {
      throw new Error("Invalid token");
    }

    if (payload.documentId !== documentName) {
      throw new Error("Document mismatch");
    }

    return {
      user: {
        id: payload.userId,
        name: payload.name,
        color: payload.color,
      },
    };
  },

  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        const row = await prisma.documentState.findUnique({
          where: { documentId: documentName },
        });
        if (!row?.state) return null;
        return new Uint8Array(row.state);
      },
      store: async ({ documentName, state }) => {
        await prisma.documentState.upsert({
          where: { documentId: documentName },
          create: {
            documentId: documentName,
            state: Buffer.from(state),
          },
          update: {
            state: Buffer.from(state),
            updatedAt: new Date(),
          },
        });

        await prisma.document.update({
          where: { id: documentName },
          data: { updatedAt: new Date() },
        }).catch(() => {
          /* document may have been deleted */
        });
      },
    }),
  ],
});

server.listen();
console.log(`Hocuspocus collab server listening on :${port}`);

process.on("SIGTERM", async () => {
  await server.destroy();
  await prisma.$disconnect();
  process.exit(0);
});
