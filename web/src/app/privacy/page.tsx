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
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: 17 July 2026 · Beta / pre-counsel summary
      </p>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            What we store
          </h2>
          <p>
            GuavaJobs stores account details you provide (name, email), profile
            fields, uploaded CVs, and application packages you generate or
            track. We use this data to run search, AI assistance, and your
            tracker.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            AI and honesty
          </h2>
          <p>
            You review AI output before sending anything to an employer. Cover
            letters are grounded in your profile and parsed CV text. We do not
            sell your CV.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Retention (v1 decision)
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Replaced CVs: previous file rows are deactivated; files stay in
              storage until your account is deleted (application snapshots may
              still reference older copies).
            </li>
            <li>
              Application packages and tracker events: retained while your
              account exists.
            </li>
            <li>
              LLM prompt/debug logs: operational retention up to{" "}
              <strong className="font-medium text-foreground">90 days</strong>
              , then deleted or anonymised (tune after beta).
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Account deletion
          </h2>
          <p>
            Self-serve API deletion is not shipped yet. To delete your account
            and associated data, email{" "}
            <a
              className="font-medium text-guava-pink underline-offset-2 hover:underline"
              href="mailto:privacy@guavajobs.app?subject=Account%20deletion%20request"
            >
              privacy@guavajobs.app
            </a>{" "}
            from the address on your account. We aim to complete deletion within
            30 days. You can also start the request from Profile → Account
            deletion.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Processors
          </h2>
          <p>
            Infrastructure includes Supabase (auth, Postgres, storage), hosting
            for the API and web app, optional analytics (PostHog EU), and LLM
            providers via OpenRouter for generation. Job listings may include
            Adzuna data subject to their terms.
          </p>
        </section>
      </div>
    </main>
  );
}
