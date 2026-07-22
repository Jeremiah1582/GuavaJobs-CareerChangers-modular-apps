"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heart, MagnifyingGlass } from "@phosphor-icons/react";
import { apiFetch, ApiError, publicApiFetch } from "@/api/client";
import type {
  JobListItem,
  JobSearchResponse,
  MarketFitResponse,
  MeResponse,
  ProfileResponse,
  SavedJobKeysResponse,
  SavedJobResponse,
  SavedJobsListResponse,
  SavedJobResolveStatus,
} from "@/api/types";
import { JobsBoard } from "@/components/jobs/jobs-board";
import {
  JobsSearchBar,
  type SearchCriterion,
} from "@/components/jobs/jobs-search-bar";
import { ErrorState } from "@/components/ui/state-panel";
import { useSavedJobSearches } from "@/hooks/use-saved-job-searches";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { deriveJobSearchDefaults, savedJobToListItem } from "@/lib/jobs";
import { formatJobSearchError } from "@/lib/job-search-errors";
import { normalizeAdzunaCountry } from "@/lib/adzuna-countries";
import { useOnlineStatus } from "@/lib/online";
import { getAccessTokenOrNull } from "@/lib/session";

type JobFeedProps = {
  mode?: "app" | "public";
};

type FeedView = "search" | "bookmarked";

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
  view: FeedView;
  hasExplicit: boolean;
} {
  const q = searchParams.get("q");
  const where = searchParams.get("where");
  const country = searchParams.get("country");
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const view =
    searchParams.get("view") === "bookmarked" ? "bookmarked" : "search";
  return {
    q,
    where,
    country,
    page,
    view,
    /** Custom search when keywords, location, or country are in the URL. */
    hasExplicit: q !== null || where !== null || country !== null,
  };
}

