import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_BYTES,
  fileExtension,
  isAllowedFileExtension,
  resolveUploadExtension,
  resolveUploadMimeType,
  validateFileUpload,
} from "@/lib/upload-policy";

describe("upload policy", () => {
  it("accepts allowed image types", () => {
    expect(
      validateFileUpload({
        size: 1024,
        type: "image/png",
        name: "a.png",
      }),
    ).toBeNull();
  });

  it("accepts pdf attachments", () => {
    expect(
      validateFileUpload({
        size: 1024,
        type: "application/pdf",
        name: "doc.pdf",
      }),
    ).toBeNull();
  });

  it("rejects oversized files", () => {
    expect(
      validateFileUpload({
        size: MAX_UPLOAD_BYTES + 1,
        type: "image/png",
        name: "big.png",
      }),
    ).toMatch(/不能超过/);
  });

  it("rejects unsupported extensions", () => {
    expect(
      validateFileUpload({
        size: 1024,
        type: "application/x-msdownload",
        name: "virus.exe",
      }),
    ).toMatch(/不支持/);
  });

  it("parses file extension", () => {
    expect(fileExtension("report.final.pdf")).toBe("pdf");
    expect(isAllowedFileExtension("docx")).toBe(true);
  });

  it("resolves mime from extension when browser omits type", () => {
    const file = { type: "", name: "notes.md" } as File;
    expect(resolveUploadMimeType(file)).toBe("text/markdown");
    expect(resolveUploadExtension(file, "text/markdown")).toBe("md");
  });
});
