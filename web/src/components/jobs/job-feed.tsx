"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError, publicApiFetch } from "@/api/client";
import type {
  JobSearchResponse,
  MarketFitResponse,
  MeResponse,
  ProfileResponse,
} from "@/api/types";
import { JobsBoard } from "@/components/jobs/jobs-board";
import {
  JobsSearchBar,
  type SearchCriterion,
} from "@/components/jobs/jobs-search-bar";
import { ErrorState } from "@/components/ui/state-panel";
import { useSavedJobSearches } from "@/hooks/use-saved-job-searches";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { deriveJobSearchDefaults } from "@/lib/jobs";
import { formatJobSearchError } from "@/lib/job-search-errors";
import { normalizeAdzunaCountry } from "@/lib/adzuna-countries";
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
    /** Custom search when keywords, location, or country are in the URL. */
    hasExplicit: q !== null || where !== null || country !== null,
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
  const [country, setCountry] = useState(
    normalizeAdzunaCountry(urlSearch.country),
  );
  const [submitted, setSubmitted] = useState<SubmittedSearch>({
    q: urlSearch.q ?? "",
    location: urlSearch.where ?? "",
    country: normalizeAdzunaCountry(urlSearch.country),
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
      return { defaults: deriveJobSearchDefaults(profile), profileId };
    },
    enabled: needsProfileDefaults && online,
    staleTime: 60_000,
    retry: 1,
  });

  const marketFitQuery = useQuery({
    queryKey: ["job-feed-market-fit"] as const,
    queryFn: async () => {
      const token = await getAccessTokenOrNull();
      if (!token) return null;
      const me = await apiFetch<MeResponse>("/me", { token });
      const profileId =
        me.defaultProfileId ?? me.defaultProfile?.id ?? null;
      if (!profileId) return null;
      try {
        return await apiFetch<MarketFitResponse>(
          `/profiles/${profileId}/market-fit`,
          { token },
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: mode === "app" && online,
    staleTime: 60_000,
    retry: false,
  });

  const recommendedCriteria: SearchCriterion[] = (
    marketFitQuery.data?.roles ?? []
  ).map((role) => ({
    label: role.title,
    q: role.searchCta.q,
    country: role.searchCta.country,
    location: role.searchCta.location,
  }));

  const { savedSearches, saveCurrent, remove } = useSavedJobSearches(
    mode === "app",
  );

  useEffect(() => {
    if (!needsProfileDefaults || defaultsApplied.current) return;
    if (profileDefaultsQuery.isPending || profileDefaultsQuery.isFetching) {
      return;
    }

    defaultsApplied.current = true;
    const defaults = profileDefaultsQuery.data?.defaults;
    if (defaults) {
      setQuery(defaults.q);
      setLocation(defaults.location);
      setCountry(normalizeAdzunaCountry(defaults.country));
      setSubmitted({
        q: defaults.q,
        location: defaults.location,
        country: normalizeAdzunaCountry(defaults.country),
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
      if (country) params.set("country", country);
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
      country: normalizeAdzunaCountry(country),
      page: 1,
    };
    setSubmitted(next);
    syncUrl({ ...next, job: null });
    track(AnalyticsEvents.job_search, {
      q: query.trim() || null,
      location: location.trim() || null,
      country: next.country,
      page: 1,
    });
  }

  function onCriterionSelect(criterion: SearchCriterion) {
    const nextCountry = normalizeAdzunaCountry(
      criterion.country ?? country,
    );
    const nextLocation = criterion.location?.trim() || location;
    setQuery(criterion.q);
    setLocation(nextLocation);
    setCountry(nextCountry);
    const next: SubmittedSearch = {
      q: criterion.q,
      location: nextLocation,
      country: nextCountry,
      page: 1,
    };
    setSubmitted(next);
    syncUrl({ ...next, job: null });
    track(AnalyticsEvents.job_search, {
      q: criterion.q,
      location: nextLocation.trim() || null,
      country: nextCountry,
      page: 1,
      source: "search_shortcut",
    });
  }

  function onSaveSearch() {
    saveCurrent({
      q: query,
      location,
      country: normalizeAdzunaCountry(country),
    });
    track(AnalyticsEvents.job_search, {
      q: query.trim() || null,
      location: location.trim() || null,
      country: normalizeAdzunaCountry(country),
      action: "save_search",
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

  const pagination =
    data && data.results.length > 0 ? (
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
          disabled={submitted.page >= totalPages || searchQuery.isFetching}
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
    ) : null;

  const desktopBoardFooter =
    pagination || data?.attribution ? (
      <>
        {pagination}
        {data?.attribution ? (
          <p className="text-center text-xs text-muted-foreground">
            {data.attribution}
          </p>
        ) : null}
      </>
    ) : null;

  const searchError = searchQuery.isError
    ? formatJobSearchError(searchQuery.error)
    : null;

  return (
    <div className="flex min-h-0 w-full min-w-0 max-w-full flex-col gap-5 overflow-x-hidden lg:min-h-0 lg:flex-1 lg:gap-4 lg:overflow-hidden">
      <div className="min-w-0 shrink-0">
        <JobsSearchBar
          query={query}
          location={location}
          country={country}
          onQueryChange={setQuery}
          onLocationChange={setLocation}
          onCountryChange={(value) => setCountry(normalizeAdzunaCountry(value))}
          onSubmit={onSearch}
          pending={searchPending}
          recommendedCriteria={recommendedCriteria}
          savedSearches={savedSearches}
          allowSave={mode === "app"}
          onCriterionSelect={onCriterionSelect}
          onSaveSearch={onSaveSearch}
          onRemoveSaved={remove}
        />
      </div>

      {!online ? (
        <ErrorState
          title="You're offline"
          message="Job search needs a network connection."
          nextAction="Reconnect, then retry search."
          onRetry={() => void searchQuery.refetch()}
        />
      ) : searchError ? (
        <ErrorState
          title="Search failed"
          message={searchError.message}
          nextAction={searchError.nextAction}
          onRetry={() => void searchQuery.refetch()}
        />
      ) : (
        <>
          {data && data.results.length > 0 ? (
            <p className="shrink-0 text-sm text-muted-foreground">
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
            footer={desktopBoardFooter}
          />

          {pagination ? <div className="lg:hidden">{pagination}</div> : null}

          {data?.attribution ? (
            <p className="text-center text-xs text-muted-foreground lg:hidden">
              {data.attribution}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
