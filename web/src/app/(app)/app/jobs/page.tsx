import Link from "next/link";
import type { Metadata } from "next";
import {
  AppPageShell,
  AppPlaceholderCard,
} from "@/components/app/app-page-shell";
import { SpringCta } from "@/components/marketing/spring-cta";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Jobs",
  robots: { index: false, follow: false },
};

export default function JobsPage() {
  return (
    <AppPageShell
      title="Jobs"
      description="Search real listings, see fit before you generate, and open employer apply links when you are ready."
    >
      <Reveal delay={0.06}>
        <AppPlaceholderCard
          title="Feed arrives in M2"
          body="Your profile and CV are ready. We are wiring the Adzuna-powered search, fit signals, and generate flow next."
          action={
            <div className="flex flex-wrap gap-3">
              <SpringCta href="/app/profile" variant="green">
                Check profile
              </SpringCta>
              <Link
                href="/"
                className="inline-flex items-center rounded-xl border border-guava-pink/25 bg-white/70 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-guava-pink/45"
              >
                Back to home
              </Link>
            </div>
          }
        />
      </Reveal>
    </AppPageShell>
  );
}
