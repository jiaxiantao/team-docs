/** Edge 安全：勿在此引入 fs / path / prisma 等 Node 专用模块 */
export async function register() {
  const { ensureEnv } = await import("@/lib/env");
  ensureEnv();
}
