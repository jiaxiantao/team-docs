import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTO_SNAPSHOT_INTERVAL_MS,
  isAutoSnapshotDue,
  MAX_SNAPSHOTS_PER_DOCUMENT,
} from "@/lib/document-snapshot";

describe("document snapshot", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-12T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exports snapshot limits", () => {
    expect(MAX_SNAPSHOTS_PER_DOCUMENT).toBe(20);
    expect(AUTO_SNAPSHOT_INTERVAL_MS).toBe(30 * 60 * 1000);
  });

  it("creates first auto snapshot immediately", () => {
    expect(isAutoSnapshotDue(null)).toBe(true);
  });

  it("skips auto snapshot within interval", () => {
    const last = new Date("2026-06-12T11:45:00Z");
    expect(isAutoSnapshotDue(last)).toBe(false);
  });

  it("creates auto snapshot after interval", () => {
    const last = new Date("2026-06-12T11:00:00Z");
    expect(isAutoSnapshotDue(last)).toBe(true);
  });
});
