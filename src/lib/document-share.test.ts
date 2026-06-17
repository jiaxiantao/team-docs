import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildPublicSharePath,
  buildPublicShareUrl,
  computeShareExpiresAt,
  isShareExpired,
} from "@/lib/document-share";

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

describe("share expiry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-12T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes expiresAt from days", () => {
    expect(computeShareExpiresAt(7)?.toISOString()).toBe(
      "2026-06-19T12:00:00.000Z",
    );
  });

  it("returns null for permanent share", () => {
    expect(computeShareExpiresAt(null)).toBeNull();
    expect(computeShareExpiresAt(0)).toBeNull();
  });

  it("detects expired share", () => {
    const past = new Date("2026-06-01T00:00:00Z");
    expect(isShareExpired(past)).toBe(true);
    expect(isShareExpired(null)).toBe(false);
  });
});
