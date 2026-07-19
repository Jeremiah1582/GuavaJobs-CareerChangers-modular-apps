import type { Metadata } from "next";
import { AppPageShell } from "@/components/app/app-page-shell";
import { DraftReview } from "@/components/applications/draft-review";

export const metadata: Metadata = {
  title: "Application",
  robots: { index: false, follow: false },
};

export default async function ApplicationDraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppPageShell
      wide
      title="Application"
      description="Review materials, apply externally, then track what happens next."
    >
      <DraftReview applicationId={id} />
    </AppPageShell>
  );
}
