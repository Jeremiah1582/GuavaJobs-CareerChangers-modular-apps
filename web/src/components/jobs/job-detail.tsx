"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "@phosphor-icons/react";
import { apiFetch } from "@/api/client";
import type { UnifiedJob } from "@/api/types";
import { JobDetailPanel } from "@/components/jobs/job-detail-panel";
import { decodeJobKey } from "@/lib/jobs";
import { getAccessToken } from "@/lib/session";

/**
 * Deep-link fallback for `/app/jobs/[canonicalKey]`.
 * Primary UX is the split board on `/app/jobs?job=…`.
 */
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

  const job = detailQuery.data;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 md:px-6">
      <Link
        href="/app/jobs"
        className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-guava-green"
      >
        <ArrowLeft className="size-4" weight="bold" />
        Back to jobs
      </Link>

      {detailQuery.isLoading || !job ? (
        <div
          className="h-64 animate-pulse rounded-2xl border border-guava-green/10 bg-white/50"
          aria-hidden
        />
      ) : (
        <div className="min-h-[28rem] rounded-2xl border border-guava-green/20 bg-white/95 p-5 shadow-sm md:p-6">
          <JobDetailPanel summary={job} />
        </div>
      )}
    </div>
  );
}
