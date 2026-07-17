import type { Metadata } from "next";
import { Suspense } from "react";
import { JobFeed } from "@/components/jobs/job-feed";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingHeader } from "@/components/marketing/landing-header";
import { SoftOrb } from "@/components/marketing/hero-motion";

export const metadata: Metadata = {
  title: "Browse jobs",
  description:
    "Search real job listings on GuavaJobs. Set up a free account to apply.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/jobs" },
};

function JobsFallback() {
  return (
    <div
      className="h-48 animate-pulse rounded-2xl border border-guava-green/10 bg-white/40 sm:h-64"
      aria-hidden
    />
  );
}

export default function PublicJobsPage() {
  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground"
      style={{ background: "var(--wash-hero)" }}
    >
      <SoftOrb className="left-[-10%] top-[8%] z-0 h-64 w-64 bg-guava-pink/12" />
      <SoftOrb className="right-[-8%] top-[40%] z-0 h-72 w-72 bg-guava-green/18" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-2 md:px-6">
        <LandingHeader />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-3 py-6 sm:px-4 sm:py-8 md:px-8">
        <header className="mb-5 shrink-0 space-y-1 sm:mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-guava-green">
            Public jobs
          </p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
            Browse listings
          </h1>
          <p className="max-w-[48ch] text-sm text-muted-foreground">
            Search roles without an account. Apply opens a free signup so we can
            save the listing to your tracker.
          </p>
        </header>

        <Suspense fallback={<JobsFallback />}>
          <JobFeed mode="public" />
        </Suspense>
      </div>

      <LandingFooter />
    </main>
  );
}
