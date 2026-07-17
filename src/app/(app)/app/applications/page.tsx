import type { Metadata } from "next";
import { AppPageShell } from "@/components/app/app-page-shell";
import { TrackerList } from "@/components/applications/tracker-list";

export const metadata: Metadata = {
  title: "Applications",
  robots: { index: false, follow: false },
};

export default function ApplicationsPage() {
  return (
    <AppPageShell
      wide
      title="Applications"
      description="Every package, status, and next step — the retention loop."
    >
      <TrackerList />
    </AppPageShell>
  );
}
