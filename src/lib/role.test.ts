import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { collabAccessModeForRole, roleMeetsMinimum } from "@/lib/role";

describe("roleMeetsMinimum", () => {
  it("VIEWER cannot meet EDITOR requirement", () => {
    expect(roleMeetsMinimum(Role.VIEWER, Role.EDITOR)).toBe(false);
  });

  it("EDITOR meets VIEWER requirement", () => {
    expect(roleMeetsMinimum(Role.EDITOR, Role.VIEWER)).toBe(true);
  });

  it("OWNER meets all requirements", () => {
    expect(roleMeetsMinimum(Role.OWNER, Role.EDITOR)).toBe(true);
    expect(roleMeetsMinimum(Role.OWNER, Role.VIEWER)).toBe(true);
  });
});

describe("collabAccessModeForRole", () => {
  it("maps VIEWER to viewer mode", () => {
    expect(collabAccessModeForRole(Role.VIEWER)).toBe("viewer");
  });

  it("maps EDITOR and OWNER to editor mode", () => {
    expect(collabAccessModeForRole(Role.EDITOR)).toBe("editor");
    expect(collabAccessModeForRole(Role.OWNER)).toBe("editor");
  });
});
