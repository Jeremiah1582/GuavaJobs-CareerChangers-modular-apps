"use client";

import {
  Briefcase,
  GlobeHemisphereWest,
  MagnifyingGlass,
  MapPin,
} from "@phosphor-icons/react";
import { FormEvent } from "react";
import { ADZUNA_COUNTRIES } from "@/lib/adzuna-countries";

const GUAVA_TAB =
  "bg-gradient-to-br from-[oklch(0.68_0.13_150)] via-[oklch(0.55_0.15_150)] to-[oklch(0.42_0.12_155)] text-white shadow-[0_8px_20px_-10px_color-mix(in_oklab,var(--guava-green)_70%,transparent)]";

export type RecommendedSearchCriterion = {
  label: string;
  q: string;
  country?: string;
  location?: string;
};

type JobsSearchBarProps = {
  query: string;
  location: string;
  country: string;
  onQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSubmit: () => void;
  pending?: boolean;
  /** Market Fit (or similar) suggested search tabs. */
  recommendedCriteria?: RecommendedSearchCriterion[];
  onRecommendedSelect?: (criterion: RecommendedSearchCriterion) => void;
};

export function JobsSearchBar({
  query,
  location,
  country,
  onQueryChange,
  onLocationChange,
  onCountryChange,
  onSubmit,
  pending = false,
  recommendedCriteria = [],
  onRecommendedSelect,
}: JobsSearchBarProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  const activeQ = query.trim().toLowerCase();

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-2.5 rounded-2xl border border-guava-green/20 bg-white/90 p-2.5 shadow-sm sm:p-2 sm:pl-3"
    >
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <Briefcase
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-guava-pink/70"
            weight="duotone"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Role, skill, or company"
            aria-label="Keywords"
            enterKeyHint="search"
            className="h-11 w-full rounded-xl border border-guava-green/10 bg-background/60 py-2 pl-10 pr-3 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-guava-green/25 sm:border-0 sm:bg-transparent sm:text-sm focus-visible:sm:ring-0"
          />
        </div>

        <div
          aria-hidden
          className="hidden h-8 w-px shrink-0 bg-guava-green/15 sm:block"
        />

        <div className="relative min-w-0 flex-1">
          <MapPin
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-guava-green/80"
            weight="duotone"
            aria-hidden
          />
          <input
            type="search"
            name="location"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="City or remote"
            aria-label="Location"
            enterKeyHint="search"
            className="h-11 w-full rounded-xl border border-guava-green/10 bg-background/60 py-2 pl-10 pr-3 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-guava-green/25 sm:border-0 sm:bg-transparent sm:text-sm focus-visible:sm:ring-0"
          />
        </div>

        <div
          aria-hidden
          className="hidden h-8 w-px shrink-0 bg-guava-green/15 sm:block"
        />

        <div className="relative min-w-0 sm:w-[11.5rem] sm:shrink-0">
          <GlobeHemisphereWest
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-guava-green/80"
            weight="duotone"
            aria-hidden
          />
          <select
            name="country"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            aria-label="Country"
            className="h-11 w-full appearance-none rounded-xl border border-guava-green/10 bg-background/60 py-2 pl-10 pr-8 text-base outline-none focus-visible:ring-2 focus-visible:ring-guava-green/25 sm:border-0 sm:bg-transparent sm:text-sm focus-visible:sm:ring-0"
          >
            {ADZUNA_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className={`inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium text-white transition-[filter,opacity] hover:brightness-[1.05] disabled:opacity-60 sm:h-10 sm:w-auto ${GUAVA_TAB}`}
        >
          <MagnifyingGlass className="size-4" weight="bold" aria-hidden />
          {pending ? "Searching…" : "Search"}
        </button>
      </div>

      {recommendedCriteria.length > 0 ? (
        <div className="space-y-1.5 border-t border-guava-green/10 pt-2 sm:pr-1">
          <p className="px-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
            Recommended search criteria
          </p>
          <div
            role="tablist"
            aria-label="Recommended search criteria"
            className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {recommendedCriteria.map((criterion) => {
              const selected = activeQ === criterion.q.trim().toLowerCase();
              return (
                <button
                  key={criterion.label}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  disabled={pending}
                  onClick={() => onRecommendedSelect?.(criterion)}
                  className={[
                    "inline-flex shrink-0 items-center rounded-t-lg rounded-b-sm px-3 py-1.5 text-xs font-semibold transition-[filter,opacity,box-shadow]",
                    selected
                      ? `${GUAVA_TAB} ring-2 ring-white/40 ring-offset-1 ring-offset-white`
                      : `${GUAVA_TAB} opacity-85 hover:opacity-100`,
                    "disabled:opacity-50",
                  ].join(" ")}
                >
                  {criterion.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </form>
  );
}
