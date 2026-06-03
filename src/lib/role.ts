import { Role } from "@prisma/client";

export const ROLE_RANK: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  OWNER: 3,
};

export function roleMeetsMinimum(role: Role, minRole: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

/** Collab token uses a simplified write flag */
export type CollabAccessMode = "editor" | "viewer";

export function collabAccessModeForRole(role: Role): CollabAccessMode {
  return roleMeetsMinimum(role, Role.EDITOR) ? "editor" : "viewer";
}
