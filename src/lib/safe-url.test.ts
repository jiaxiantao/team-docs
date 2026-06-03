import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@/lib/safe-url";

describe("safeCallbackUrl", () => {
  it("returns fallback for empty input", () => {
    expect(safeCallbackUrl(null)).toBe("/dashboard");
  });

  it("allows same-origin relative paths", () => {
    expect(safeCallbackUrl("/docs/abc")).toBe("/docs/abc");
  });

  it("blocks protocol-relative and absolute URLs", () => {
    expect(safeCallbackUrl("//evil.com")).toBe("/dashboard");
    expect(safeCallbackUrl("https://evil.com")).toBe("/dashboard");
  });
});
