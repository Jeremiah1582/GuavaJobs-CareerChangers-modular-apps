import type { Metadata } from "next";
import { AppPageShell } from "@/components/app/app-page-shell";
import { JobDetail } from "@/components/jobs/job-detail";

export const metadata: Metadata = {
  title: "Job detail",
  robots: { index: false, follow: false },
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ canonicalKey: string }>;
}) {
  const { canonicalKey } = await params;

  return (
    <AppPageShell title="Role detail" description="Review the listing before you generate a package.">
      <JobDetail canonicalKeyParam={canonicalKey} />
    </AppPageShell>
  );
}
