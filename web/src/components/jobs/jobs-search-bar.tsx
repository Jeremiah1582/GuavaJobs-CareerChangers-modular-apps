"use client";

import {
  BookmarkSimple,
  Briefcase,
  CaretDown,
  GlobeHemisphereWest,
  MagnifyingGlass,
  MapPin,
  X,
} from "@phosphor-icons/react";
import { FormEvent, useId, useState } from "react";
import { ADZUNA_COUNTRIES } from "@/lib/adzuna-countries";
import type { SavedJobSearch } from "@/lib/saved-job-searches";

const GUAVA_TAB =
  "bg-gradient-to-br from-[oklch(0.68_0.13_150)] via-[oklch(0.55_0.15_150)] to-[oklch(0.42_0.12_155)] text-white shadow-[0_8px_20px_-10px_color-mix(in_oklab,var(--guava-green)_70%,transparent)]";

const RECOMMENDED_TAB =
  "bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 text-white shadow-[0_6px_16px_-12px_rgba(0,0,0,0.45)]";

const SAVED_TAB =
  "bg-gradient-to-r from-[oklch(0.72_0.12_150)] via-[oklch(0.58_0.14_150)] to-[oklch(0.48_0.12_155)] text-white shadow-[0_6px_16px_-12px_color-mix(in_oklab,var(--guava-green)_55%,transparent)]";

export type SearchCriterion = {
  label: string;
  q: string;
  country?: string;
  location?: string;
};

/** @deprecated Use SearchCriterion */
export type RecommendedSearchCriterion = SearchCriterion;

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
  recommendedCriteria?: SearchCriterion[];
  savedSearches?: SavedJobSearch[];
  allowSave?: boolean;
  onCriterionSelect?: (criterion: SearchCriterion) => void;
  onSaveSearch?: () => void;
  onRemoveSaved?: (id: string) => void;
  /** @deprecated Use onCriterionSelect */
  onRecommendedSelect?: (criterion: SearchCriterion) => void;
};

function criterionMatches(
  activeQ: string,
  activeLocation: string,
  activeCountry: string,
  criterion: SearchCriterion,
): boolean {
  return (
    activeQ === criterion.q.trim().toLowerCase() &&
    activeLocation === (criterion.location?.trim() ?? "").toLowerCase() &&
    activeCountry === (criterion.country?.trim().toLowerCase() ?? activeCountry)
  );
}

function SearchTab({
  label,
  selected,
  pending,
  variant,
  onClick,
  onRemove,
}: {
  label: string;
  selected: boolean;
  pending: boolean;
  variant: "recommended" | "saved";
  onClick: () => void;
  onRemove?: () => void;
}) {
  const base =
    variant === "recommended"
      ? RECOMMENDED_TAB
      : SAVED_TAB;

  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        role="tab"
        aria-selected={selected}
        disabled={pending}
        onClick={onClick}
        className={[
          "inline-flex items-center rounded-t-lg rounded-b-sm px-3 py-1.5 text-xs font-semibold transition-[filter,opacity,box-shadow]",
          base,
          selected
            ? "ring-2 ring-white/40 ring-offset-1 ring-offset-white"
            : "opacity-90 hover:opacity-100",
          "disabled:opacity-50",
          onRemove ? "pr-7" : "",
        ].join(" ")}
      >
        {label}
      </button>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove saved search ${label}`}
          disabled={pending}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-1 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-white/80 opacity-0 transition-opacity hover:bg-white/15 hover:text-white group-hover:opacity-100 disabled:opacity-40"
        >
          <X className="size-3" weight="bold" />
        </button>
      ) : null}
    </span>
  );
}

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
  savedSearches = [],
  allowSave = false,
  onCriterionSelect,
  onSaveSearch,
  onRemoveSaved,
  onRecommendedSelect,
}: JobsSearchBarProps) {
  const panelId = useId();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  const selectCriterion = onCriterionSelect ?? onRecommendedSelect;
  const activeQ = query.trim().toLowerCase();
  const activeLocation = location.trim().toLowerCase();
  const activeCountry = country.trim().toLowerCase();

  const hasRecommended = recommendedCriteria.length > 0;
  const hasSaved = savedSearches.length > 0;
  const showShortcuts = allowSave || hasRecommended || hasSaved;
  const shortcutCount = recommendedCriteria.length + savedSearches.length;

  const canSave =
    allowSave &&
    Boolean(query.trim() || location.trim()) &&
    onSaveSearch;

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

      {showShortcuts ? (
        <div className="border-t border-guava-green/10 pt-2 sm:pr-1">
          <div className="flex flex-wrap items-center gap-2 px-0.5">
            <button
              type="button"
              aria-expanded={shortcutsOpen}
              aria-controls={panelId}
              onClick={() => setShortcutsOpen((open) => !open)}
              className="inline-flex items-center gap-1.5 rounded-lg py-1 text-left text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              <CaretDown
                className={`size-3.5 transition-transform ${shortcutsOpen ? "rotate-0" : "-rotate-90"}`}
                weight="bold"
                aria-hidden
              />
              Search shortcuts
              {shortcutCount > 0 ? (
                <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.65rem] normal-case tracking-normal text-muted-foreground">
                  {shortcutCount}
                </span>
              ) : null}
            </button>

            {canSave ? (
              <button
                type="button"
                disabled={pending}
                onClick={onSaveSearch}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-guava-green/20 bg-white/80 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-guava-green/35 disabled:opacity-50"
              >
                <BookmarkSimple className="size-3.5 text-guava-green" weight="duotone" />
                Save search
              </button>
            ) : null}
          </div>

          {shortcutsOpen ? (
            <div id={panelId} className="mt-2 space-y-2.5">
              {hasRecommended ? (
                <div className="space-y-1.5">
                  <p className="px-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground/80">
                    Recommended
                  </p>
                  <div
                    role="tablist"
                    aria-label="Recommended search criteria"
                    className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {recommendedCriteria.map((criterion) => (
                      <SearchTab
                        key={criterion.label}
                        label={criterion.label}
                        variant="recommended"
                        selected={criterionMatches(
                          activeQ,
                          activeLocation,
                          activeCountry,
                          criterion,
                        )}
                        pending={pending}
                        onClick={() => selectCriterion?.(criterion)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {hasSaved ? (
                <div className="space-y-1.5">
                  <p className="px-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground/80">
                    Saved
                  </p>
                  <div
                    role="tablist"
                    aria-label="Saved search criteria"
                    className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {savedSearches.map((saved) => {
                      const criterion: SearchCriterion = {
                        label: saved.label,
                        q: saved.q,
                        location: saved.location,
                        country: saved.country,
                      };
                      return (
                        <SearchTab
                          key={saved.id}
                          label={saved.label}
                          variant="saved"
                          selected={criterionMatches(
                            activeQ,
                            activeLocation,
                            activeCountry,
                            criterion,
                          )}
                          pending={pending}
                          onClick={() => selectCriterion?.(criterion)}
                          onRemove={
                            onRemoveSaved
                              ? () => onRemoveSaved(saved.id)
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {!hasRecommended && !hasSaved && allowSave ? (
                <p className="px-0.5 text-xs text-muted-foreground">
                  Save a search to re-run it from here, or generate Market Fit on
                  your profile for AI recommendations.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
