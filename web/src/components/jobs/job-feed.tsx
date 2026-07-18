"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError, publicApiFetch } from "@/api/client";
import type {
  JobSearchResponse,
  MeResponse,
  ProfileResponse,
} from "@/api/types";
import { JobsBoard } from "@/components/jobs/jobs-board";
import { JobsSearchBar } from "@/components/jobs/jobs-search-bar";
import { ErrorState } from "@/components/ui/state-panel";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { deriveJobSearchDefaults } from "@/lib/jobs";
import { useOnlineStatus } from "@/lib/online";
import { getAccessTokenOrNull } from "@/lib/session";

type JobFeedProps = {
  mode?: "app" | "public";
};

type SubmittedSearch = {
  q: string;
  location: string;
  country: string;
  page: number;
};

function readUrlSearch(searchParams: URLSearchParams): {
  q: string | null;
  where: string | null;
  country: string | null;
  page: number;
  hasExplicit: boolean;
} {
  const q = searchParams.get("q");
  const where = searchParams.get("where");
  const country = searchParams.get("country");
  const page = Number(searchParams.get("page") ?? "1") || 1;
  return {
    q,
    where,
    country,
    page,
    /** Custom search when keywords or location are in the URL. */
    hasExplicit: q !== null || where !== null,
  };
}

export function JobFeed({ mode = "app" }: JobFeedProps) {
  const online = useOnlineStatus();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedKey = searchParams.get("job");
  const urlSearch = readUrlSearch(searchParams);

  const [query, setQuery] = useState(urlSearch.q ?? "");
  const [location, setLocation] = useState(urlSearch.where ?? "");
  const [submitted, setSubmitted] = useState<SubmittedSearch>({
    q: urlSearch.q ?? "",
    location: urlSearch.where ?? "",
    country: (urlSearch.country ?? "gb").toLowerCase(),
    page: urlSearch.page,
  });

  /** Wait for profile defaults before first search in app mode (no URL overrides). */
  const needsProfileDefaults = mode === "app" && !urlSearch.hasExplicit;
  const [defaultsReady, setDefaultsReady] = useState(!needsProfileDefaults);
  const defaultsApplied = useRef(false);

  const profileDefaultsQuery = useQuery({
    queryKey: ["job-feed-profile-defaults"] as const,
    queryFn: async () => {
      const token = await getAccessTokenOrNull();
      if (!token) return null;

      const me = await apiFetch<MeResponse>("/me", { token });
      const profileId =
        me.defaultProfileId ?? me.defaultProfile?.id ?? null;
      if (!profileId) return null;

      const profile = await apiFetch<ProfileResponse>(
        `/profiles/${profileId}`,
        { token },
      );
      return deriveJobSearchDefaults(profile);
    },
    enabled: needsProfileDefaults && online,
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (!needsProfileDefaults || defaultsApplied.current) return;
    if (profileDefaultsQuery.isPending || profileDefaultsQuery.isFetching) {
      return;
    }

    defaultsApplied.current = true;
    const defaults = profileDefaultsQuery.data;
    if (defaults) {
      setQuery(defaults.q);
      setLocation(defaults.location);
      setSubmitted({
        q: defaults.q,
        location: defaults.location,
        country: defaults.country,
        page: 1,
      });
    }
    setDefaultsReady(true);
  }, [
    needsProfileDefaults,
    profileDefaultsQuery.data,
    profileDefaultsQuery.isFetching,
    profileDefaultsQuery.isPending,
  ]);

  const searchQuery = useQuery({
    queryKey: [
      "jobs",
      submitted.q,
      submitted.location,
      submitted.country,
      submitted.page,
    ] as const,
    queryFn: async () => {
      const params = new URLSearchParams({
        country: submitted.country || "gb",
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
    enabled: online && defaultsReady,
    staleTime: 30_000,
    retry: 1,
  });

  const syncUrl = useCallback(
    (opts: {
      q?: string;
      location?: string;
      country?: string;
      page?: number;
      job?: string | null;
    }) => {
      const params = new URLSearchParams();
      const q = opts.q ?? submitted.q;
      const loc = opts.location ?? submitted.location;
      const country = opts.country ?? submitted.country;
      const page = opts.page ?? submitted.page;
      const job = opts.job === undefined ? selectedKey : opts.job;

      if (q.trim()) params.set("q", q.trim());
      if (loc.trim()) params.set("where", loc.trim());
      if (country && country !== "gb") params.set("country", country);
      if (page > 1) params.set("page", String(page));
      if (job) params.set("job", job);

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [
      pathname,
      router,
      selectedKey,
      submitted.country,
      submitted.location,
      submitted.page,
      submitted.q,
    ],
  );

  function onSearch() {
    const next: SubmittedSearch = {
      q: query,
      location,
      country: submitted.country,
      page: 1,
    };
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

  const marketLabel = (submitted.country || "gb").toUpperCase();
  const awaitingDefaults = needsProfileDefaults && !defaultsReady;
  const searchPending =
    awaitingDefaults ||
    (searchQuery.isFetching && !searchQuery.isFetched);

  return (
    <div className="flex min-h-0 flex-col gap-5">
      <JobsSearchBar
        query={query}
        location={location}
        onQueryChange={setQuery}
        onLocationChange={setLocation}
        onSubmit={onSearch}
        pending={searchPending}
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
                : ` in ${marketLabel}`}
            </p>
          ) : null}

          <JobsBoard
            jobs={data?.results ?? []}
            loading={awaitingDefaults || searchQuery.isLoading}
            selectedKey={selectedKey}
            onSelect={selectJob}
            onClear={clearSelection}
            mode={mode}
            emptyMessage={`Try broader keywords or a different location. Searching ${marketLabel}.`}
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
