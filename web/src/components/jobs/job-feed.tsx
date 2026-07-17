"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError, publicApiFetch } from "@/api/client";
import type { JobSearchResponse } from "@/api/types";
import { JobsBoard } from "@/components/jobs/jobs-board";
import { JobsSearchBar } from "@/components/jobs/jobs-search-bar";
import { ErrorState } from "@/components/ui/state-panel";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { useOnlineStatus } from "@/lib/online";
import { getAccessTokenOrNull } from "@/lib/session";

type JobFeedProps = {
  mode?: "app" | "public";
};

export function JobFeed({ mode = "app" }: JobFeedProps) {
  const online = useOnlineStatus();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedKey = searchParams.get("job");

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(searchParams.get("where") ?? "");
  const [submitted, setSubmitted] = useState({
    q: searchParams.get("q") ?? "",
    location: searchParams.get("where") ?? "",
    page: Number(searchParams.get("page") ?? "1") || 1,
  });

  const searchQuery = useQuery({
    queryKey: [
      "jobs",
      submitted.q,
      submitted.location,
      submitted.page,
    ] as const,
    queryFn: async () => {
      const params = new URLSearchParams({
        country: "gb",
        page: String(submitted.page),
      });
      if (submitted.q.trim()) params.set("q", submitted.q.trim());
      if (submitted.location.trim())
        params.set("location", submitted.location.trim());

      if (mode === "public") {
        return publicApiFetch<JobSearchResponse>(`/jobs/search?${params}`);
      }

      const token = await getAccessTokenOrNull();
      return apiFetch<JobSearchResponse>(`/jobs/search?${params}`, {
        token: token ?? undefined,
      });
    },
    enabled: online,
    staleTime: 30_000,
    retry: 1,
  });

  const syncUrl = useCallback(
    (opts: {
      q?: string;
      location?: string;
      page?: number;
      job?: string | null;
    }) => {
      const params = new URLSearchParams();
      const q = opts.q ?? submitted.q;
      const loc = opts.location ?? submitted.location;
      const page = opts.page ?? submitted.page;
      const job =
        opts.job === undefined ? selectedKey : opts.job;

      if (q.trim()) params.set("q", q.trim());
      if (loc.trim()) params.set("where", loc.trim());
      if (page > 1) params.set("page", String(page));
      if (job) params.set("job", job);

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, selectedKey, submitted.location, submitted.page, submitted.q],
  );

  function onSearch() {
    const next = { q: query, location, page: 1 };
    setSubmitted(next);
    syncUrl({ ...next, job: null });
    track(AnalyticsEvents.job_search, {
      q: query.trim() || null,
      location: location.trim() || null,
      page: 1,
    });
  }

  const selectJob = useCallback(
    (canonicalKey: string) => {
      syncUrl({ job: canonicalKey });
    },
    [syncUrl],
  );

  const clearSelection = useCallback(() => {
    syncUrl({ job: null });
  }, [syncUrl]);

  const data = searchQuery.data;
  const totalPages =
    data && data.totalResults > 0
      ? Math.max(1, Math.ceil(data.totalResults / 20))
      : 1;

  return (
    <div className="flex min-h-0 flex-col gap-5">
      <JobsSearchBar
        query={query}
        location={location}
        onQueryChange={setQuery}
        onLocationChange={setLocation}
        onSubmit={onSearch}
        pending={searchQuery.isFetching && !searchQuery.isFetched}
      />

      {!online ? (
        <ErrorState
          title="You're offline"
          message="Job search needs a network connection."
          nextAction="Reconnect, then retry search."
          onRetry={() => void searchQuery.refetch()}
        />
      ) : searchQuery.isError ? (
        <ErrorState
          title="Search failed"
          message={
            searchQuery.error instanceof ApiError
              ? searchQuery.error.message
              : "Search failed. Try again."
          }
          nextAction={
            searchQuery.error instanceof ApiError &&
            searchQuery.error.code === "JOBS_NOT_CONFIGURED"
              ? "The API needs ADZUNA_APP_ID and ADZUNA_API_KEY on Coolify."
              : "Check your connection, broaden keywords, or try again."
          }
          onRetry={() => void searchQuery.refetch()}
        />
      ) : (
        <>
          {data && data.results.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {data.totalResults.toLocaleString()}
              </span>{" "}
              {data.totalResults === 1 ? "job" : "jobs"}
              {submitted.q.trim() ? ` matching “${submitted.q.trim()}”` : ""}
              {submitted.location.trim()
                ? ` in ${submitted.location.trim()}`
                : ""}
            </p>
          ) : null}

          <JobsBoard
            jobs={data?.results ?? []}
            loading={searchQuery.isLoading}
            selectedKey={selectedKey}
            onSelect={selectJob}
            onClear={clearSelection}
            mode={mode}
            emptyMessage="Try broader keywords or a different location. Default market is GB."
          />

          {data && data.results.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={submitted.page <= 1 || searchQuery.isFetching}
                onClick={() => {
                  const page = Math.max(1, submitted.page - 1);
                  setSubmitted((s) => ({ ...s, page }));
                  syncUrl({ page, job: null });
                }}
                className="rounded-lg border border-guava-green/20 bg-white/80 px-3 py-1.5 text-sm font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-mono text-xs text-muted-foreground">
                {submitted.page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={
                  submitted.page >= totalPages || searchQuery.isFetching
                }
                onClick={() => {
                  const page = submitted.page + 1;
                  setSubmitted((s) => ({ ...s, page }));
                  syncUrl({ page, job: null });
                }}
                className="rounded-lg border border-guava-green/20 bg-white/80 px-3 py-1.5 text-sm font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}

          {data?.attribution ? (
            <p className="text-center text-xs text-muted-foreground">
              {data.attribution}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
