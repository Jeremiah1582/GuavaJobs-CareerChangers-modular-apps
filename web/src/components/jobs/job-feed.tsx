"use client";

import { useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import type { JobSearchResponse } from "@/api/types";
import { JobCard } from "@/components/jobs/job-card";
import { PaperPanel, paperInputClass } from "@/components/ui/paper-panel";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { getAccessToken } from "@/lib/session";

function FeedSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-2xl border border-guava-green/10 bg-white/50"
        />
      ))}
    </div>
  );
}

export function JobFeed() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [submitted, setSubmitted] = useState({ q: "", location: "", page: 1 });

  const searchQuery = useQuery({
    queryKey: [
      "jobs",
      submitted.q,
      submitted.location,
      submitted.page,
    ] as const,
    queryFn: async () => {
      const token = await getAccessToken();
      const params = new URLSearchParams({
        country: "gb",
        page: String(submitted.page),
      });
      if (submitted.q.trim()) params.set("q", submitted.q.trim());
      if (submitted.location.trim())
        params.set("location", submitted.location.trim());

      return apiFetch<JobSearchResponse>(`/jobs/search?${params}`, { token });
    },
    retry: 1,
  });

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setSubmitted({ q: query, location, page: 1 });
    track(AnalyticsEvents.job_search, {
      q: query.trim() || null,
      location: location.trim() || null,
      page: 1,
    });
  }

  const data = searchQuery.data;
  const totalPages =
    data && data.totalResults > 0
      ? Math.max(1, Math.ceil(data.totalResults / 20))
      : 1;

  return (
    <div className="space-y-8">
      <PaperPanel className="border-guava-pink/15 p-5 md:p-6">
        <form onSubmit={onSearch} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Keywords</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={paperInputClass}
              placeholder="e.g. product designer, TypeScript"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Location</span>
            <input
              type="search"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={paperInputClass}
              placeholder="e.g. London, Remote"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-br from-[oklch(0.68_0.13_150)] via-[oklch(0.58_0.16_150)] to-[oklch(0.48_0.13_155)] px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_32px_-12px_color-mix(in_oklab,var(--guava-green)_70%,transparent)] transition-[filter,transform] hover:brightness-[1.05] active:scale-[0.98] disabled:opacity-60 md:w-auto"
              disabled={searchQuery.isFetching && !searchQuery.isFetched}
            >
              {searchQuery.isFetching ? "Searching…" : "Search jobs"}
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Default country: GB. Results may include listings powered by Adzuna.
        </p>
      </PaperPanel>

      {searchQuery.isLoading ? (
        <FeedSkeleton />
      ) : searchQuery.isError ? (
        <PaperPanel className="border-destructive/30 p-6">
          <p className="text-sm text-destructive" role="alert">
            {searchQuery.error instanceof ApiError
              ? searchQuery.error.message
              : "Search failed. Try again."}
          </p>
          {searchQuery.error instanceof ApiError &&
          searchQuery.error.code === "JOBS_NOT_CONFIGURED" ? (
            <p className="mt-2 text-xs text-muted-foreground">
              The API needs ADZUNA_APP_ID and ADZUNA_API_KEY on Coolify.
            </p>
          ) : null}
        </PaperPanel>
      ) : data?.results.length === 0 ? (
        <PaperPanel className="border-guava-green/15 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No roles matched. Try broader keywords or a different location.
          </p>
        </PaperPanel>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {data!.totalResults.toLocaleString()} results
            {data!.page > 1 ? ` · page ${data!.page}` : ""}
          </p>
          <ul className="space-y-4">
            {data!.results.map((job) => (
              <li key={job.canonicalKey}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              disabled={submitted.page <= 1 || searchQuery.isFetching}
              onClick={() =>
                setSubmitted((s) => ({ ...s, page: Math.max(1, s.page - 1) }))
              }
              className="rounded-xl border border-guava-green/25 bg-white/70 px-4 py-2 text-sm font-medium disabled:opacity-40"
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
              onClick={() =>
                setSubmitted((s) => ({ ...s, page: s.page + 1 }))
              }
              className="rounded-xl border border-guava-green/25 bg-white/70 px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>

          {data!.attribution ? (
            <p className="border-t border-guava-green/10 pt-6 text-center text-xs text-muted-foreground">
              {data!.attribution}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
