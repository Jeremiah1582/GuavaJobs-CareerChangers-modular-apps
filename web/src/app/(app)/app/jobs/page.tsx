import type { Metadata } from "next";
import { AppPageShell } from "@/components/app/app-page-shell";
import { JobFeed } from "@/components/jobs/job-feed";

export const metadata: Metadata = {
  title: "Jobs",
  robots: { index: false, follow: false },
};

export default function JobsPage() {
  return (
    <AppPageShell
      title="Jobs"
      description="Search live listings, see fit before you generate, and open employer apply links when you are ready."
    >
      <JobFeed />
    </AppPageShell>
  );
}
