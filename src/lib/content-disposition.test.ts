import { describe, expect, it } from "vitest";
import {
  buildContentDisposition,
  parseContentDispositionFilename,
  sanitizeFilename,
} from "@/lib/content-disposition";

describe("content-disposition", () => {
  it("sanitizes unsafe filename characters", () => {
    expect(sanitizeFilename("报告/草稿?")).toBe("报告_草稿_");
    expect(sanitizeFilename("   ")).toBe("document");
  });

  it("builds RFC 5987 header for non-ascii filenames", () => {
    const header = buildContentDisposition("我的报告.html");
    expect(header).toMatch(/^attachment; filename="download\.html"/);
    expect(header).toContain("filename*=UTF-8''");
    expect(header).toContain(encodeURIComponent("我的报告.html"));
  });

  it("round-trips filename via parse", () => {
    const header = buildContentDisposition("团队文档.json");
    expect(parseContentDispositionFilename(header)).toBe("团队文档.json");
  });
});
