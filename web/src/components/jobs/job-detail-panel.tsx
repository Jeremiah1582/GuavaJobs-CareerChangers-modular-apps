"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowSquareOut,
  Check,
  CircleNotch,
  MapPin,
  PaperPlaneTilt,
  PencilSimple,
  X,
} from "@phosphor-icons/react";
import { apiFetch, ApiError, publicApiFetch } from "@/api/client";
import type { JobListItem, UnifiedJob } from "@/api/types";
import { GenerateCta } from "@/components/applications/generate-cta";
import { ApplyGateModal } from "@/components/jobs/apply-gate-modal";
import { paperInputClass } from "@/components/ui/paper-panel";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { formatSalary } from "@/lib/jobs";
import {
  setPendingJobCookie,
  signUpUrlForPendingJob,
} from "@/lib/pending-job";
import { getAccessTokenOrNull } from "@/lib/session";

type JobDetailPanelProps = {
  /** List item shown immediately while detail loads */
  summary: JobListItem;
  showBack?: boolean;
  onBack?: () => void;
  /** Extra classes for the back button (e.g. hide on large desktop) */
  backClassName?: string;
  /** Lock document scroll (phone full-screen sheet) */
  lockBodyScroll?: boolean;
  /**
   * `public` gates Apply / employer links for signed-out users.
   * Generate is only shown when authenticated (or linked into the app board).
   */
  mode?: "app" | "public";
};

