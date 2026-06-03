import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  signCollabToken,
  verifyCollabToken,
} from "@/lib/collab-token";

const SECRET = "test-collab-secret-for-unit-tests";

describe("collab token", () => {
  beforeEach(() => {
    process.env.COLLAB_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.COLLAB_SECRET;
  });

  it("round-trips a valid token", () => {
    const token = signCollabToken({
      userId: "user-1",
      documentId: "doc-1",
      name: "Tester",
      color: "#60a5fa",
      access: "editor",
    });

    const payload = verifyCollabToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe("user-1");
    expect(payload?.documentId).toBe("doc-1");
    expect(payload?.access).toBe("editor");
  });

  it("rejects tampered signature", () => {
    const token = signCollabToken({
      userId: "user-1",
      documentId: "doc-1",
      name: "Tester",
      color: "#60a5fa",
      access: "viewer",
    });
    const [body] = token.split(".");
    const bad = `${body}.invalid-signature`;
    expect(verifyCollabToken(bad)).toBeNull();
  });

  it("includes viewer access mode in payload", () => {
    const token = signCollabToken({
      userId: "user-1",
      documentId: "doc-1",
      name: "Viewer",
      color: "#a3e635",
      access: "viewer",
    });
    expect(verifyCollabToken(token)?.access).toBe("viewer");
  });

  it("requires COLLAB_SECRET", () => {
    delete process.env.COLLAB_SECRET;
    expect(() =>
      signCollabToken({
        userId: "u",
        documentId: "d",
        name: "n",
        color: "#000",
        access: "editor",
      }),
    ).toThrow();
  });
});
