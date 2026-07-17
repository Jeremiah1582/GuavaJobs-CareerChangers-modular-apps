"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowSquareOut,
  CircleNotch,
  MapPin,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { apiFetch, ApiError, publicApiFetch } from "@/api/client";
import type { JobListItem, UnifiedJob } from "@/api/types";
import { GenerateCta } from "@/components/applications/generate-cta";
import { ApplyGateModal } from "@/components/jobs/apply-gate-modal";
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
  const description =
    job?.description?.trim() ||
    summary.snippet ||
    "";
  const applyUrl = job?.applyUrl ?? summary.applyUrl;
  const signedOut = mode === "public" && isAuthenticated === false;
  const signedIn = mode === "app" || isAuthenticated === true;
  const signUpHref = signUpUrlForPendingJob(summary.canonicalKey);

  function requireAccount() {
    setPendingJobCookie(summary.canonicalKey);
    setGateOpen(true);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Description
          </h2>

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
          ) : description ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {description.slice(0, 4000)}
              {description.length > 4000 ? "…" : ""}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
              No description yet. Open the employer listing for full details.
            </p>
          )}

          {job && !job.hasFullDescription ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Full employer description may still be loading on the API side.
            </p>
          ) : null}
        </section>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-guava-green/15 bg-white/90 pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:pb-0">
        {signedIn ? (
          <>
            {mode === "public" ? (
              <a
                href={`/app/jobs?job=${encodeURIComponent(summary.canonicalKey)}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-[transform,opacity] hover:opacity-90 active:scale-[0.98] sm:w-auto"
              >
                Generate in app
              </a>
            ) : (
              <GenerateCta canonicalJobKey={summary.canonicalKey} />
            )}
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-guava-green sm:min-h-0"
            >
              Open employer page
              <ArrowSquareOut className="size-4" weight="bold" aria-hidden />
            </a>
          </>
        ) : signedOut ? (
          <>
            <button
              type="button"
              onClick={requireAccount}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-[transform,opacity] hover:opacity-90 active:scale-[0.98]"
            >
              <PaperPlaneTilt className="size-4" weight="duotone" aria-hidden />
              Apply
            </button>
            <button
              type="button"
              onClick={requireAccount}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-guava-green sm:min-h-0"
            >
              Open employer page
              <ArrowSquareOut className="size-4" weight="bold" aria-hidden />
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
