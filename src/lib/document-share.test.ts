import { describe, expect, it } from "vitest";
import { buildPublicSharePath, buildPublicShareUrl } from "@/lib/document-share";

describe("document share URLs", () => {
  it("builds relative share path", () => {
    expect(buildPublicSharePath("abc123")).toBe("/share/abc123");
  });

  it("builds absolute share URL", () => {
    expect(buildPublicShareUrl("tok", "http://localhost:3000")).toBe(
      "http://localhost:3000/share/tok",
    );
  });

  it("strips trailing slash from origin", () => {
    expect(buildPublicShareUrl("tok", "http://localhost:3000/")).toBe(
      "http://localhost:3000/share/tok",
    );
  });
});
