"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "@phosphor-icons/react";
import type { JobListItem } from "@/api/types";
import { PaperPanel } from "@/components/ui/paper-panel";
import { formatSalary, jobDetailPath } from "@/lib/jobs";

export function JobCard({ job }: { job: JobListItem }) {
  const salary = formatSalary(
    job.salaryMin,
    job.salaryMax,
    job.salaryCurrency,
  );

  return (
    <Link href={jobDetailPath(job.canonicalKey)} className="group block">
      <PaperPanel className="border-guava-green/15 p-5 transition-[border-color,box-shadow] group-hover:border-guava-green/35 group-hover:shadow-[0_16px_40px_-20px_color-mix(in_oklab,var(--guava-green)_35%,transparent)] md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground group-hover:text-guava-green md:text-lg">
              {job.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>
          </div>
          <ArrowRight
            className="size-5 shrink-0 text-guava-pink opacity-0 transition-opacity group-hover:opacity-100"
            weight="bold"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {job.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-guava-green" weight="duotone" />
              {job.location}
            </span>
          ) : null}
          {salary ? <span>{salary}</span> : null}
          {job.atsType !== "unknown" ? (
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase">
              {job.atsType}
            </span>
          ) : null}
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {job.snippet}
        </p>
      </PaperPanel>
    </Link>
  );
}