export function JobDetailPanel({
  summary,
  showBack = false,
  onBack,
  backClassName = "",
  lockBodyScroll = false,
  mode = "app",
}: JobDetailPanelProps) {
  const [gateOpen, setGateOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
    mode === "app" ? true : null,
  );
  const [jdEditing, setJdEditing] = useState(false);
  const [jdDraft, setJdDraft] = useState("");
  /** Local override — used for generate until an application exists. */
  const [jdOverride, setJdOverride] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "public") return;
    let cancelled = false;
    void getAccessTokenOrNull().then((token) => {
      if (!cancelled) setIsAuthenticated(!!token);
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const detailQuery = useQuery({
    queryKey: ["job", mode, summary.canonicalKey] as const,
    queryFn: async () => {
      const encoded = encodeURIComponent(summary.canonicalKey);
      const path = `/jobs/${encoded}?expand=ats`;
      if (mode === "public") {
        return publicApiFetch<UnifiedJob>(path);
      }
      const token = await getAccessTokenOrNull();
      return apiFetch<UnifiedJob>(path, { token: token ?? undefined });
    },
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (detailQuery.data) {
      track(AnalyticsEvents.job_detail_view, {
        canonicalKey: detailQuery.data.canonicalKey,
        atsType: detailQuery.data.atsType,
      });
    }
  }, [detailQuery.data]);

  useEffect(() => {
    if (!lockBodyScroll) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lockBodyScroll]);

  const job = detailQuery.data;
  const salary = formatSalary(
    (job ?? summary).salaryMin,
    (job ?? summary).salaryMax,
    (job ?? summary).salaryCurrency,
  );
  const apiDescription =
    job?.description?.trim() ||
    summary.snippet ||
    "";
  const effectiveDescription = (jdOverride ?? apiDescription).trim();
  const descriptionEdited =
    jdOverride != null && jdOverride.trim() !== apiDescription.trim();
  const applyUrl = job?.applyUrl ?? summary.applyUrl;
  const signedOut = mode === "public" && isAuthenticated === false;
  const signedIn = mode === "app" || isAuthenticated === true;
  const signUpHref = signUpUrlForPendingJob(summary.canonicalKey);

  useEffect(() => {
    setJdOverride(null);
    setJdEditing(false);
    setJdDraft("");
  }, [summary.canonicalKey]);

  useEffect(() => {
    if (jdEditing) return;
    setJdDraft(jdOverride ?? apiDescription);
  }, [apiDescription, jdEditing, jdOverride]);

  function startJdEdit() {
    setJdDraft(jdOverride ?? apiDescription);
    setJdEditing(true);
  }

  function saveJdEdit() {
    setJdOverride(jdDraft.trim());
    setJdEditing(false);
  }

  function cancelJdEdit() {
    setJdDraft(jdOverride ?? apiDescription);
    setJdEditing(false);
  }

  const employerLinkClass =
    "inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-guava-green/35 bg-guava-green/5 px-5 py-2.5 text-sm font-semibold text-guava-green transition-[transform,colors] hover:border-guava-green/55 hover:bg-guava-green/10 active:scale-[0.98] sm:w-auto";

  function requireAccount() {
    setPendingJobCookie(summary.canonicalKey);
    setGateOpen(true);
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain break-words [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {showBack && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className={[
              "mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground",
              backClassName,
            ].join(" ")}
          >
            <ArrowLeft className="size-4" weight="bold" aria-hidden />
            Back to list
          </button>
        ) : null}

        <header className="space-y-3 border-b border-guava-green/15 pb-4 sm:pb-5">
          <p className="text-sm text-muted-foreground">{summary.company}</p>
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl md:text-2xl">
            {summary.title}
          </h1>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {summary.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-guava-green" weight="duotone" />
                {summary.location}
              </span>
            ) : null}
            {salary ? <span>{salary}</span> : null}
          </div>
        </header>

        <section className="mt-5 pb-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </h2>
            {!detailQuery.isLoading &&
            !detailQuery.isError &&
            !jdEditing &&
            (effectiveDescription || apiDescription) ? (
              <button
                type="button"
                onClick={startJdEdit}
                className="inline-flex items-center gap-1 rounded-lg border border-guava-green/25 bg-white px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-guava-green/45 hover:text-foreground"
              >
                <PencilSimple className="size-3.5" weight="bold" />
                Edit
              </button>
            ) : null}
          </div>

          {descriptionEdited ? (
            <p className="mb-2 text-xs text-guava-green">
              Your edits will be used when you generate an application.
            </p>
          ) : null}

          {detailQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CircleNotch className="size-4 animate-spin" weight="bold" />
              Loading full listing…
            </div>
          ) : detailQuery.isError ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive" role="alert">
                {detailQuery.error instanceof ApiError
                  ? detailQuery.error.message
                  : "Could not load full details."}
              </p>
              {summary.snippet ? (
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {summary.snippet}
                </p>
              ) : null}
            </div>
          ) : jdEditing ? (
            <div className="space-y-3">
              <textarea
                value={jdDraft}
                onChange={(e) => setJdDraft(e.target.value)}
                rows={10}
                className={`${paperInputClass} min-h-[12rem] resize-y font-sans leading-relaxed`}
                placeholder="Paste the full job description from the employer page…"
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!jdDraft.trim()}
                  onClick={saveJdEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 active:scale-[0.98]"
                >
                  <Check className="size-4" weight="bold" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={cancelJdEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-guava-green/25 bg-white px-3 py-2 text-sm font-medium active:scale-[0.98]"
                >
                  <X className="size-4" weight="bold" />
                  Cancel
                </button>
              </div>
            </div>
          ) : effectiveDescription ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {effectiveDescription}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                No description yet. Open the employer listing for full details, or
                paste the text here.
              </p>
              <button
                type="button"
                onClick={startJdEdit}
                className="inline-flex items-center gap-1.5 rounded-xl border border-guava-green/25 bg-white px-3 py-2 text-sm font-medium transition-colors hover:border-guava-green/45 active:scale-[0.98]"
              >
                <PencilSimple className="size-4" weight="bold" />
                Paste description
              </button>
            </div>
          )}

          {job && !job.hasFullDescription && !jdEditing && !descriptionEdited ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Listing may be shortened. Open the employer page or paste the full
              text before generating.
            </p>
          ) : null}
        </section>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-guava-green/15 bg-white/90 pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:pb-0">
        {signedIn ? (
          <>
            {applyUrl ? (
              <a
                href={applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={employerLinkClass}
              >
                View full listing on employer site
                <ArrowSquareOut className="size-4" weight="bold" aria-hidden />
              </a>
            ) : null}
            {mode === "public" ? (
              <a
                href={`/app/jobs?job=${encodeURIComponent(summary.canonicalKey)}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-[transform,opacity] hover:opacity-90 active:scale-[0.98] sm:w-auto"
              >
                Generate in app
              </a>
            ) : (
              <GenerateCta
                canonicalJobKey={summary.canonicalKey}
                job={{
                  title: (job ?? summary).title,
                  company: (job ?? summary).company,
                  description: effectiveDescription || undefined,
                  applyUrl: applyUrl,
                  location: (job ?? summary).location,
                  snippet: summary.snippet,
                  atsType: (job ?? summary).atsType,
                }}
              />
            )}
          </>
        ) : signedOut ? (
          <>
            {applyUrl ? (
              <a
                href={applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={employerLinkClass}
              >
                View full listing on employer site
                <ArrowSquareOut className="size-4" weight="bold" aria-hidden />
              </a>
            ) : null}
            <button
              type="button"
              onClick={requireAccount}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-[transform,opacity] hover:opacity-90 active:scale-[0.98]"
            >
              <PaperPlaneTilt className="size-4" weight="duotone" aria-hidden />
              Apply
            </button>
          </>
        ) : (
          <div
            className="h-11 w-full animate-pulse rounded-xl bg-muted"
            aria-hidden
          />
        )}
      </div>

      <ApplyGateModal
        open={gateOpen}
        signUpHref={signUpHref}
        onClose={() => setGateOpen(false)}
      />
    </div>
  );
}
