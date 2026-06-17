import { describe, expect, it, vi } from "vitest";
import { HttpError, fetchJson } from "@/lib/fetch-json";

describe("fetchJson", () => {
  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      ),
    );

    const data = await fetchJson<{ ok: boolean }>("/api/test");
    expect(data.ok).toBe(true);
    vi.unstubAllGlobals();
  });

  it("throws HttpError with status on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "未授权" }), { status: 401 }),
      ),
    );

    await expect(fetchJson("/api/test")).rejects.toMatchObject({
      message: "未授权",
      status: 401,
    });
    vi.unstubAllGlobals();
  });

  it("HttpError exposes status", () => {
    const err = new HttpError("失败", 500);
    expect(err.status).toBe(500);
    expect(err.name).toBe("HttpError");
  });
});
