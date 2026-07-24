import { apiFetch } from "@/api/client";
import type {
  AdminEngagementUsersResponse,
  AdminOwnerUsersResponse,
  EngagementSummary,
  PlatformRole,
} from "@/api/types";

export async function fetchEngagementSummary(token: string) {
  return apiFetch<EngagementSummary>("/admin/engagement/summary", { token });
}

export async function fetchEngagementUsers(
  token: string,
  page = 1,
  limit = 25,
) {
  return apiFetch<AdminEngagementUsersResponse>(
    `/admin/engagement/users?page=${page}&limit=${limit}`,
    { token },
  );
}

export async function fetchAdminUsers(token: string, page = 1, limit = 25) {
  return apiFetch<AdminOwnerUsersResponse>(
    `/admin/users?page=${page}&limit=${limit}`,
    { token },
  );
}

export async function patchUserRole(
  token: string,
  userId: string,
  platformRole: PlatformRole,
) {
  return apiFetch(`/admin/users/${userId}/role`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ platformRole }),
  });
}