export function JobFeed({ mode = "app" }: JobFeedProps) {
  const online = useOnlineStatus();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const selectedKey = searchParams.get("job");
  const urlSearch = readUrlSearch(searchParams);
  const feedView = mode === "app" ? urlSearch.view : "search";

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
  const [bookmarkPendingKey, setBookmarkPendingKey] = useState<string | null>(
    null,
  );

  /** Wait for profile defaults before first search in app mode (no URL overrides). */
  const needsProfileDefaults =
    mode === "app" && !urlSearch.hasExplicit && feedView === "search";
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

  const bookmarkKeysQuery = useQuery({
    queryKey: ["saved-job-keys"] as const,
    queryFn: async () => {
      const token = await getAccessTokenOrNull();
      if (!token) return { canonicalKeys: [] as string[] };
      return apiFetch<SavedJobKeysResponse>("/saved-jobs/keys", { token });
    },
    enabled: mode === "app" && online,
    staleTime: 30_000,
  });

  const bookmarkedKeys = useMemo(
    () => new Set(bookmarkKeysQuery.data?.canonicalKeys ?? []),
    [bookmarkKeysQuery.data?.canonicalKeys],
  );

  const bookmarksQuery = useQuery({
    queryKey: ["saved-jobs", "resolve"] as const,
    queryFn: async () => {
      const token = await getAccessTokenOrNull();
      if (!token) return { results: [] as SavedJobResponse[] };
      return apiFetch<SavedJobsListResponse>("/saved-jobs?resolve=1", {
        token,
      });
    },
    enabled: mode === "app" && online && feedView === "bookmarked",
    staleTime: 15_000,
  });

  const goneTracked = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (feedView !== "bookmarked" || !bookmarksQuery.data) return;
    for (const row of bookmarksQuery.data.results) {
      if (
        row.resolveStatus === "GONE" &&
        !goneTracked.current.has(row.canonicalKey)
      ) {
        goneTracked.current.add(row.canonicalKey);
        track(AnalyticsEvents.bookmark_resolve_gone, {
          canonicalJobKey: row.canonicalKey,
        });
      }
    }
  }, [feedView, bookmarksQuery.data]);

  const toggleBookmark = useMutation({
    mutationFn: async (job: JobListItem) => {
      const token = await getAccessTokenOrNull();
      if (!token) {
        throw new ApiError("Sign in to bookmark jobs.", {
          status: 401,
          code: "UNAUTHORIZED",
        });
      }
      const key = job.canonicalKey;
      const isBookmarked = bookmarkedKeys.has(key);
      if (isBookmarked) {
        await apiFetch(`/saved-jobs/${encodeURIComponent(key)}`, {
          method: "DELETE",
          token,
        });
        return { key, bookmarked: false as const };
      }
      await apiFetch<SavedJobResponse>("/saved-jobs", {
        method: "POST",
        token,
        body: JSON.stringify({
          canonicalKey: key,
          title: job.title,
          company: job.company,
          location: job.location,
          atsType: job.atsType,
          salaryMin: job.salaryMin ?? null,
          salaryMax: job.salaryMax ?? null,
          salaryCurrency: job.salaryCurrency ?? null,
        }),
      });
      return { key, bookmarked: true as const };
    },
    onMutate: (job) => {
      setBookmarkPendingKey(job.canonicalKey);
    },
    onSuccess: (result) => {
      track(
        result.bookmarked
          ? AnalyticsEvents.job_bookmarked
          : AnalyticsEvents.job_unbookmarked,
        { canonicalJobKey: result.key },
      );
      void queryClient.invalidateQueries({ queryKey: ["saved-job-keys"] });
      void queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
    onSettled: () => {
      setBookmarkPendingKey(null);
    },
  });

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
    enabled: online && defaultsReady && feedView === "search",
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
      view?: FeedView;
    }) => {
      const params = new URLSearchParams();
      const q = opts.q ?? submitted.q;
      const loc = opts.location ?? submitted.location;
      const country = opts.country ?? submitted.country;
      const page = opts.page ?? submitted.page;
      const job = opts.job === undefined ? selectedKey : opts.job;
      const view = opts.view ?? feedView;

      if (view === "bookmarked") {
        params.set("view", "bookmarked");
      } else {
        if (q.trim()) params.set("q", q.trim());
        if (loc.trim()) params.set("where", loc.trim());
        if (country) params.set("country", country);
        if (page > 1) params.set("page", String(page));
      }
      if (job) params.set("job", job);

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [
      feedView,
      pathname,
      router,
      selectedKey,
      submitted.country,
      submitted.location,
      submitted.page,
      submitted.q,
    ],
  );

  function setFeedView(next: FeedView) {
    syncUrl({ view: next, job: null, page: 1 });
  }

  function onSearch() {
    const next: SubmittedSearch = {
      q: query,
      location,
      country: normalizeAdzunaCountry(country),
      page: 1,
    };
    setSubmitted(next);
    syncUrl({ ...next, job: null, view: "search" });
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
    syncUrl({ ...next, job: null, view: "search" });
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
  const bookmarkJobs = useMemo(
    () => (bookmarksQuery.data?.results ?? []).map(savedJobToListItem),
    [bookmarksQuery.data?.results],
  );
  const resolveStatusByKey = useMemo(() => {
    const map: Record<string, SavedJobResolveStatus> = {};
    for (const row of bookmarksQuery.data?.results ?? []) {
      map[row.canonicalKey] = row.resolveStatus;
    }
    return map;
  }, [bookmarksQuery.data?.results]);

  const boardJobs = feedView === "bookmarked" ? bookmarkJobs : (data?.results ?? []);
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
    feedView === "search" && data && data.results.length > 0 ? (
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
    pagination || (feedView === "search" && data?.attribution) ? (
      <>
        {pagination}
        {feedView === "search" && data?.attribution ? (
          <p className="text-center text-xs text-muted-foreground">
            {data.attribution}
          </p>
        ) : null}
      </>
    ) : null;

  const searchError = searchQuery.isError
    ? formatJobSearchError(searchQuery.error)
    : null;
  const bookmarksError =
    bookmarksQuery.isError && feedView === "bookmarked"
      ? bookmarksQuery.error instanceof Error
        ? bookmarksQuery.error.message
        : "Could not load bookmarks."
      : null;

  return (
    <div className="flex min-h-0 w-full min-w-0 max-w-full flex-col gap-5 overflow-x-hidden lg:min-h-0 lg:flex-1 lg:gap-4 lg:overflow-hidden">
      {mode === "app" ? (
        <div
          className="flex shrink-0 gap-2"
          role="tablist"
          aria-label="Jobs views"
        >
          <button
            type="button"
            role="tab"
            aria-selected={feedView === "search"}
            onClick={() => setFeedView("search")}
            className={[
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
              feedView === "search"
                ? "border-guava-green/40 bg-guava-green/10 text-foreground"
                : "border-border/80 text-muted-foreground hover:border-guava-green/30",
            ].join(" ")}
          >
            <MagnifyingGlass className="size-3.5" weight="bold" />
            Search
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={feedView === "bookmarked"}
            onClick={() => setFeedView("bookmarked")}
            className={[
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
              feedView === "bookmarked"
                ? "border-guava-pink/40 bg-guava-pink/10 text-foreground"
                : "border-border/80 text-muted-foreground hover:border-guava-pink/30",
            ].join(" ")}
          >
            <Heart
              className="size-3.5"
              weight={feedView === "bookmarked" ? "fill" : "regular"}
            />
            Bookmarked
            {bookmarkedKeys.size > 0 ? (
              <span className="font-mono text-[10px] text-muted-foreground">
                {bookmarkedKeys.size}
              </span>
            ) : null}
          </button>
        </div>
      ) : null}

      {feedView === "search" ? (
        <div className="min-w-0 shrink-0">
          <JobsSearchBar
            query={query}
            location={location}
            country={country}
            onQueryChange={setQuery}
            onLocationChange={setLocation}
            onCountryChange={(value) =>
              setCountry(normalizeAdzunaCountry(value))
            }
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
      ) : (
        <p className="shrink-0 text-sm text-muted-foreground">
          Pointers only — we re-check each listing. Gone means the post was
          taken down.
        </p>
      )}

      {!online ? (
        <ErrorState
          title="You're offline"
          message="Job search needs a network connection."
          nextAction="Reconnect, then retry search."
          onRetry={() =>
            feedView === "bookmarked"
              ? void bookmarksQuery.refetch()
              : void searchQuery.refetch()
          }
        />
      ) : feedView === "bookmarked" && bookmarksError ? (
        <ErrorState
          title="Bookmarks failed"
          message={bookmarksError}
          nextAction="Check your connection, then retry."
          onRetry={() => void bookmarksQuery.refetch()}
        />
      ) : feedView === "search" && searchError ? (
        <ErrorState
          title="Search failed"
          message={searchError.message}
          nextAction={searchError.nextAction}
          onRetry={() => void searchQuery.refetch()}
        />
      ) : (
        <>
          {feedView === "search" && data && data.results.length > 0 ? (
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

          {feedView === "bookmarked" && bookmarkJobs.length > 0 ? (
            <p className="shrink-0 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {bookmarkJobs.length}
              </span>{" "}
              bookmarked {bookmarkJobs.length === 1 ? "role" : "roles"}
            </p>
          ) : null}

          <JobsBoard
            jobs={boardJobs}
            loading={
              feedView === "bookmarked"
                ? bookmarksQuery.isLoading
                : awaitingDefaults || searchQuery.isLoading
            }
            selectedKey={selectedKey}
            onSelect={selectJob}
            onClear={clearSelection}
            mode={mode}
            emptyMessage={
              feedView === "bookmarked"
                ? "Heart a role from Search to shortlist it here."
                : `Try broader keywords or a different location. Searching ${marketLabel}.`
            }
            footer={desktopBoardFooter}
            bookmarkedKeys={mode === "app" ? bookmarkedKeys : undefined}
            onToggleBookmark={
              mode === "app"
                ? (job) => toggleBookmark.mutate(job)
                : undefined
            }
            bookmarkPendingKey={bookmarkPendingKey}
            resolveStatusByKey={
              feedView === "bookmarked" ? resolveStatusByKey : undefined
            }
          />

          {pagination ? <div className="lg:hidden">{pagination}</div> : null}

          {feedView === "search" && data?.attribution ? (
            <p className="text-center text-xs text-muted-foreground lg:hidden">
              {data.attribution}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
