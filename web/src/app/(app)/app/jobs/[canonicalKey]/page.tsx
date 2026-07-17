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
    <AppPageShell
      title="Role detail"
      description="One primary action: generate an honest application package from your profile and CV."
    >
      <JobDetail canonicalKeyParam={canonicalKey} />
    </AppPageShell>
  );
}
