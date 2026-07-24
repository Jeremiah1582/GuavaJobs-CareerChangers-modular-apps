"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { MeResponse, PlatformRole } from "@/api/types";
import { getAccessTokenOrNull } from "@/lib/session";

export function isStaffRole(role: PlatformRole | undefined): boolean {
  return role === "ADMIN" || role === "OWNER";
}

export function useMeQuery() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const token = await getAccessTokenOrNull();
      if (!token) return null;
      return apiFetch<MeResponse>("/me", { token });
    },
    staleTime: 60_000,
  });
}

/** Redirect non-staff away from /app/admin/* routes. */
export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: me, isLoading } = useMeQuery();

  useEffect(() => {
    if (isLoading) return;
    if (!me || !isStaffRole(me.platformRole)) {
      router.replace("/app/jobs");
    }
  }, [isLoading, me, router]);

  if (isLoading || !me || !isStaffRole(me.platformRole)) {
    return null;
  }

  return <>{children}</>;
}

/** Owner-only routes — Admins redirected to engagement dashboard. */
export function OwnerRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: me, isLoading } = useMeQuery();

  useEffect(() => {
    if (isLoading) return;
    if (!me || me.platformRole !== "OWNER") {
      router.replace("/app/admin");
    }
  }, [isLoading, me, router]);

  if (isLoading || !me || me.platformRole !== "OWNER") {
    return null;
  }

  return <>{children}</>;
}
