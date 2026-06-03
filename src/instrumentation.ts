export async function register() {
  const { ensureEnv } = await import("@/lib/env");
  ensureEnv();
}
