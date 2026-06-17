import { createHmac, timingSafeEqual } from "crypto";
import type { CollabAccessMode } from "@/lib/role";

export const COLLAB_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
/** 在过期前刷新令牌，避免长会话中断 */
export const COLLAB_TOKEN_REFRESH_MS = Math.floor(COLLAB_TOKEN_TTL_MS * 0.8);

function getSecret(): string {
  const secret = process.env.COLLAB_SECRET;
  if (!secret) {
    throw new Error("COLLAB_SECRET is not configured");
  }
  return secret;
}

export type CollabTokenPayload = {
  userId: string;
  documentId: string;
  name: string;
  color: string;
  access: CollabAccessMode;
  /** 通过公开分享链接访问时携带，供协同服务校验 */
  shareToken?: string;
  exp: number;
};

export function signCollabToken(
  payload: Omit<CollabTokenPayload, "exp">,
): string {
  const exp = Date.now() + COLLAB_TOKEN_TTL_MS;
  const body = JSON.stringify({ ...payload, exp });
  const signature = createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  const bodyEncoded = Buffer.from(body).toString("base64url");
  return `${bodyEncoded}.${signature}`;
}

export function verifyCollabToken(token: string): CollabTokenPayload | null {
  const [bodyEncoded, signature] = token.split(".");
  if (!bodyEncoded || !signature) return null;

  try {
    const body = Buffer.from(bodyEncoded, "base64url").toString("utf8");
    const expected = createHmac("sha256", getSecret())
      .update(body)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(body) as CollabTokenPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const USER_COLORS = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#34d399",
  "#22d3ee",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
] as const;

export function colorForUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}
