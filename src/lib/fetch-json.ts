import { parseJsonResponse } from "@/lib/parse-json-response";

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** 封装 fetch + JSON 解析，非 2xx 时抛出 HttpError */
export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  const data = await parseJsonResponse<T & { error?: string }>(res);
  if (!res.ok) {
    throw new HttpError(
      typeof data.error === "string" ? data.error : "请求失败",
      res.status,
    );
  }
  return data;
}
