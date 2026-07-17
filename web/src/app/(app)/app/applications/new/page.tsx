import type { Metadata } from "next";
import { AppPageShell } from "@/components/app/app-page-shell";
import { ManualApplicationForm } from "@/components/applications/manual-form";

export const metadata: Metadata = {
  title: "Add application",
  robots: { index: false, follow: false },
};

export default function NewApplicationPage() {
  return (
    <AppPageShell
      title="Add manually"
      description="Log a role without using an AI credit. Hybrid cover letter is optional later."
    >
      <ManualApplicationForm />
    </AppPageShell>
  );
}
