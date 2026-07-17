import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How GuavaJobs handles account data, CVs, and application content for UK and EU job seekers.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-2xl px-4 py-16 md:px-6">
      <Link
        href="/"
        className="text-sm font-medium text-guava-pink hover:opacity-80"
      >
        GuavaJobs
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Privacy</h1>
      <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground">
        <p>
          GuavaJobs stores the account details you provide (such as name and
          email), profile fields, uploaded CVs, and application packages you
          generate or track. We use this data to run the product: search, AI
          assistance, and your tracker.
        </p>
        <p>
          You review AI output before sending anything to an employer. We do not
          sell your CV. Full GDPR-facing policy copy will replace this summary
          before public launch.
        </p>
        <p>
          Questions: contact the address published on the production site when
          live.
        </p>
      </div>
    </main>
  );
}
