"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "@phosphor-icons/react";
import { AppPageShell } from "@/components/app/app-page-shell";
import { OwnerRouteGuard } from "@/hooks/use-me";
import { fetchAdminUsers, patchUserRole } from "@/api/admin";
import type { PlatformRole } from "@/api/types";
import { getAccessToken } from "@/lib/session";
import { PaperPanel } from "@/components/ui/paper-panel";

const ROLES: PlatformRole[] = ["USER", "ADMIN", "OWNER"];

function RolesContent() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const token = await getAccessToken();
      return fetchAdminUsers(token, 1, 50);
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({
      userId,
      platformRole,
    }: {
      userId: string;
      platformRole: PlatformRole;
    }) => {
      const token = await getAccessToken();
      return patchUserRole(token, userId, platformRole);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "engagement"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const users = usersQuery.data?.results ?? [];

  return (
    <AppPageShell
      title="Role management"
      description="Promote or demote platform roles. Owners cannot demote the last owner."
      wide
      badge={
        <Link
          href="/app/admin"
          className="text-sm font-medium text-guava-pink hover:underline"
        >
          ← Engagement
        </Link>
      }
    >
      <PaperPanel className="border-guava-green/15 overflow-x-auto p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-guava-pink" weight="duotone" />
          All users
        </h2>
        {usersQuery.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <table className="mt-4 w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-guava-green/15 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">Tier</th>
                <th className="pb-2 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-guava-green/8 last:border-0"
                >
                  <td className="py-2.5 pr-4 font-medium">{u.name}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {u.email}
                  </td>
                  <td className="py-2.5 pr-4">{u.tier}</td>
                  <td className="py-2.5">
                    <select
                      className="rounded-lg border border-guava-green/20 bg-white px-2 py-1 text-sm"
                      value={u.platformRole}
                      disabled={roleMutation.isPending}
                      onChange={(e) => {
                        const next = e.target.value as PlatformRole;
                        if (next === u.platformRole) return;
                        roleMutation.mutate({
                          userId: u.id,
                          platformRole: next,
                        });
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {roleMutation.isError ? (
          <p className="mt-3 text-sm text-destructive">
            Role update failed. The last owner cannot be demoted.
          </p>
        ) : null}
      </PaperPanel>
    </AppPageShell>
  );
}

export default function AdminRolesPage() {
  return (
    <OwnerRouteGuard>
      <RolesContent />
    </OwnerRouteGuard>
  );
}
