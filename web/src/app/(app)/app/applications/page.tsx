import Link from "next/link";
import type { Metadata } from "next";
import {
  AppPageShell,
  AppPlaceholderCard,
} from "@/components/app/app-page-shell";
import { SpringCta } from "@/components/marketing/spring-cta";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Applications",
  robots: { index: false, follow: false },
};

export default function ApplicationsPage() {
  return (
    <AppPageShell
      title="Applications"
      description="Every package, status, and snapshot in one calm tracker."
    >
      <Reveal delay={0.06}>
        <AppPlaceholderCard
          title="Tracker ships in M3"
          body="Generate and review land in M2 first. Then GET /applications will power your pipeline view here."
          action={
            <div className="flex flex-wrap gap-3">
              <SpringCta href="/app/jobs" variant="pink">
                Preview jobs
              </SpringCta>
              <Link
                href="/app/profile"
                className="inline-flex items-center rounded-xl border border-guava-green/25 bg-white/70 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-guava-green/45"
              >
                Profile & quota
              </Link>
            </div>
          }
        />
      </Reveal>
    </AppPageShell>
  );
}
