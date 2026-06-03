"use client";

import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, X } from "lucide-react";

type Collaborator = {
  role: Role;
  user: { id: string; name: string | null; email: string };
};

type DocumentCollaboratorsProps = {
  documentId: string;
  owner: { id: string; name: string | null; email: string };
  collaborators: Collaborator[];
  canManage: boolean;
};

const roleLabels: Record<Role, string> = {
  OWNER: "所有者",
  EDITOR: "可编辑",
  VIEWER: "仅查看",
};

export function DocumentCollaborators({
  documentId,
  owner,
  collaborators,
  canManage,
}: DocumentCollaboratorsProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const members = [
    { user: owner, role: Role.OWNER as Role },
    ...collaborators.filter((c) => c.user.id !== owner.id),
  ];

  async function invite() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "邀请失败");
      }
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "邀请失败");
    } finally {
      setLoading(false);
    }
  }

  async function removeCollaborator(userId: string) {
    if (!confirm("确定移除该协作者？")) return;
    setError(null);
    const res = await fetch(
      `/api/documents/${documentId}/collaborators?userId=${userId}`,
      { method: "DELETE" },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "移除失败");
      return;
    }
    router.refresh();
  }

  async function changeRole(userId: string, newRole: "EDITOR" | "VIEWER") {
    setError(null);
    const res = await fetch(`/api/documents/${documentId}/collaborators`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "更新失败");
      return;
    }
    router.refresh();
  }

  return (
    <Card className="mt-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">协作者</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {members.map(({ user, role: memberRole }) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {user.name ?? user.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canManage && memberRole !== Role.OWNER ? (
                  <select
                    className="rounded-md border bg-background px-2 py-1 text-xs"
                    value={memberRole}
                    onChange={(e) =>
                      changeRole(
                        user.id,
                        e.target.value as "EDITOR" | "VIEWER",
                      )
                    }
                    aria-label={`${user.email} 的角色`}
                  >
                    <option value={Role.EDITOR}>可编辑</option>
                    <option value={Role.VIEWER}>仅查看</option>
                  </select>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {roleLabels[memberRole]}
                  </span>
                )}
                {canManage && memberRole !== Role.OWNER && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeCollaborator(user.id)}
                    aria-label="移除协作者"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {canManage && (
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">邀请协作者</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="同事邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "EDITOR" | "VIEWER")
                }
                aria-label="协作者角色"
              >
                <option value={Role.EDITOR}>可编辑</option>
                <option value={Role.VIEWER}>仅查看</option>
              </select>
              <Button
                type="button"
                onClick={invite}
                disabled={loading || !email.trim()}
                className="shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                {loading ? "邀请中…" : "邀请"}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
