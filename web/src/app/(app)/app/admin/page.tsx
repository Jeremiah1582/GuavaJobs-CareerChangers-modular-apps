"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChartBar,
  GlobeHemisphereWest,
  MagnifyingGlass,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";
import { AppPageShell } from "@/components/app/app-page-shell";
import { AdminRouteGuard, useMeQuery } from "@/hooks/use-me";
import { fetchEngagementSummary, fetchEngagementUsers } from "@/api/admin";
import { getAccessToken } from "@/lib/session";
import { PaperPanel } from "@/components/ui/paper-panel";

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `${hours}h ${rem}m`;
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: Icon;
}) {
  return (
    <PaperPanel className="border-guava-green/15 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <Icon className="size-6 shrink-0 text-guava-pink" weight="duotone" />
      </div>
    </PaperPanel>
  );
}

function AdminDashboardContent() {
  const { data: me } = useMeQuery();
  const summaryQuery = useQuery({
    queryKey: ["admin", "engagement", "summary"],
    queryFn: async () => {
      const token = await getAccessToken();
      return fetchEngagementSummary(token);
    },
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "engagement", "users"],
    queryFn: async () => {
      const token = await getAccessToken();
      return fetchEngagementUsers(token, 1, 20);
    },
  });

  const summary = summaryQuery.data;
  const users = usersQuery.data?.results ?? [];

  return (
    <AppPageShell
      title="Engagement"
      description="Platform signups, sessions, and search activity. User list is sanitized — no email or PII."
      wide
      badge={
        me?.platformRole === "OWNER" ? (
          <Link
            href="/app/admin/roles"
            className="text-sm font-medium text-guava-pink hover:underline"
          >
            Manage roles →
          </Link>
        ) : undefined
      }
    >
      {summaryQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading metrics…</p>
      ) : summary ? (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Total signups"
              value={summary.signups.total}
              icon={UsersThree}
            />
            <KpiCard
              label="Avg session"
              value={formatDuration(summary.sessions.avgDurationMs)}
              hint={`${summary.sessions.totalEnded} ended sessions`}
              icon={ChartBar}
            />
            <KpiCard
              label="Peak signup day"
              value={summary.peaks.weekday.label}
              hint={`${summary.peaks.weekday.count} signups`}
              icon={ChartBar}
            />
            <KpiCard
              label="Peak calendar day"
              value={`Day ${summary.peaks.dayOfMonth.day}`}
              hint={`${summary.peaks.dayOfMonth.count} signups`}
              icon={ChartBar}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PaperPanel className="border-guava-green/15 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <GlobeHemisphereWest className="size-4 text-guava-pink" />
                Top regions
              </h2>
              <ul className="mt-4 space-y-2 text-sm">
                {summary.topRegions.length === 0 ? (
                  <li className="text-muted-foreground">No data yet</li>
                ) : (
                  summary.topRegions.map((r) => (
                    <li
                      key={r.country}
                      className="flex justify-between gap-4 border-b border-guava-green/10 py-2 last:border-0"
                    >
                      <span className="font-medium">{r.country}</span>
                      <span className="text-muted-foreground">
                        {r.searches} searches · {r.logins} logins
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </PaperPanel>

            <PaperPanel className="border-guava-green/15 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <MagnifyingGlass className="size-4 text-guava-pink" />
                Top search terms
              </h2>
              <ul className="mt-4 space-y-2 text-sm">
                {summary.topSearchTerms.length === 0 ? (
                  <li className="text-muted-foreground">No data yet</li>
                ) : (
                  summary.topSearchTerms.map((t) => (
                    <li
                      key={t.term}
                      className="flex justify-between gap-4 border-b border-guava-green/10 py-2 last:border-0"
                    >
                      <span className="truncate font-medium">{t.term}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {t.count}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </PaperPanel>
          </div>

          {summary.topIndustries.length > 0 ? (
            <PaperPanel className="border-guava-green/15 p-5">
              <h2 className="text-sm font-semibold">Top industries (searches)</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {summary.topIndustries.map((i) => (
                  <li
                    key={i.industry}
                    className="rounded-full border border-guava-green/20 bg-white/60 px-3 py-1 text-xs font-medium"
                  >
                    {i.industry}{" "}
                    <span className="text-muted-foreground">({i.count})</span>
                  </li>
                ))}
              </ul>
            </PaperPanel>
          ) : null}

          <PaperPanel className="border-guava-green/15 overflow-x-auto p-5">
            <h2 className="text-sm font-semibold">Recent users (sanitized)</h2>
            <table className="mt-4 w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-guava-green/15 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Region</th>
                  <th className="pb-2 pr-4 font-medium">Tier</th>
                  <th className="pb-2 pr-4 font-medium">Role</th>
                  <th className="pb-2 font-medium">Joined</th>
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
                      {u.region ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4">{u.tier}</td>
                    <td className="py-2.5 pr-4">{u.platformRole}</td>
                    <td className="py-2.5 text-muted-foreground">
                      {new Date(u.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PaperPanel>
        </div>
      ) : (
        <p className="text-sm text-destructive">
          Could not load engagement data.
        </p>
      )}
    </AppPageShell>
  );
}

export default function AdminPage() {
  return (
    <AdminRouteGuard>
      <AdminDashboardContent />
    </AdminRouteGuard>
  );
}
