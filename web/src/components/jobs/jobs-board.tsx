"use client";

import { CircleNotch, MagnifyingGlass } from "@phosphor-icons/react";
import type { JobListItem } from "@/api/types";
import { JobCard } from "@/components/jobs/job-card";
import { JobDetailPanel } from "@/components/jobs/job-detail-panel";

type JobsBoardProps = {
  jobs: JobListItem[];
  loading: boolean;
  selectedKey: string | null;
  onSelect: (canonicalKey: string) => void;
  onClear: () => void;
  mode?: "app" | "public";
  emptyMessage?: string;
};

export function JobsBoard({
  jobs,
  loading,
  selectedKey,
  onSelect,
  onClear,
  mode = "app",
  emptyMessage = "No jobs found. Try a different search.",
}: JobsBoardProps) {
  const activeJob =
    jobs.find((job) => job.canonicalKey === selectedKey) ?? null;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <CircleNotch
          className="size-6 animate-spin text-guava-green"
          weight="bold"
        />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-guava-green/15 bg-guava-green/5 px-4 py-16 text-center">
        <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-guava-green/10">
          <MagnifyingGlass
            className="size-5 text-guava-green"
            weight="duotone"
          />
        </div>
        <p className="text-sm font-medium text-foreground">No jobs found</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Tablet + desktop: list | detail split */}
      <div className="hidden min-h-0 max-h-[calc(100dvh-12rem)] flex-1 gap-4 rounded-2xl border border-guava-green/15 bg-gradient-to-br from-guava-green/[0.07] via-white/50 to-background p-3 md:grid md:grid-cols-1 md:p-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ul
          className={[
            "min-h-0 space-y-2.5 overflow-y-auto overscroll-contain md:max-h-full md:pr-1",
            activeJob ? "hidden lg:block" : "block",
          ].join(" ")}
        >
          {jobs.map((job) => (
            <li key={job.canonicalKey}>
              <JobCard
                job={job}
                isSelected={activeJob?.canonicalKey === job.canonicalKey}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>

        {activeJob ? (
          <div className="flex min-h-0 max-h-full flex-col overflow-hidden rounded-xl border border-guava-green/20 bg-white/95 p-4 shadow-sm md:p-5">
            <JobDetailPanel
              summary={activeJob}
              showBack
              onBack={onClear}
              backClassName="lg:hidden"
              mode={mode}
            />
          </div>
        ) : (
          <div className="hidden min-h-[12rem] items-center justify-center rounded-xl border border-dashed border-guava-green/25 bg-white/40 p-8 text-center lg:flex">
            <p className="max-w-xs text-sm text-muted-foreground">
              {mode === "public"
                ? "Select a role to read the listing. Apply when you are ready."
                : "Select a role to read the listing and generate a package."}
            </p>
          </div>
        )}
      </div>

      {/* Phone: scrollable list */}
      <ul className="space-y-2.5 md:hidden">
        {jobs.map((job) => (
          <li key={job.canonicalKey}>
            <JobCard job={job} isSelected={false} onSelect={onSelect} />
          </li>
        ))}
      </ul>

      {/* Phone: full-viewport detail */}
      {activeJob ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[var(--background)] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Job details"
        >
          <div className="flex min-h-0 flex-1 flex-col px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-guava-green/20 bg-white p-4 shadow-sm">
              <JobDetailPanel
                summary={activeJob}
                showBack
                onBack={onClear}
                lockBodyScroll
                mode={mode}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
