"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { apiFetch, ApiError } from "@/api/client";
import type { ApplicationResponse, ApplicationStatus } from "@/api/types";
import { StatusChip } from "@/components/applications/status-chip";
import { PaperPanel, paperInputClass } from "@/components/ui/paper-panel";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  applicationCompany,
  applicationTitle,
  formatShortDate,
  setHasApplicationsCookie,
} from "@/lib/applications";
import { getAccessToken } from "@/lib/session";

export function TrackerList() {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [submitted, setSubmitted] = useState({
    status: "" as ApplicationStatus | "",
    company: "",
  });

  const listQuery = useQuery({
    queryKey: [
      "applications",
      submitted.status,
      submitted.company,
    ] as const,
    queryFn: async () => {
      const token = await getAccessToken();
      const params = new URLSearchParams();
      if (submitted.status) params.set("status", submitted.status);
      if (submitted.company.trim())
        params.set("companyName", submitted.company.trim());
      const qs = params.toString();
      return apiFetch<ApplicationResponse[]>(
        `/applications${qs ? `?${qs}` : ""}`,
        { token },
      );
    },
    staleTime: 15_000,
    retry: 1,
  });

  useEffect(() => {
    if (!listQuery.data) return;
    // Unfiltered total: if filters active and empty, don't clear cookie.
    if (!submitted.status && !submitted.company.trim()) {
      setHasApplicationsCookie(listQuery.data.length > 0);
    } else if (listQuery.data.length > 0) {
      setHasApplicationsCookie(true);
    }
  }, [listQuery.data, submitted.status, submitted.company]);

  const apps = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  function onFilter(e: FormEvent) {
    e.preventDefault();
    setSubmitted({ status: statusFilter, company: companyFilter });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form
          onSubmit={onFilter}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Status</span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ApplicationStatus | "")
              }
              className={paperInputClass}
            >
              <option value="">All</option>
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Company</span>
            <input
              type="search"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className={paperInputClass}
              placeholder="Filter by company"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl border border-guava-green/25 bg-white/80 px-4 py-2.5 text-sm font-medium transition-colors hover:border-guava-green/45"
          >
            Filter
          </button>
        </form>

        <Link
          href="/app/applications/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-[transform,opacity] hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="size-4" weight="bold" />
          Add manually
        </Link>
      </div>

      {listQuery.isLoading ? (
        <div className="space-y-0 divide-y divide-guava-green/10 rounded-2xl border border-guava-green/15 bg-white/60">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : listQuery.isError ? (
        <PaperPanel className="border-destructive/30 p-6">
          <p className="text-sm text-destructive" role="alert">
            {listQuery.error instanceof ApiError
              ? listQuery.error.message
              : "Could not load applications."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Check your connection, then refresh.
          </p>
        </PaperPanel>
      ) : apps.length === 0 ? (
        <PaperPanel className="border-guava-green/20 p-8 text-center">
          <h2 className="text-base font-semibold tracking-tight">
            No applications yet
          </h2>
          <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
            Generate a package from Jobs, or log a role you already applied to.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/app/jobs"
              className="inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Browse jobs
            </Link>
            <Link
              href="/app/applications/new"
              className="inline-flex rounded-xl border border-guava-green/25 bg-white px-4 py-2.5 text-sm font-medium"
            >
              Add manually
            </Link>
          </div>
        </PaperPanel>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-guava-green/15 bg-white/70">
          <ul className="divide-y divide-guava-green/10">
            {apps.map((app) => {
              const title = applicationTitle(app);
              const company = applicationCompany(app);
              return (
                <li key={app.id}>
                  <Link
                    href={`/app/applications/${app.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-guava-green/5 md:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium tracking-tight">
                        {title}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {company ?? "Unknown company"}
                        {app.generationMode === "MANUAL" ? " · Manual" : ""}
                        {" · "}
                        {formatShortDate(app.updatedAt)}
                      </p>
                    </div>
                    <StatusChip status={app.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
