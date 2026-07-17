import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms of use for GuavaJobs: honest AI-assisted applications you review before sending.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-2xl px-4 py-16 md:px-6">
      <Link
        href="/"
        className="text-sm font-medium text-guava-pink hover:opacity-80"
      >
        GuavaJobs
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Terms</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: 17 July 2026 · Beta / pre-counsel summary
      </p>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            The service
          </h2>
          <p>
            GuavaJobs helps you discover roles, generate application materials
            from your own profile and CV, and track status. Employer
            applications happen on the employer site — we assist; we do not
            auto-submit.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Your responsibility
          </h2>
          <p>
            You are responsible for verifying that every letter and claim matches
            your experience before you apply. Misrepresentation to employers is
            your liability.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Free tier
          </h2>
          <p>
            Free accounts include a monthly AI generation limit. Manual tracking
            remains available. Job listings may include third-party data
            (including Adzuna). Paid plans may be offered later; beta limits may
            change with notice in-product.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Acceptable use
          </h2>
          <p>
            Do not abuse rate limits, attempt to bypass freemium caps, scrape the
            service, or use GuavaJobs to generate knowingly false employment
            claims.
          </p>
        </section>

        <p className="text-sm">
          These terms are a product summary until counsel-approved Terms of
          Service ship for public launch. See also our{" "}
          <Link
            href="/privacy"
            className="font-medium text-guava-pink underline-offset-2 hover:underline"
          >
            Privacy
          </Link>{" "}
          page.
        </p>
      </div>
    </main>
  );
}
