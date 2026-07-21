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
    <main className="mx-auto box-border flex w-full min-w-0 max-w-full flex-col overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6 md:max-w-6xl md:px-8 md:py-8 lg:h-[100dvh] lg:max-h-[100dvh] lg:min-h-0 lg:overflow-hidden lg:py-6">
      <header className="mb-4 min-w-0 shrink-0 space-y-1 sm:mb-5">
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
        <Suspense fallback={<JobsFallback />}>
          <JobFeed />
        </Suspense>
      </div>
    </main>
  );
}
