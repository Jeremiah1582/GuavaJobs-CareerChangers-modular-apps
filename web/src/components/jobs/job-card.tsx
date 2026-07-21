"use client";

import { MapPin } from "@phosphor-icons/react";
import type { JobListItem } from "@/api/types";
import { formatSalary } from "@/lib/jobs";

type JobCardProps = {
  job: JobListItem;
  isSelected?: boolean;
  onSelect: (canonicalKey: string) => void;
};

export function JobCard({ job, isSelected = false, onSelect }: JobCardProps) {
  const salary = formatSalary(
    job.salaryMin,
    job.salaryMax,
    job.salaryCurrency,
  );

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
        isSelected
          ? "border-guava-green/45 bg-guava-green/8 ring-1 ring-guava-green/20"
          : "border-border/80 bg-white/80 hover:border-guava-green/30 hover:bg-guava-green/5",
      ].join(" ")}
    >
      <p className="truncate text-xs text-muted-foreground">{job.company}</p>
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
        {salary ? <span className="truncate">{salary}</span> : null}
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
