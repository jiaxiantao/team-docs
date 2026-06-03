import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET 至少 32 个字符"),
  AUTH_URL: z.string().url().optional(),
  COLLAB_SECRET: z.string().min(16, "COLLAB_SECRET 至少 16 个字符"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_COLLAB_WS_URL: z
    .string()
    .regex(/^wss?:\/\//, "NEXT_PUBLIC_COLLAB_WS_URL 须为 ws:// 或 wss://"),
});

let validated = false;

export function ensureEnv() {
  if (validated || process.env.SKIP_ENV_VALIDATION === "1") {
    return;
  }

  const server = serverSchema.safeParse(process.env);
  if (!server.success) {
    console.error("Invalid server environment variables:");
    console.error(server.error.flatten().fieldErrors);
    throw new Error("环境变量校验失败，请对照 .env.example 配置");
  }

  const client = clientSchema.safeParse({
    NEXT_PUBLIC_COLLAB_WS_URL: process.env.NEXT_PUBLIC_COLLAB_WS_URL,
  });
  if (!client.success) {
    console.error("Invalid client environment variables:");
    console.error(client.error.flatten().fieldErrors);
    throw new Error("NEXT_PUBLIC_COLLAB_WS_URL 未正确配置");
  }

  validated = true;
}

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  authSecret: process.env.AUTH_SECRET!,
  collabSecret: process.env.COLLAB_SECRET!,
  collabWsUrl:
    process.env.NEXT_PUBLIC_COLLAB_WS_URL ?? "ws://localhost:1234",
};
