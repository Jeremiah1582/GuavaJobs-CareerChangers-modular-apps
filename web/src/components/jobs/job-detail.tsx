"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowSquareOut, MapPin } from "@phosphor-icons/react";
import { apiFetch, ApiError } from "@/api/client";
import type { UnifiedJob } from "@/api/types";
import { PaperPanel } from "@/components/ui/paper-panel";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { decodeJobKey, formatSalary } from "@/lib/jobs";
import { getAccessToken } from "@/lib/session";
import { useEffect } from "react";

export function JobDetail({ canonicalKeyParam }: { canonicalKeyParam: string }) {
  const canonicalKey = decodeJobKey(canonicalKeyParam);

  const detailQuery = useQuery({
    queryKey: ["job", canonicalKey] as const,
    queryFn: async () => {
      const token = await getAccessToken();
      const encoded = encodeURIComponent(canonicalKey);
      return apiFetch<UnifiedJob>(`/jobs/${encoded}?expand=ats`, { token });
    },
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

  const job = detailQuery.data;
  const salary = job
    ? formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)
    : null;

  return (
    <div className="space-y-6">
      <Link
        href="/app/jobs"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-guava-green"
      >
        <ArrowLeft className="size-4" weight="bold" />
        Back to search
      </Link>

      {detailQuery.isLoading ? (
        <div
          className="h-64 animate-pulse rounded-2xl border border-guava-green/10 bg-white/50"
          aria-hidden
        />
      ) : detailQuery.isError ? (
        <PaperPanel className="border-destructive/30 p-6">
          <p className="text-sm text-destructive" role="alert">
            {detailQuery.error instanceof ApiError
              ? detailQuery.error.message
              : "Could not load this role."}
          </p>
          {detailQuery.error instanceof ApiError &&
          detailQuery.error.status === 404 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              This listing may have expired. Run a fresh search on the jobs
              page.
            </p>
          ) : null}
        </PaperPanel>
      ) : job ? (
        <>
          <PaperPanel className="border-guava-green/20 p-6 md:p-8">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {job.title}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">{job.company}</p>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {job.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin
                    className="size-4 text-guava-green"
                    weight="duotone"
                  />
                  {job.location}
                </span>
              ) : null}
              {salary ? <span>{salary}</span> : null}
            </div>

            {!job.hasFullDescription ? (
              <p className="mt-4 rounded-xl border border-guava-pink/20 bg-guava-pink/5 px-3 py-2 text-xs text-muted-foreground">
                Full employer description not cached yet. You can still open the
                apply link below.
              </p>
            ) : null}

            {job.description ? (
              <div className="mt-6 max-w-none text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {job.description.slice(0, 4000)}
                {job.description.length > 4000 ? "…" : ""}
              </div>
            ) : (
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                {job.snippet}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.13_150)] via-[oklch(0.58_0.16_150)] to-[oklch(0.48_0.13_155)] px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_32px_-12px_color-mix(in_oklab,var(--guava-green)_70%,transparent)] transition-[filter,transform] hover:brightness-[1.05]"
              >
                Open employer apply page
                <ArrowSquareOut className="size-4" weight="bold" />
              </a>
            </div>
          </PaperPanel>

          <p className="text-center text-xs text-muted-foreground">
            Jobs by Adzuna · Generate flow ships next in M2
          </p>
        </>
      ) : null}
    </div>
  );
}
