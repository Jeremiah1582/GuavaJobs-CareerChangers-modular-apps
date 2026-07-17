import type { Metadata } from "next";
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

  return <JobDetail canonicalKeyParam={canonicalKey} />;
}
