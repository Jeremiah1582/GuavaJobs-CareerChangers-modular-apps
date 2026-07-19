"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CircleNotch, Plus, Trash } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { apiFetch, ApiError } from "@/api/client";
import type { ApplicationResponse, ApplicationStatus } from "@/api/types";
import { StatusChip } from "@/components/applications/status-chip";
import { paperInputClass } from "@/components/ui/paper-panel";
import { EmptyState, ErrorState } from "@/components/ui/state-panel";
import { AnalyticsEvents, track } from "@/lib/analytics";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  applicationCompany,
  applicationTitle,
  formatShortDate,
  setHasApplicationsCookie,
} from "@/lib/applications";
import { getAccessToken } from "@/lib/session";
import { useOnlineStatus } from "@/lib/online";

/** What cascade-deletes with the application row (profile / master CV are kept). */
function cascadeDeleteItems(app: ApplicationResponse): string[] {
  const items: string[] = [];
  if (app.coverLetterContent?.trim()) {
    items.push("Cover letter");
  }
  if (app.atsReport) {
    items.push("ATS fit report");
  }
  if (app.generatedCv) {
    items.push("Tailored CV");
  }
  if (app.jobSnapshot || app.cvSnapshot || app.profileSnapshot) {
    items.push("Saved job, profile, and CV snapshots");
  }
  if (app.events !== undefined) {
    if (app.events.length > 0) {
      items.push(
        `Timeline (${app.events.length} ${
          app.events.length === 1 ? "event" : "events"
        }: notes, interviews, responses)`,
      );
    }
  } else {
    items.push("Any timeline events (notes, interviews, responses)");
  }
  return items;
}

function DeleteApplicationSheet({
  app,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  app: ApplicationResponse | null;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const reduce = useReducedMotion();
  const open = !!app;
  const title = app ? applicationTitle(app) : "";
  const company = app ? applicationCompany(app) : null;
  const cascade = app ? cascadeDeleteItems(app) : [];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 sm:items-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={busy ? undefined : onCancel}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-application-title"
            className="w-full max-w-md rounded-2xl border border-destructive/25 bg-white p-6 shadow-[0_24px_64px_-24px_rgb(0_0_0_/_0.28)]"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-application-title"
              className="text-lg font-semibold tracking-tight"
            >
              Delete this application?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{title}</span>
              {company ? ` at ${company}` : ""} will be permanently removed from
              your tracker. This cannot be undone.
            </p>

            {cascade.length > 0 ? (
              <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-destructive">
                  Also deleted
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-foreground/90">
                  {cascade.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Your profile and uploaded master CV are kept.
            </p>

            {error ? (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={busy}
                onClick={onConfirm}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-white transition-[transform,opacity] hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              >
                {busy ? (
                  <CircleNotch className="size-4 animate-spin" weight="bold" />
                ) : (
                  <Trash className="size-4" weight="bold" />
                )}
                Delete permanently
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onCancel}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-guava-green/25 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function TrackerList() {
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [submitted, setSubmitted] = useState({
    status: "" as ApplicationStatus | "",
    company: "",
  });
  const [pendingDelete, setPendingDelete] =
    useState<ApplicationResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    enabled: online,
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

  const deleteMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const token = await getAccessToken();
      return apiFetch<{ deleted: boolean }>(`/applications/${applicationId}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: (_data, applicationId) => {
      track(AnalyticsEvents.application_deleted, { applicationId });
      setPendingDelete(null);
      setDeleteError(null);
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      void queryClient.removeQueries({
        queryKey: ["application", applicationId],
      });
    },
    onError: (err) => {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : "Could not delete this application.",
      );
    },
  });

  function onFilter(e: FormEvent) {
    e.preventDefault();
    setSubmitted({ status: statusFilter, company: companyFilter });
  }

  async function openDelete(app: ApplicationResponse) {
    setDeleteError(null);
    setPendingDelete(app);
    try {
      const token = await getAccessToken();
      const detail = await apiFetch<ApplicationResponse>(
        `/applications/${app.id}`,
        { token },
      );
      setPendingDelete((current) =>
        current?.id === app.id ? detail : current,
      );
    } catch {
      // Keep list payload — cascade list still covers letter / ATS / CV.
    }
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
      ) : !online ? (
        <ErrorState
          title="You're offline"
          message="The tracker needs a network connection to load."
          nextAction="Reconnect, then retry."
          onRetry={() => void listQuery.refetch()}
        />
      ) : listQuery.isError ? (
        <ErrorState
          title="Could not load applications"
          message={
            listQuery.error instanceof ApiError
              ? listQuery.error.message
              : "Could not load applications."
          }
          nextAction="Check your connection, then retry."
          onRetry={() => void listQuery.refetch()}
        />
      ) : apps.length === 0 ? (
        <EmptyState
          title="No applications yet"
          body="Generate a package from Jobs, or log a role you already applied to."
          action={
            <>
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
            </>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-guava-green/15 bg-white/70">
          <ul className="divide-y divide-guava-green/10">
            {apps.map((app) => {
              const title = applicationTitle(app);
              const company = applicationCompany(app);
              return (
                <li key={app.id}>
                  <div className="flex items-stretch gap-1 pr-2 transition-colors hover:bg-guava-green/5 md:pr-3">
                    <Link
                      href={`/app/applications/${app.id}`}
                      className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-5"
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
                    <button
                      type="button"
                      aria-label={`Delete ${title}`}
                      title="Delete application"
                      onClick={() => openDelete(app)}
                      className="my-3 shrink-0 self-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash className="size-4" weight="bold" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <DeleteApplicationSheet
        app={pendingDelete}
        busy={deleteMutation.isPending}
        error={deleteError}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteMutation.mutate(pendingDelete.id);
        }}
        onCancel={() => {
          if (deleteMutation.isPending) return;
          setPendingDelete(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
