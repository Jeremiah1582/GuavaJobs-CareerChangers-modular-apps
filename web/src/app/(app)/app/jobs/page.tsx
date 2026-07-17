import type { Metadata } from "next";
import { Suspense } from "react";
import { JobFeed } from "@/components/jobs/job-feed";

export const metadata: Metadata = {
  title: "Jobs",
  robots: { index: false, follow: false },
};

function JobsFallback() {
  return (
    <div
      className="h-48 animate-pulse rounded-2xl border border-guava-green/10 bg-white/40 sm:h-64"
      aria-hidden
    />
  );
}

export default function JobsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8">
      <header className="mb-4 shrink-0 space-y-1 sm:mb-5">
        <p className="text-xs font-medium uppercase tracking-widest text-guava-green">
          Jobs
        </p>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl md:text-2xl">
          Choose a listing
        </h1>
        <p className="max-w-[42ch] text-sm text-muted-foreground">
          Search roles, open one to read it, then generate when you are ready.
        </p>
      </header>

      <Suspense fallback={<JobsFallback />}>
        <JobFeed />
      </Suspense>
    </main>
  );
}
