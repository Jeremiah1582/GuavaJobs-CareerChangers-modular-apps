"use client";

import { Buildings, Heart, MapPin } from "@phosphor-icons/react";
import type { JobListItem, SavedJobResolveStatus } from "@/api/types";
import { formatSalary, inferWorkplace, atsTypeLabel } from "@/lib/jobs";

type JobCardProps = {
  job: JobListItem;
  isSelected?: boolean;
  onSelect: (canonicalKey: string) => void;
  /** When set, shows heart control (app mode). */
  bookmarked?: boolean;
  onToggleBookmark?: (job: JobListItem) => void;
  bookmarkPending?: boolean;
  resolveStatus?: SavedJobResolveStatus | null;
};

export function JobCard({
  job,
  isSelected = false,
  onSelect,
  bookmarked,
  onToggleBookmark,
  bookmarkPending,
  resolveStatus,
}: JobCardProps) {
  const salary = formatSalary(
    job.salaryMin,
    job.salaryMax,
    job.salaryCurrency,
  );
  const workplace = inferWorkplace(job.location);
  const atsLabel = atsTypeLabel(job.atsType);
  const gone = resolveStatus === "GONE";

  return (
    <article
      role="button"
      tabIndex={0}
      aria-current={isSelected ? "true" : undefined}
      onClick={() => onSelect(job.canonicalKey)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(job.canonicalKey);
        }
      }}
      className={[
        "cursor-pointer rounded-xl border p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-guava-green/40",
        gone
          ? "border-border/60 bg-muted/40 opacity-80"
          : isSelected
            ? "border-guava-green/45 bg-guava-green/8 ring-1 ring-guava-green/20"
            : "border-border/80 bg-white/80 hover:border-guava-green/30 hover:bg-guava-green/5",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="inline-flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
          <Buildings
            className="size-3.5 shrink-0 text-guava-green/80"
            weight="duotone"
            aria-hidden
          />
          <span className="truncate">{job.company}</span>
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {atsLabel ? (
            <span className="rounded-md border border-border/80 bg-background/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {atsLabel}
            </span>
          ) : null}
          {onToggleBookmark ? (
            <button
              type="button"
              disabled={bookmarkPending}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark job"}
              aria-pressed={bookmarked}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(job);
              }}
              className={[
                "rounded-lg p-1 transition-colors disabled:opacity-50",
                bookmarked
                  ? "text-guava-pink hover:bg-guava-pink/10"
                  : "text-muted-foreground hover:bg-muted hover:text-guava-pink",
              ].join(" ")}
            >
              <Heart
                className="size-4"
                weight={bookmarked ? "fill" : "regular"}
              />
            </button>
          ) : null}
        </div>
      </div>

      <h2 className="mt-1 line-clamp-2 text-sm font-semibold tracking-tight text-foreground md:text-base">
        {job.title}
      </h2>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {job.location ? (
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0 text-guava-green" weight="duotone" />
            <span className="truncate">{job.location}</span>
          </span>
        ) : null}
        {workplace ? (
          <span className="rounded-md bg-guava-green/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-guava-green">
            {workplace}
          </span>
        ) : null}
        {salary ? (
          <span className="truncate font-medium text-foreground/80">{salary}</span>
        ) : null}
        {gone ? (
          <span className="rounded-md bg-guava-pink/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-guava-pink">
            Listing gone
          </span>
        ) : null}
        {job.hasFullDescription &&
        (job.atsType === "greenhouse" ||
          job.atsType === "lever" ||
          job.atsType === "ashby") ? (
          <span className="rounded-md bg-guava-green/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-guava-green">
            Full JD
          </span>
        ) : null}
      </div>

      {!isSelected && job.snippet ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {job.snippet}
        </p>
      ) : null}
    </article>
  );
}
