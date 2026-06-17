import { describe, expect, it } from "vitest";
import { listLocalMigrationNames } from "@/lib/db-migrations-local";
import { oauthErrorMessage } from "@/lib/oauth-errors";

describe("db migrations", () => {
  it("lists local migration folders", () => {
    const names = listLocalMigrationNames();
    expect(names.length).toBeGreaterThan(0);
    expect(names[0]).toMatch(/^\d{14}_/);
  });
});

describe("oauth errors", () => {
  it("maps known oauth error codes", () => {
    expect(oauthErrorMessage("OAuthAccountNotLinked")).toContain("密码");
    expect(oauthErrorMessage(null)).toBeNull();
  });
});
