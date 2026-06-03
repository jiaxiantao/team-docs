/** 安全解析 fetch 响应体，避免空 body 导致 JSON.parse 报错 */
export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error("服务器返回空响应");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("服务器返回了无效的 JSON");
  }
}
