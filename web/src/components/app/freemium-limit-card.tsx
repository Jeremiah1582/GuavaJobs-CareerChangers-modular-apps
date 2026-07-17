"use client";

import Link from "next/link";
import { PaperPanel } from "@/components/ui/paper-panel";

/** Calm freemium limit panel for profile / empty generate states (no payments CTA). */
export function FreemiumLimitCard({
  used,
  limit,
}: {
  used: number;
  limit: number | null;
}) {
  if (limit == null) return null;
  const atLimit = used >= limit;
  if (!atLimit) return null;

  return (
    <PaperPanel className="border-guava-pink/25 bg-guava-pink/5 p-5 md:p-6">
      <h2 className="text-base font-semibold tracking-tight">
        AI limit reached this period
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Free accounts include{" "}
        <span className="font-mono text-foreground">
          {used} / {limit}
        </span>{" "}
        AI generations per month. You can still browse jobs and track roles
        manually — paid upgrades come after we tune the free tier with real
        usage.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/app/applications/new"
          className="inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Log an application manually
        </Link>
        <Link
          href="/app/jobs"
          className="inline-flex rounded-xl border border-guava-green/25 bg-white px-4 py-2.5 text-sm font-medium"
        >
          Browse jobs
        </Link>
      </div>
    </PaperPanel>
  );
}
