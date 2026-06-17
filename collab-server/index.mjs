import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { Redis } from "@hocuspocus/extension-redis";
import { createHmac, timingSafeEqual } from "crypto";
import { hostname } from "os";
import { PrismaClient, Role } from "@prisma/client";
import RedisClient from "ioredis";
import "dotenv/config";

const prisma = new PrismaClient();
const port = Number(process.env.COLLAB_PORT ?? 1234);
const secret = process.env.COLLAB_SECRET;
const MAX_STATE_BYTES = 5 * 1024 * 1024;
const AUTO_SNAPSHOT_INTERVAL_MS = 30 * 60 * 1000;
const MAX_SNAPSHOTS = 20;

const ROLE_RANK = {
  VIEWER: 1,
  EDITOR: 2,
  OWNER: 3,
};

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
    if (payload.access !== "editor" && payload.access !== "viewer") {
      return null;
    }
    if (
      payload.shareToken != null &&
      typeof payload.shareToken !== "string"
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function shareLinkAllowsAccess(shareToken, documentId) {
  const link = await prisma.documentShareLink.findUnique({
    where: { token: shareToken },
  });

  if (!link || !link.enabled || link.documentId !== documentId) {
    return false;
  }
  if (link.expiresAt && link.expiresAt < new Date()) {
    return false;
  }
  return true;
}

async function userHasDocumentAccess(userId, documentId, minRole) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      collaborators: { where: { userId } },
    },
  });

  if (!doc) return false;
  if (doc.ownerId === userId) return true;

  const collab = doc.collaborators[0];
  if (!collab) return false;

  return ROLE_RANK[collab.role] >= ROLE_RANK[minRole];
}

async function pruneSnapshots(documentId) {
  const count = await prisma.documentSnapshot.count({
    where: { documentId },
  });
  if (count <= MAX_SNAPSHOTS) return;

  const excess = count - MAX_SNAPSHOTS;
  const oldest = await prisma.documentSnapshot.findMany({
    where: { documentId },
    orderBy: { createdAt: "asc" },
    take: excess,
    select: { id: true },
  });

  await prisma.documentSnapshot.deleteMany({
    where: { id: { in: oldest.map((row) => row.id) } },
  });
}

async function maybeCreateAutoSnapshot(documentId, state) {
  const last = await prisma.documentSnapshot.findFirst({
    where: { documentId, source: "AUTO" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (
    last &&
    Date.now() - last.createdAt.getTime() < AUTO_SNAPSHOT_INTERVAL_MS
  ) {
    return;
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { title: true },
  });
  if (!doc) return;

  await prisma.documentSnapshot.create({
    data: {
      documentId,
      state: Buffer.from(state),
      title: doc.title,
      label: "自动快照",
      source: "AUTO",
    },
  });

  await pruneSnapshots(documentId);
}

const databaseExtension = new Database({
  fetch: async ({ documentName }) => {
    const row = await prisma.documentState.findUnique({
      where: { documentId: documentName },
    });
    if (!row?.state) return null;
    return new Uint8Array(row.state);
  },
  store: async ({ documentName, state }) => {
    if (state.byteLength > MAX_STATE_BYTES) {
      console.warn(
        `[collab] Document ${documentName} state exceeds ${MAX_STATE_BYTES} bytes, skipping persist`,
      );
      return;
    }

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

    await prisma.document
      .update({
        where: { id: documentName },
        data: { updatedAt: new Date() },
      })
      .catch(() => {
        /* document may have been deleted */
      });

    await maybeCreateAutoSnapshot(documentName, state).catch((err) => {
      console.warn(`[collab] Auto snapshot failed for ${documentName}:`, err);
    });
  },
});

const extensions = [databaseExtension];
const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  extensions.unshift(
    new Redis({
      redis: new RedisClient(redisUrl),
    }),
  );
  console.log("[collab] Redis extension enabled");
}

const server = new Server({
  name: process.env.COLLAB_SERVER_NAME ?? `collab-${hostname()}`,
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

    if (payload.shareToken) {
      if (payload.access !== "viewer") {
        throw new Error("Share access must be read-only");
      }
      const shareOk = await shareLinkAllowsAccess(
        payload.shareToken,
        documentName,
      );
      if (!shareOk) {
        throw new Error("Share link invalid or expired");
      }
      return {
        user: {
          id: payload.userId,
          name: payload.name,
          color: payload.color,
        },
        readOnly: true,
      };
    }

    const minRole = payload.access === "editor" ? Role.EDITOR : Role.VIEWER;
    const allowed = await userHasDocumentAccess(
      payload.userId,
      documentName,
      minRole,
    );
    if (!allowed) {
      throw new Error("Access revoked");
    }

    return {
      user: {
        id: payload.userId,
        name: payload.name,
        color: payload.color,
      },
      readOnly: payload.access === "viewer",
    };
  },

  extensions,
});

server.listen().then(() => {
  console.log(`Hocuspocus collab server listening on :${port}`);
}).catch((err) => {
  if (err?.code === "EADDRINUSE") {
    console.error(
      `[collab] 端口 ${port} 已被占用（通常是上次 dev 未退出）。` +
        `\n  释放端口：lsof -i :${port} -t | xargs kill` +
        `\n  或修改 .env 中的 COLLAB_PORT`,
    );
  } else {
    console.error("[collab] 启动失败:", err);
  }
  process.exit(1);
});

process.on("SIGTERM", async () => {
  await server.destroy();
  await prisma.$disconnect();
  process.exit(0);
});
