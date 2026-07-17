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
      <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground">
        <p>
          GuavaJobs helps you discover roles, generate application materials from
          your own profile and CV, and track status. You are responsible for
          verifying that every letter and claim matches your experience before
          you apply.
        </p>
        <p>
          Free accounts include a monthly AI generation limit. Manual tracking
          remains available within product rules. Job listings may include
          third-party data (including Adzuna). Employer applications happen on
          the employer site.
        </p>
        <p>
          These terms are a placeholder summary until counsel-approved Terms of
          Service ship for launch.
        </p>
      </div>
    </main>
  );
}
