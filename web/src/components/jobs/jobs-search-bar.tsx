"use client";

import { Briefcase, MagnifyingGlass, MapPin } from "@phosphor-icons/react";
import { FormEvent } from "react";

type JobsSearchBarProps = {
  query: string;
  location: string;
  onQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSubmit: () => void;
  pending?: boolean;
};

export function JobsSearchBar({
  query,
  location,
  onQueryChange,
  onLocationChange,
  onSubmit,
  pending = false,
}: JobsSearchBarProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-2 rounded-2xl border border-guava-green/20 bg-white/90 p-2.5 shadow-sm sm:flex-row sm:items-center sm:gap-3 sm:p-2 sm:pl-3"
    >
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

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.13_150)] via-[oklch(0.58_0.16_150)] to-[oklch(0.48_0.13_155)] px-5 text-sm font-medium text-white transition-[filter,opacity] hover:brightness-[1.05] disabled:opacity-60 sm:h-10 sm:w-auto"
      >
        <MagnifyingGlass className="size-4" weight="bold" aria-hidden />
        {pending ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
